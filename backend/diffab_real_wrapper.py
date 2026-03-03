
import argparse
import subprocess
import os
import shutil
import yaml
from pathlib import Path

DIFFAB_ROOT = Path(os.environ.get("DIFFAB_ROOT", "/workspace/code/diffab"))
WEIGHTS_DIR = Path(os.environ.get("WEIGHTS_DIR", "/workspace/weights/diffab"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input PDB path")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--num_designs", type=int, default=5)
    args, unknown = parser.parse_known_args()

    print(f"[Wrapper] Starting Original DiffAb...")
    print(f"[Wrapper] DIFFAB_ROOT = {DIFFAB_ROOT}")
    print(f"[Wrapper] WEIGHTS_DIR = {WEIGHTS_DIR}")
    print(f"[Wrapper] Input: {args.input}")
    print(f"[Wrapper] Output: {args.output}")

    os.makedirs(args.output, exist_ok=True)

    # 1. Load the base config from the DiffAb source tree
    base_config_path = DIFFAB_ROOT / "configs" / "test" / "codesign_single.yml"
    print(f"[Wrapper] Loading config: {base_config_path}")
    with open(base_config_path, 'r') as f:
        config = yaml.safe_load(f)

    # 2. Point config to the baked-in weights
    weight_file = WEIGHTS_DIR / "codesign_single.pt"
    if weight_file.exists():
        print(f"[Wrapper] Using weights: {weight_file}")
        config['model']['checkpoint'] = str(weight_file)
    else:
        print(f"[Wrapper] WARNING: Weight file not found at {weight_file}, using default")

    # 3. Write temp config
    temp_config_path = "/tmp/run_config.yml"
    with open(temp_config_path, 'w') as f:
        yaml.dump(config, f)

    # 4. Run DiffAb inference
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

    print(f"[Wrapper] Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    print(result.stdout)
    if result.returncode != 0:
        import sys
        print(f"[Wrapper] Error: {result.stderr}", file=sys.stderr)
        exit(result.returncode)

    # 5. Flatten output structure — copy PDBs up to output root
    print("[Wrapper] Flattening output structure...")
    for root, dirs, files in os.walk(args.output):
        for file in files:
            if file.endswith(".pdb") and "reference" not in file and root != args.output:
                src = os.path.join(root, file)
                dst = os.path.join(args.output, f"diffab_{file}")
                shutil.copy(src, dst)
                print(f"[Wrapper] Copied: {file}")

    print("[Wrapper] Done.")


if __name__ == "__main__":
    main()
