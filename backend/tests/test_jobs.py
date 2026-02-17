import requests
import time

BASE = "http://127.0.0.1:8000"

def test_full_job_flow():
    files = {"file": open("tests/fixtures/test.pdb", "rb")}
    r = requests.post(f"{BASE}/jobs", files=files)
    assert r.status_code == 200
    job_id = r.json()["job_id"]

    r = requests.get(f"{BASE}/jobs/{job_id}")
    assert r.json()["status"] in ["running", "done"]

    time.sleep(5)

    r = requests.get(f"{BASE}/jobs/{job_id}/results")
    assert "result_file" in r.json()