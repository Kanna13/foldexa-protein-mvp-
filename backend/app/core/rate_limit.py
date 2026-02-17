"""
Rate limiting middleware using Redis.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from typing import Optional
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.
    """
    
    def __init__(self, app, redis_url: str = None, requests_per_minute: int = 60):
        super().__init__(app)
        self.redis_url = redis_url or settings.redis_url
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # seconds
        self._redis = None
    
    async def get_redis(self):
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis
    
    async def dispatch(self, request: Request, call_next):
        """Check rate limit before processing request."""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier (IP or user_id from auth)
        client_id = self._get_client_id(request)
        
        # Check rate limit
        is_allowed = await self._check_rate_limit(client_id)
        
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        response = await call_next(request)
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request."""
        # Try to get user_id from auth header
        auth_header = request.headers.get("authorization")
        if auth_header:
            # In production, decode JWT to get user_id
            # For now, use the token itself
            return f"user:{auth_header[:20]}"
        
        # Fall back to IP address
        client_ip = request.client.host
        return f"ip:{client_ip}"
    
    async def _check_rate_limit(self, client_id: str) -> bool:
        """
        Check if client is within rate limit using sliding window.
        Returns True if allowed, False if rate limit exceeded.
        """
        try:
            redis = await self.get_redis()
            key = f"rate_limit:{client_id}"
            now = time.time()
            window_start = now - self.window_size
            
            # Remove old entries
            await redis.zremrangebyscore(key, 0, window_start)
            
            # Count requests in current window
            request_count = await redis.zcard(key)
            
            if request_count >= self.requests_per_minute:
                logger.warning(f"Rate limit exceeded for {client_id}")
                return False
            
            # Add current request
            await redis.zadd(key, {str(now): now})
            await redis.expire(key, self.window_size)
            
            return True
        
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if Redis is down
            return True
