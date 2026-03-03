
import argparse
import subprocess
import os
import sys
import shutil
import yaml
from pathlib import Path

DIFFAB_ROOT = Path(os.environ.get("DIFFAB_ROOT", "/workspace/code/diffab"))
WEIGHTS_DIR = Path(os.environ.get("WEIGHTS_DIR", "/workspace/weights/diffab"))


def validate_gpu():
    """Verify GPU is available and log memory stats before execution."""
    print("[Wrapper] Validating GPU hardware...", flush=True)
    try:
        import torch
        if not torch.cuda.is_available():
            print("[Wrapper] ERROR: torch.cuda is NOT available. Failing fast.", flush=True)
            sys.exit(1)
            
        count = torch.cuda.device_count()
        name = torch.cuda.get_device_name(0)
        print(f"[Wrapper] GPU Found: {count}x {name}", flush=True)
        print(f"[Wrapper] Mem Summary: {torch.cuda.memory_reserved(0)/1e9:.2f}GB reserved", flush=True)
    except Exception as e:
        print(f"[Wrapper] WARNING: Failed to validate GPU: {e}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input PDB path")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--num_designs", type=int, default=5)
    args, unknown = parser.parse_known_args()

    print(f"[Wrapper] Starting Original DiffAb...", flush=True)
    print(f"[Wrapper] DIFFAB_ROOT = {DIFFAB_ROOT}", flush=True)
    print(f"[Wrapper] WEIGHTS_DIR = {WEIGHTS_DIR}", flush=True)
    print(f"[Wrapper] Input: {args.input}", flush=True)
    print(f"[Wrapper] Output: {args.output}", flush=True)

    validate_gpu()

    os.makedirs(args.output, exist_ok=True)

    # 1. Load the base config from the DiffAb source tree
    base_config_path = DIFFAB_ROOT / "configs" / "test" / "codesign_single.yml"
    print(f"[Wrapper] Loading config: {base_config_path}", flush=True)
    with open(base_config_path, 'r') as f:
        config = yaml.safe_load(f)

    # 2. Point config to the baked-in weights
    weight_file = WEIGHTS_DIR / "codesign_single.pt"
    if weight_file.exists():
        print(f"[Wrapper] Using weights: {weight_file}", flush=True)
        config['model']['checkpoint'] = str(weight_file)
    else:
        print(f"[Wrapper] WARNING: Weight file not found at {weight_file}, using default", flush=True)

    # 3. Write temp config
    temp_config_path = "/tmp/run_config.yml"
    with open(temp_config_path, 'w') as f:
        yaml.dump(config, f)

    # 4. Run DiffAb inference with continuous streaming & timeout
    runner_script = DIFFAB_ROOT / "diffab" / "tools" / "runner" / "design_for_pdb.py"
    cmd = [
        "python",
        str(runner_script),
        args.input,
        "--config", temp_config_path,
        "--out_root", args.output,
        "--device", "cuda",   # Use GPU on RunPod
        "--tag", "diffab_run",
        "--batch_size", "1"
    ]

    print(f"[Wrapper] Executing: {' '.join(cmd)}", flush=True)
    
    try:
        # Use Popen to stream stdout continuously instead of capture_output
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Merge stderr into stdout for cleaner logging
            text=True,
            bufsize=1
        )

        # Stream output line by line as it happens
        for line in iter(process.stdout.readline, ''):
            print(f"[DiffAb] {line}", end='', flush=True)
            
        process.stdout.close()
        process.wait(timeout=900)  # 15 minute hard timeout for inference
        
        if process.returncode != 0:
            print(f"[Wrapper] Error: Inference failed with exit code {process.returncode}", file=sys.stderr, flush=True)
            sys.exit(process.returncode)
            
    except subprocess.TimeoutExpired:
        process.kill()
        print("[Wrapper] CRITICAL ERROR: Inference timed out after 900 seconds. Killed process.", file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as e:
        print(f"[Wrapper] CRITICAL ERROR executing inference: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

    # 5. Flatten output structure — copy PDBs up to output root
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
        print(f"[Wrapper] WARNING: Failed during output flattening: {e}", flush=True)

    print("[Wrapper] Done.", flush=True)


if __name__ == "__main__":
    main()
