# Setting up S3 (MinIO) on Railway for Foldexa

Foldexa uses S3-compatible storage (like AWS S3 or MinIO) to store uploaded PDB files and generated artifacts.

## Option 1: Use Railway MinIO (Recommended for Testing/MVP)

Since Railway services are isolated, you cannot use `localhost` between them. You need to deploy a MinIO service within your Railway project and link it to the backend.

### Step 1: Add MinIO Service
1. In your Railway project dashboard, click **+ New**.
2. Search for **"MinIO"** (use the official template or Docker image `minio/minio`).
3. Deploy the service.

### Step 2: Configure MinIO Variables
Go to the **Variables** tab of your new MinIO service and set these if they aren't already set by the template:
- `MINIO_ROOT_USER`: `minioadmin` (or any username you prefer)
- `MINIO_ROOT_PASSWORD`: `minioadmin123` (or a strong password)
- `MINIO_Browser`: `on`

### Step 3: Link Backend to MinIO
Go to your **Backend Service** -> **Variables**. Add the following variables:

| Variable | Value (Example) | Notes |
|----------|-----------------|-------|
| `S3_ENDPOINT` | `${{ MinIO.RAILWAY_INTERNAL_URL }}` | Use Railway's variable reference feature! Type `${{` and select your MinIO service. **Important**: Ensure the port is correct (usually 9000). If the internal URL doesn't include the port, use `http://<SERVICE_NAME>.railway.internal:9000`. |
| `S3_ACCESS_KEY` | `${{ MinIO.MINIO_ROOT_USER }}` | automatic reference |
| `S3_SECRET_KEY` | `${{ MinIO.MINIO_ROOT_PASSWORD }}` | automatic reference |
| `S3_BUCKET_NAME` | `foldexa-artifacts` | The bucket name |
| `S3_USE_SSL` | `false` | Internal traffic is HTTP |

> **Note on Endpoints:** Railway Internal DNS usually looks like `http://minio.railway.internal:9000`. Check the "Networking" tab of your MinIO service to find the **Service Name**.

---

## Option 2: Use AWS S3 / Cloudflare R2 / DigitalOcean Spaces

If you prefer external storage:

1. Create a bucket (e.g., `foldexa-artifacts`).
2. Generate Access Key and Secret Key.
3. In Railway Backend Variables, set:

```env
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com  # or your provider's endpoint
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=wJalr...
S3_BUCKET_NAME=foldexa-artifacts
S3_REGION=us-east-1
S3_USE_SSL=true
```
