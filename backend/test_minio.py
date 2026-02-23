from minio import Minio
from minio.error import S3Error
import sys

endpoint = "minio-production-6206.up.railway.app"
access_key = "minioadmin"
secret_key = "minioadmin123"
bucket = "foldexa-artifacts"
secure = True

print(f"Connecting to MinIO at {endpoint}...")
client = Minio(
    endpoint=endpoint,
    access_key=access_key,
    secret_key=secret_key,
    secure=secure,
)

try:
    print(f"Checking if bucket {bucket} exists...")
    exists = client.bucket_exists(bucket)
    if exists:
        print(f"✅ Bucket {bucket} exists and is accessible!")
    else:
        print(f"⚠️ Bucket {bucket} does not exist. Creating...")
        client.make_bucket(bucket)
        print(f"✅ Created bucket {bucket}!")
except S3Error as e:
    print(f"❌ S3 Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unknown Error: {e}")
    sys.exit(1)
