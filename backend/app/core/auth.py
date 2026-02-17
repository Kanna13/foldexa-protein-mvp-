"""
Authentication and authorization middleware.
"""
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from datetime import datetime, timedelta
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthService:
    """Handle JWT-based authentication."""
    
    @staticmethod
    def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm="HS256"
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify JWT token and return user_id."""
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=["HS256"]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.JWTError as e:
            logger.warning(f"Invalid token: {e}")
            return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[str]:
    """
    Dependency to get current authenticated user.
    Returns None if no auth provided (for optional auth).
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    user_id = AuthService.verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id


async def require_auth(
    user_id: Optional[str] = Depends(get_current_user)
) -> str:
    """
    Dependency that requires authentication.
    Raises 401 if not authenticated.
    """
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
