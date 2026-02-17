"""
Docker execution runner for ML models.
Handles container lifecycle, GPU allocation, and result collection.
"""
import subprocess
import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional
import json

from app.core.config import settings
from app.infrastructure.storage.s3_service import storage_service

logger = logging.getLogger(__name__)


class DockerRunner:
    """Execute ML models in isolated Docker containers."""
    
    def __init__(self):
        self.docker_enabled = settings.docker_enabled
        self.gpu_enabled = settings.gpu_enabled
    
    def run_container(
        self,
        image: str,
        command: List[str],
        mounts: Dict[str, str], # {host_volume_or_path: container_path}
        volumes_from: Optional[List[str]] = None, # Inherit volumes from these containers
        environment: Optional[Dict[str, str]] = None,
        gpu: bool = False,
        timeout: int = 3600
    ) -> Dict:
        """
        Run a Docker container using a shared volume strategy (DooD compatible).
        """
        if not self.docker_enabled:
            raise RuntimeError("Docker execution is disabled")
        
        container_name = f"foldexa-job-{os.urandom(4).hex()}"
        
        # 1. Create Container
        create_cmd = ["docker", "create", "--name", container_name]
        
        if gpu and self.gpu_enabled:
            create_cmd.extend(["--gpus", "all"])
            
        if environment:
            for key, value in environment.items():
                create_cmd.extend(["-e", f"{key}={value}"])
        
        # Add mounts
        for source, target in mounts.items():
            create_cmd.extend(["-v", f"{source}:{target}"])
            
        # Add volumes_from
        if volumes_from:
            for container in volumes_from:
                create_cmd.extend(["--volumes-from", container])
                
        create_cmd.append(image)
        create_cmd.extend(command)
        
        # Create the container
        subprocess.run(create_cmd, check=True, capture_output=True)
        
        try:
            # 2. No need to copy inputs (Docker cp) because we rely on shared volumes.
            
            # 3. Start Container (Attach to capture output)
            start_cmd = ["docker", "start", "-a", container_name]
            
            logger.info(f"Executing container {container_name}")
            result = subprocess.run(
                start_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            
            # 4. No need to copy outputs back.

            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "success": result.returncode == 0
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Container execution timed out after {timeout}s")
            subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
            raise
        except Exception as e:
            logger.error(f"Docker execution failed: {e}")
            raise
        finally:
            # 5. Cleanup container
            subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)




