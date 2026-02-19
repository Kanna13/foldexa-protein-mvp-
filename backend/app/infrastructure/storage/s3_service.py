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
        self.client = Minio(
            endpoint=settings.s3_endpoint.replace("http://", "").replace("https://", ""),
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            secure=settings.s3_use_ssl,
        )
        self.bucket_name = settings.s3_bucket_name
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
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
            # Fix host for browser access (docker internal network vs localhost)
            # If the url contains 'minio', replace it with 'localhost'
            if "minio:9000" in url:
                url = url.replace("minio:9000", "localhost:9000")
            elif "minio" in url: 
                 # Fallback if port is missing or different, though usually it's minio:9000
                url = url.replace("minio", "localhost")
                
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise


# Global instance
storage_service = StorageService()
