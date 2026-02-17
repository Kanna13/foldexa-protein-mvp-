import requests
import time
import os
import sys

# Configuration
API_URL = "http://localhost:8000"
TEST_PDB_PATH = "tests/data/1crn.pdb"  # Ensure this exists or create dummy
POLL_INTERVAL = 2
TIMEOUT = 60

def create_dummy_pdb():
    """Create a valid dummy PDB for testing if not exists."""
    os.makedirs("tests/data", exist_ok=True)
    if not os.path.exists(TEST_PDB_PATH):
        with open(TEST_PDB_PATH, "w") as f:
            f.write(
                "ATOM      1  N   THR A   1      17.047  14.085   3.642  1.00 13.79           N  \n"
                "ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C  \n"
                "ATOM      3  C   THR A   1      15.685  12.755   5.133  1.00  9.19           C  \n"
                "ATOM      4  O   THR A   1      15.268  12.385   6.254  1.00 11.16           O  \n"
                "ATOM      5  CB  THR A   1      18.170  12.703   5.337  1.00 13.56           C  \n"
                "ATOM      6  OG1 THR A   1      19.334  12.829   4.463  1.00 16.48           O  \n"
                "ATOM      7  CG2 THR A   1      18.150  11.546   6.304  1.00 14.19           C  \n"
                "ATOM      8  N   CYS A   2      15.068  13.116   4.004  1.00 10.15           N  \n"
                "ATOM      9  CA  CYS A   2      13.799  13.136   4.689  1.00 11.23           C  \n"
                "ATOM     10  C   CYS A   2      12.551  12.636   4.008  1.00 13.23           C  \n"
                "ATOM     11  O   CYS A   2      11.439  12.755   4.510  1.00 12.33           O  \n"
                "ATOM     12  CB  CYS A   2      13.582  14.542   5.216  1.00 12.44           C  \n"
                "TER\nEND\n"
            )
        print(f"[SETUP] Created dummy PDB at {TEST_PDB_PATH}")

def run_test():
    print("="*60)
    print("FOLDEXA E2E PIPELINE VALIDATION TEST")
    print("="*60)
    
    # 1. Setup
    create_dummy_pdb()
    
    # 2. Upload Job
    print(f"\n[1/5] Uploading Job...")
    with open(TEST_PDB_PATH, "rb") as f:
        files = {"file": ("test.pdb", f, "chemical/x-pdb")}
        data = {"pipeline_type": "diffab_rfdiffusion_af2"}
        try:
            res = requests.post(f"{API_URL}/jobs/", files=files, data=data)
            res.raise_for_status()
            job = res.json()
            job_id = job["job_id"]
            print(f"✅ Job Created! ID: {job_id}")
            print(f"   Status: {job['status']}")
        except Exception as e:
            print(f"❌ Upload Failed: {e}")
            sys.exit(1)
            
    # 3. Poll Status
    print(f"\n[2/5] Polling Execution Status (Timeout: {TIMEOUT}s)...")
    start_time = time.time()
    while True:
        if time.time() - start_time > TIMEOUT:
            print("❌ Timeout waiting for job completion")
            sys.exit(1)
            
        res = requests.get(f"{API_URL}/jobs/{job_id}")
        if res.status_code != 200:
            print(f"❌ Failed to get status: {res.text}")
            break
            
        status_data = res.json()
        current_status = status_data["status"]
        print(f"   -> Status: {current_status}")
        
        if current_status == "completed":
            print("✅ Job Competed Successfully!")
            break
        elif current_status == "failed":
            print(f"❌ Job Failed: {status_data.get('error_message')}")
            sys.exit(1)
            
        time.sleep(POLL_INTERVAL)
        
    # 4. Validate Results
    print(f"\n[3/5] Validating Artifacts...")
    res = requests.get(f"{API_URL}/jobs/{job_id}/results")
    if res.status_code != 200:
        print(f"❌ Failed to get results: {res.text}")
        sys.exit(1)
        
    result = res.json()
    artifacts = result.get("artifacts", [])
    metrics = result.get("metrics", [])
    
    print(f"   Found {len(artifacts)} artifacts")
    print(f"   Found {len(metrics)} metrics")
    
    # Check for expected file types
    pdb_count = sum(1 for a in artifacts if a["artifact_type"] == "pdb")
    if pdb_count >= 1:
         print(f"✅ Found {pdb_count} PDB artifacts (Expected > 0)")
    else:
         print(f"❌ Missing PDB artifacts!")
         sys.exit(1)
         
    # 5. History Check
    print(f"\n[4/5] verifying History...")
    res = requests.get(f"{API_URL}/jobs/")
    history = res.json()
    found = any(j["job_id"] == job_id for j in history)
    if found:
        print(f"✅ Job {job_id} found in history list")
    else:
        print(f"❌ Job not found in history!")
        sys.exit(1)

    print("\n" + "="*60)
    print("✅✅✅ ALL SYSTEMS GO: PIPELINE VALIDATED SUCCESSFULLY ✅✅✅")
    print("="*60)

if __name__ == "__main__":
    run_test()
