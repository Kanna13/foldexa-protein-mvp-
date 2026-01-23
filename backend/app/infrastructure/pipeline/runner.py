import time
import shutil
import os

RESULT_DIR = "app/storage/results"
os.makedirs(RESULT_DIR, exist_ok=True)

def run_pipeline(job_id: str, input_path: str):
    print("Running pipeline on", input_path)

    time.sleep(5)  # тут потом будет DiffAb / RFdiffusion

    output_path = os.path.join(RESULT_DIR, f"{job_id}.pdb")
    shutil.copy(input_path, output_path)

    return {
        "result_file": output_path,
        "plddt": 0.88,
        "ddg": -3.4
    }