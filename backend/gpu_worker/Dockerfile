# ============================================================
# Foldexa GPU Worker — RunPod Serverless
# Base image with CUDA + conda for DiffAb / RFdiffusion
# ============================================================

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3-pip python3.11-venv \
    wget curl git \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.11 /usr/bin/python

# Install handler dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy handler
COPY handler.py .

# --- Model Installation ---
# Uncomment and customize for your specific model:
#
# DiffAb:
# RUN git clone https://github.com/YOUR_FORK/diffab.git /app/diffab
# COPY weights/diffab/ /app/weights/diffab/
#
# RFdiffusion:
# RUN git clone https://github.com/RosettaCommons/RFdiffusion.git /app/rfdiffusion
# COPY weights/rfdiffusion/ /app/weights/rfdiffusion/

# RunPod entrypoint
CMD ["python", "handler.py"]
