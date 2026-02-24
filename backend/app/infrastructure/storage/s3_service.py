"""
Storage service for managing artifacts in S3/MinIO.

Supports both local docker-compose (minio:9000, HTTP) and
Railway production (minio:9000 internal hostname, HTTP).
SSL is controlled explicitly via MINIO_USE_SSL env var.
"""
from minio import Minio
from minio.error import S3Error
from io import BytesIO
from pathlib import Path
from typing import BinaryIO, Optional
import logging
from urllib.parse import urlparse

from app.core.config import settings

logger = logging.getLogger(__name__)


def _parse_endpoint(raw_endpoint: str) -> str:
    """Strip http:// or https:// from endpoint, return bare host:port."""
    parsed = urlparse(raw_endpoint)
    if parsed.netloc:
        return parsed.netloc  # e.g. "minio:9000" from "http://minio:9000"
    return raw_endpoint       # e.g. "minio:9000" if no scheme given


class StorageService:
    """Abstraction for object storage operations."""
    
    def __init__(self):
        endpoint_clean = _parse_endpoint(settings.s3_endpoint)
        
        # SSL is ONLY enabled if explicitly set via MINIO_USE_SSL=true.
        # Internal Railway networking uses HTTP — never auto-detect from scheme.
        is_secure = settings.s3_use_ssl

        logger.info(
            f"Initializing MinIO client: endpoint={endpoint_clean}, "
            f"secure={is_secure}, bucket={settings.s3_bucket_name}"
        )

        self.client = Minio(
            endpoint=endpoint_clean,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            secure=is_secure,
        )
        self.bucket_name = settings.s3_bucket_name
    
    def validate_connection(self, timeout_seconds: int = 10):
        """
        Validate MinIO connection on startup.
        Logs clear error if unreachable. Uses thread-based timeout
        (portable — works on Linux, macOS, Docker Alpine, Windows).
        """
        from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

        def _check():
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket '{self.bucket_name}' verified and accessible.")

        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_check)
                future.result(timeout=timeout_seconds)
        except FuturesTimeout:
            msg = f"MinIO connection timed out after {timeout_seconds}s at {settings.s3_endpoint}"
            logger.error(f"CRITICAL: {msg}")
            raise RuntimeError(msg)
        except S3Error as e:
            logger.error(f"CRITICAL: MinIO S3 error at {settings.s3_endpoint} — {e}")
            raise RuntimeError(f"MinIO connection failed: {e}")
        except Exception as e:
            logger.error(f"CRITICAL: Cannot reach MinIO at {settings.s3_endpoint} — {e}")
            raise RuntimeError(f"MinIO connection failed: {e}")
    
    def upload_file(self, file_path: str, s3_key: str) -> str:
        """Upload a file to S3."""
        try:
            self.client.fput_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
                file_path=file_path,
            )
            logger.info(f"Uploaded {file_path} to {s3_key}")
            return s3_key
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise
    
    def upload_fileobj(self, file_obj: BinaryIO, s3_key: str, length: int) -> str:
        """Upload a file-like object to S3."""
        try:
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
                data=file_obj,
                length=length,
            )
            logger.info(f"Uploaded file object to {s3_key}")
            return s3_key
        except S3Error as e:
            logger.error(f"Error uploading file object: {e}")
            raise
    
    def download_file(self, s3_key: str, local_path: str) -> str:
        """Download a file from S3 to local path."""
        try:
            self.client.fget_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
                file_path=local_path,
            )
            logger.info(f"Downloaded {s3_key} to {local_path}")
            return local_path
        except S3Error as e:
            logger.error(f"Error downloading file: {e}")
            raise
    
    def get_object(self, s3_key: str) -> bytes:
        """Get object as bytes."""
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
            )
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Error getting object: {e}")
            raise
    
    def delete_object(self, s3_key: str):
        """Delete an object from S3."""
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
            )
            logger.info(f"Deleted {s3_key}")
        except S3Error as e:
            logger.error(f"Error deleting object: {e}")
            raise
    
    def get_presigned_url(self, s3_key: str, expires_seconds: int = 3600) -> str:
        """Generate a presigned URL for temporary access."""
        try:
            from datetime import timedelta
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=s3_key,
                expires=timedelta(seconds=expires_seconds),
            )
            # In local docker-compose, browsers can't reach 'minio:9000',
            # so rewrite to localhost. In Railway, the internal hostname
            # is used only server-side; presigned URLs go through the
            # public domain which MinIO handles natively.
            if settings.s3_endpoint in ["http://minio:9000", "minio:9000"]:
                url = url.replace("minio:9000", "localhost:9000")
                
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise


# Global instance — created at import time, but validate_connection()
# is called explicitly from app lifespan (main.py).
storage_service = StorageService()
