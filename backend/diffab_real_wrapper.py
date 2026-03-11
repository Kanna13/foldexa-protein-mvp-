
import argparse
import subprocess
import os
import sys
import shutil
import random
import yaml
from pathlib import Path

DIFFAB_ROOT = Path(os.environ.get("DIFFAB_ROOT", "/workspace/code/diffab"))
WEIGHTS_DIR = Path(os.environ.get("WEIGHTS_DIR", "/workspace/weights/diffab"))

# Map UI design_mode → config filename + weight filename
MODE_MAP = {
    "codesign_single":   ("codesign_single.yml",   "codesign_single.pt"),
    "codesign_multicdrs":("codesign_multicdrs.yml", "codesign_multicdrs.pt"),
    "abopt_singlecdr":   ("abopt_singlecdr.yml",    "abopt_singlecdr.pt"),
    "fixedbb_design":    ("fixedbb_design.yml",      "fixedbb_design.pt"),
    "denovo_design":     ("denovo_design.yml",        "denovo_design.pt"),
}


def validate_gpu():
    """Verify GPU is available and log memory stats before execution."""
    print("[Wrapper] Validating GPU hardware...", flush=True)
    try:
        import torch
        if not torch.cuda.is_available():
            print("[Wrapper] ERROR: torch.cuda is NOT available. Failing fast.", flush=True)
            sys.exit(1)
        count = torch.cuda.device_count()
        name  = torch.cuda.get_device_name(0)
        print(f"[Wrapper] GPU Found: {count}x {name}", flush=True)
        print(f"[Wrapper] Mem Summary: {torch.cuda.memory_reserved(0)/1e9:.2f}GB reserved", flush=True)
    except Exception as e:
        print(f"[Wrapper] WARNING: Failed to validate GPU: {e}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Foldexa DiffAb Wrapper")
    parser.add_argument("--input",       required=True,  help="Input PDB path")
    parser.add_argument("--output",      required=True,  help="Output directory")
    parser.add_argument("--design_mode", default="codesign_single", choices=list(MODE_MAP.keys()))
    parser.add_argument("--num_designs", type=int,   default=5,    help="Number of designs to generate")
    parser.add_argument("--temperature", type=float, default=0.5,  help="Sampling temperature")
    parser.add_argument("--device",      default="cuda",            help="Compute device: cuda / cpu / mps")
    parser.add_argument("--no_relax",    action="store_true",       help="Skip PDB energy relaxation")
    parser.add_argument("--no_save_pdb", action="store_true",       help="Skip saving PDB to disk")
    parser.add_argument("--tqdm",        action="store_true",       help="Show tqdm progress bar")
    parser.add_argument("--fix_seed",    action="store_true",       help="Fix random seed for reproducibility")
    args, unknown = parser.parse_known_args()

    config_file, weight_file_name = MODE_MAP.get(args.design_mode, MODE_MAP["codesign_single"])

    print(f"[Wrapper] Starting Foldexa DiffAb (mode={args.design_mode})", flush=True)
    print(f"[Wrapper] DIFFAB_ROOT = {DIFFAB_ROOT}", flush=True)
    print(f"[Wrapper] WEIGHTS_DIR = {WEIGHTS_DIR}", flush=True)
    print(f"[Wrapper] Input:       {args.input}", flush=True)
    print(f"[Wrapper] Output:      {args.output}", flush=True)
    print(f"[Wrapper] Config:      {config_file}", flush=True)
    print(f"[Wrapper] Designs:     {args.num_designs}", flush=True)
    print(f"[Wrapper] Temperature: {args.temperature}", flush=True)
    print(f"[Wrapper] Device:      {args.device}", flush=True)
    print(f"[Wrapper] Relax:       {not args.no_relax}", flush=True)

    if args.fix_seed:
        random.seed(42)
        print("[Wrapper] Fixed random seed=42", flush=True)

    validate_gpu()

    os.makedirs(args.output, exist_ok=True)

    # 1. Load the base config
    base_config_path = DIFFAB_ROOT / "configs" / "test" / config_file
    print(f"[Wrapper] Loading config: {base_config_path}", flush=True)
    with open(base_config_path, "r") as f:
        config = yaml.safe_load(f)

    # 2. Apply UI params to config
    weight_file = WEIGHTS_DIR / weight_file_name
    if weight_file.exists():
        print(f"[Wrapper] Using weights: {weight_file}", flush=True)
        config["model"]["checkpoint"] = str(weight_file)
    else:
        print(f"[Wrapper] WARNING: Weight file not found at {weight_file}, using default", flush=True)

    # Patch sampling params into config
    if "sampling" not in config:
        config["sampling"] = {}
    config["sampling"]["num_samples"]   = args.num_designs
    config["sampling"]["temperature"]   = args.temperature
    if "relax" not in config:
        config["relax"] = {}
    config["relax"]["enabled"]   = not args.no_relax
    config["save_pdb"]           = not args.no_save_pdb
    config["tqdm"]               = args.tqdm

    # 3. Write temp config
    temp_config_path = "/tmp/run_config.yml"
    with open(temp_config_path, "w") as f:
        yaml.dump(config, f)

    # 4. Run DiffAb inference
    runner_script = DIFFAB_ROOT / "diffab" / "tools" / "runner" / "design_for_pdb.py"
    cmd = [
        "python", str(runner_script),
        args.input,
        "--config",     temp_config_path,
        "--out_root",   args.output,
        "--device",     args.device,
        "--tag",        "diffab_run",
        "--batch_size", "1",
    ]

    print(f"[Wrapper] Executing: {' '.join(cmd)}", flush=True)

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        for line in iter(process.stdout.readline, ""):
            print(f"[DiffAb] {line}", end="", flush=True)
        process.stdout.close()
        process.wait(timeout=2700)   # 45-minute hard timeout (tripled from 900s)

        if process.returncode != 0:
            print(f"[Wrapper] Error: exit code {process.returncode}", file=sys.stderr, flush=True)
            sys.exit(process.returncode)

    except subprocess.TimeoutExpired:
        process.kill()
        print("[Wrapper] CRITICAL: timed out after 900s", file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as e:
        print(f"[Wrapper] CRITICAL ERROR: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

    # 5. Flatten output — copy PDBs up to output root
    print("[Wrapper] Flattening output structure...", flush=True)
    try:
        for root, dirs, files in os.walk(args.output):
            for file in files:
                if file.endswith(".pdb") and "reference" not in file and root != args.output:
                    src = os.path.join(root, file)
                    dst = os.path.join(args.output, f"diffab_{file}")
                    shutil.copy(src, dst)
                    print(f"[Wrapper] Copied: {file}", flush=True)
    except Exception as e:
        print(f"[Wrapper] WARNING: output flattening failed: {e}", flush=True)

    print("[Wrapper] Done.", flush=True)


if __name__ == "__main__":
    main()
