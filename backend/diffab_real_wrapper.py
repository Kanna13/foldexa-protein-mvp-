
import argparse
import subprocess
import os
import shutil
import yaml

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input PDB path")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--num_designs", type=int, default=5, help="Number of designs (ignored for now, config controls it)")
    args, unknown = parser.parse_known_args()

    print(f"[Wrapper] Starting Original DiffAb...")
    print(f"[Wrapper] Input: {args.input}")
    print(f"[Wrapper] Output: {args.output}")

    # Ensure output dir exists
    os.makedirs(args.output, exist_ok=True)

    # 1. Modify Config to point to mounted weights
    base_config_path = "/app/configs/test/codesign_single.yml"
    with open(base_config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Point to mounted weights: /weights/codesign_single.pt
    # If not found, fallback to internal default, but user said "Weights" folder is mounted
    if os.path.exists("/weights/codesign_single.pt"):
        print("[Wrapper] Found mounted weights at /weights/codesign_single.pt")
        config['model']['checkpoint'] = "/weights/codesign_single.pt"
    else:
        print("[Wrapper] WARNING: Mounted weights not found, trying default ./trained_models/...")
    
    # Write temp config
    temp_config_path = "/tmp/run_config.yml"
    with open(temp_config_path, 'w') as f:
        yaml.dump(config, f)

    # 2. Construct Command
    # python diffab/tools/runner/design_for_pdb.py INPUT --config TEMP_CONFIG --out_root OUTPUT --device cpu
    cmd = [
        "python",
        "diffab/tools/runner/design_for_pdb.py",
        args.input,
        "--config", temp_config_path,
        "--out_root", args.output,
        "--device", "cpu",   # Force CPU for Mac compatibility
        "--tag", "diffab_run",
        "--batch_size", "1"  # Small batch for CPU
    ]

    print(f"[Wrapper] Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    print(result.stdout)
    if result.returncode != 0:
        import sys
        print(f"[Wrapper] Error: {result.stderr}", file=sys.stderr)
        exit(result.returncode)

    # 3. Move results to expected output location if needed
    # The script outputs to args.output/config_name_tag/...
    # backend expects simple PDBs in args.output
    # We walk the subdirs and copy PDBs up
    print("[Wrapper] Flattening output structure...")
    for root, dirs, files in os.walk(args.output):
        for file in files:
            if file.endswith(".pdb") and "reference" not in file:
                src = os.path.join(root, file)
                dst = os.path.join(args.output, f"diffab_{file}")
                shutil.copy(src, dst)
                print(f"[Wrapper] Copied frame: {file}")

    print("[Wrapper] Done.")

if __name__ == "__main__":
    main()
