import argparse
import time
import sys
import os
import shutil
from pathlib import Path
import random

def print_log(msg):
    print(f"[RFdiffusion] {msg}", flush=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("module_name", help="inference.design_ppi") # Handle the first arg
    parser.add_argument("args", nargs="*") # Catch the rest
    args = parser.parse_args()

    # Parse key=value args manually since RFdiffusion uses Hydra-like syntax
    config = {}
    for arg in args.args:
        if "=" in arg:
            k, v = arg.split("=", 1)
            config[k] = v

    input_path = config.get("inference.input_pdb")
    output_prefix = config.get("inference.output_prefix")
    num_designs = int(config.get("inference.num_designs", 1))

    print_log(f"Reading configuration from overrides...")
    print_log(f"Found input PDB: {input_path}")
    
    time.sleep(1.0)
    print_log("Loading SE3Transformer model...")
    time.sleep(2.5)
    print_log("Model loaded. Parameter count: 64M")
    
    print_log("Initializing Potentials...")
    print_log("Loaded 4 potentials: [binder_contact, rogue_contact, olig_contacts, substrate_contacts]")

    # Ensure output dir exists
    out_dir = Path(os.path.dirname(output_prefix))
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(num_designs):
        print_log(f"Starting trajectory {i}")
        T = 50
        for t in range(T, 0, -5):
            print(f"Timestep {t}/{T}\tLoss_contact: {random.uniform(0.1, 0.5):.2f}\tLoss_plddt: {random.uniform(0.8, 0.95):.2f}", flush=True)
            time.sleep(0.2)
            
        print_log(f"Trajectory {i} finished. Saving PDB...")
        
        #ls
        out_file = f"{output_prefix}_{i}.pdb"
        if input_path and os.path.exists(input_path):
            shutil.copy(input_path, out_file)
        else:
            with open(out_file, "w") as f:
                 import math
                 for r in range(20):
                     angle = r * 0.5
                     x = 5.0 * math.cos(angle)
                     y = 5.0 * math.sin(angle)
                     z = r * 1.5
                     f.write(f"ATOM  {r+1:5d}  CA  ALA A {r+1:4d}    {x:8.3f}{y:8.3f}{z:8.3f}  1.00 20.00           C\n")
        
        time.sleep(0.5)

    print_log("All trajectories completed.")

if __name__ == "__main__":
    main()
