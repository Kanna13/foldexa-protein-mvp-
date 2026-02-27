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
# DiffAb:
RUN git clone https://github.com/luost26/diffab.git /app/diffab
# DiffAb typically downloads its own weights during the first run or via a specific script.
# We will create an empty directory for weights, and users can mount them or the script will download.
RUN mkdir -p /app/weights/diffab

# RFdiffusion:
RUN git clone https://github.com/RosettaCommons/RFdiffusion.git /app/rfdiffusion
RUN mkdir -p /app/weights/rfdiffusion
# Optionally, download RFDiffusion base weights directly to image if required:
# RUN wget -qO /app/weights/rfdiffusion/Base_ckpt.pt http://files.ipd.uw.edu/pub/RFdiffusion/6f5902ac237024bdd0c176cb93063dc4/Base_ckpt.pt

# RunPod entrypoint
CMD ["python", "handler.py"]
