from fastapi import FastAPI
from app.api.routes import jobs, files

app = FastAPI(
    title="Foldexa API",
    description="AI platform for protein structure generation",
    version="1.0.0"
)

app.include_router(jobs.router)
app.include_router(files.router)

@app.get("/")
def root():
    return {"message": "Foldexa API is running"}