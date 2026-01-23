from pydantic import BaseModel
from typing import Optional


class JobCreateResponse(BaseModel):
    job_id: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str


class JobResultResponse(BaseModel):
    job_id: str
    pdb_url: str
    plddt: float
    ddg: float
    ipae: float