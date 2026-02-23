"""
Storage service for managing artifacts in S3/MinIO.
"""
from minio import Minio
from minio.error import S3Error
from io import BytesIO
from pathlib import Path
from typing import BinaryIO, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Abstraction for object storage operations."""
    
    def __init__(self):
        # Determine secure flag automatically from endpoint URL
        is_secure = settings.s3_endpoint.startswith("https://") or settings.s3_use_ssl
        
        self.client = Minio(
            endpoint=settings.s3_endpoint.replace("http://", "").replace("https://", ""),
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            secure=is_secure,
        )
        self.bucket_name = settings.s3_bucket_name
        # Validation moved to explicit call during app startup
    
    def validate_connection(self):
        """Strictly validate connection to MinIO/S3 on startup."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket {self.bucket_name} already exists.")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to connect to MinIO at {settings.s3_endpoint}. Error: {e}")
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
            # Support local docker vs public URLs automatically
            # If the application is connecting to the internal docker 'minio:9000' endpoint,
            # browsers need this to be 'localhost:9000' to download it.
            # If it's a Railway public URL (e.g. minio-production.up.railway.app), do not replace.
            if settings.s3_endpoint in ["http://minio:9000", "minio:9000"]:
                url = url.replace("minio:9000", "localhost:9000")
                
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise


# Global instance
storage_service = StorageService()