class ModelExecutor:
    """High-level interface for executing ML models."""
    
    def __init__(self):
        self.runner = DockerRunner()
        # Resolve Weights directory relative to project root
        # Assuming we are in backend/app/infrastructure/compute/
        # Project root is backend/../../.. -> foldexa-protein-mvp-
        # We want foldexa-protein-mvp-/Weights
        
        # Use container path for weights
        self.weights_dir = "/weights"
        if not os.path.exists(self.weights_dir):
            logger.warning(f"Weights directory not found at {self.weights_dir}")

    async def execute_diffab(
        self,
        job_id: str,
        input_s3_key: str
    ) -> Dict:
        """Execute DiffAb antibody design."""
        logger.info(f"Executing DiffAb for job {job_id}")
        
        # Use shared workspace mounted in worker at /workspace_share
        job_dir = Path(f"/workspace_share/{job_id}")
        if not job_dir.exists():
            job_dir.mkdir(parents=True, exist_ok=True)
            
        try:
            # Download input directly to shared volume
            input_path = job_dir / "input.pdb"
            storage_service.download_file(input_s3_key, str(input_path))
            
            output_dir = job_dir / "outputs"
            output_dir.mkdir(exist_ok=True)
            
            # Run DiffAb container
            # Mount the NAMED volume 'foldexa_workspace_shared' to /workspace inside the model container
            # Inherit /weights from foldexa-worker using volumes_from
            result = self.runner.run_container(
                image="diffab:latest",
                command=[
                    "--input", f"/workspace/{job_id}/input.pdb",
                    "--output", f"/workspace/{job_id}/outputs",
                    "--num_designs", "5",
                ],
                mounts={
                    "foldexa_workspace_shared": "/workspace",
                },
                volumes_from=["foldexa-worker"],
                gpu=True,
                timeout=1800
            )
            
            if not result["success"]:
                raise RuntimeError(f"DiffAb failed: {result['stderr']}")
            
            # Upload outputs
            artifacts = []
            for pdb_file in output_dir.glob("*.pdb"):
                s3_key = f"jobs/{job_id}/diffab/{pdb_file.name}"
                storage_service.upload_file(str(pdb_file), s3_key)
                artifacts.append({
                    "type": "pdb",
                    "s3_key": s3_key,
                    "size": pdb_file.stat().st_size
                })
            
            return {
                "artifacts": artifacts,
                "logs": result["stdout"]
            }
        except Exception as e:
            logger.error(f"DiffAb execution error: {e}")
            raise
        # Optional: cleanup job_dir? keeping for debugging is safer for now.
    
    async def execute_rfdiffusion(
        self,
        job_id: str,
        input_s3_key: str
    ) -> Dict:
        """Execute RFdiffusion protein design."""
        logger.info(f"Executing RFdiffusion for job {job_id}")
        
        job_dir = Path(f"/workspace_share/{job_id}")
        if not job_dir.exists():
            job_dir.mkdir(parents=True, exist_ok=True)
            
        try:
            input_path = job_dir / "input.pdb"
            storage_service.download_file(input_s3_key, str(input_path))
            
            output_dir = job_dir / "outputs"
            output_dir.mkdir(exist_ok=True)
            
            result = self.runner.run_container(
                image="rfdiffusion:latest",
                command=[
                    "inference.design_ppi",
                    f"inference.input_pdb=/workspace/{job_id}/input.pdb",
                    f"inference.output_prefix=/workspace/{job_id}/outputs/design",
                    "inference.num_designs=5",
                ],
                mounts={
                    "foldexa_workspace_shared": "/workspace",
                },
                volumes_from=["foldexa-worker"],
                gpu=True,
                timeout=3600
            )
            
            if not result["success"]:
                raise RuntimeError(f"RFdiffusion failed: {result['stderr']}")
            
            artifacts = []
            for pdb_file in output_dir.glob("*.pdb"):
                s3_key = f"jobs/{job_id}/rfdiffusion/{pdb_file.name}"
                storage_service.upload_file(str(pdb_file), s3_key)
                artifacts.append({
                    "type": "pdb",
                    "s3_key": s3_key,
                    "size": pdb_file.stat().st_size
                })
            
            return {
                "artifacts": artifacts,
                "logs": result["stdout"]
            }
        except Exception as e:
            logger.error(f"RFdiffusion execution error: {e}")
            raise
    
    async def execute_af2_gamma(
        self,
        job_id: str,
        input_s3_key: str
    ) -> Dict:
        """Execute AlphaFold2 Gamma for structure prediction."""
        logger.info(f"Executing AF2 Gamma for job {job_id}")
        
        job_dir = Path(f"/workspace_share/{job_id}")
        if not job_dir.exists():
            job_dir.mkdir(parents=True, exist_ok=True)
            
        try:
            input_path = job_dir / "input.pdb"
            storage_service.download_file(input_s3_key, str(input_path))
            
            output_dir = job_dir / "outputs"
            output_dir.mkdir(exist_ok=True)
            
            result = self.runner.run_container(
                image="af2-gamma:latest",
                command=[
                    "--input", f"/workspace/{job_id}/input.pdb",
                    "--output_dir", f"/workspace/{job_id}/outputs",
                ],
                mounts={
                    "foldexa_workspace_shared": "/workspace",
                },
                volumes_from=["foldexa-worker"],
                gpu=True,
                timeout=7200
            )
            
            if not result["success"]:
                raise RuntimeError(f"AF2 Gamma failed: {result['stderr']}")
            
            # Parse metrics from output
            metrics = self._parse_af2_metrics(str(output_dir))
            
            # Upload artifacts
            artifacts = []
            for pdb_file in output_dir.glob("*.pdb"):
                s3_key = f"jobs/{job_id}/af2/{pdb_file.name}"
                storage_service.upload_file(str(pdb_file), s3_key)
                artifacts.append({
                    "type": "pdb",
                    "s3_key": s3_key,
                    "size": pdb_file.stat().st_size
                })
            
            return {
                "artifacts": artifacts,
                "metrics": metrics,
                "logs": result["stdout"]
            }
        except Exception as e:
            logger.error(f"AF2 execution error: {e}")
            raise
    
    def _parse_af2_metrics(self, output_dir: str) -> Dict:
        """Parse AF2 output metrics."""
        metrics_file = os.path.join(output_dir, "metrics.json")
        if os.path.exists(metrics_file):
            with open(metrics_file) as f:
                return json.load(f)
        
        # FAIL if metrics are missing - no fake data!
        raise FileNotFoundError(f"Metrics file not found at {metrics_file}. Model execution likely failed.")


# Global executor instance
model_executor = ModelExecutor()
