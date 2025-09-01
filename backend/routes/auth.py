"""
Authentication routes for Google SSO and development bypass
"""
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.schemas import GoogleAuthRequest, AuthResponse, ErrorResponse
import os
from typing import Optional, Dict, Any
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables explicitly
import pathlib
backend_dir = pathlib.Path(__file__).parent.parent
env_file = backend_dir / '.env.development'
load_dotenv(env_file)
logger.info(f"🔧 Loading .env from: {env_file}")
logger.info(f"   Environment file exists: {env_file.exists()}")

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Development mode flag
DEV_MODE = os.getenv("ENVIRONMENT", "development") == "development"

# Google SSO Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Debug: Check if environment variables are loaded
logger.info(f"🔧 Environment variables loaded:")
logger.info(f"   GOOGLE_CLIENT_ID: {'✅ Set' if GOOGLE_CLIENT_ID else '❌ Not set'}")
logger.info(f"   GOOGLE_CLIENT_SECRET: {'✅ Set' if GOOGLE_CLIENT_SECRET else '❌ Not set'}")
logger.info(f"   DEV_MODE: {DEV_MODE}")

class AuthService:
    """Authentication service"""
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = user_data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"🔑 Created access token for user: {user_data.get('email', 'unknown')}")
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("⚠️ Token expired")
            return None
        except jwt.JWTError:
            logger.warning("⚠️ Invalid token")
            return None
    
    @staticmethod
    async def verify_google_token(id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token"""
        
        if DEV_MODE:
            # Mock Google token verification for development
            logger.info("🔧 DEV MODE: Mocking Google token verification")
            return {
                "email": "dev@example.com",
                "name": "Development User",
                "picture": "https://via.placeholder.com/100",
                "sub": "dev-user-123"
            }
        
        # Production Google token verification
        try:
            # Verify token with Google's tokeninfo endpoint
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                )
                
                if response.status_code != 200:
                    logger.error("❌ Google token verification failed")
                    return None
                
                token_data = response.json()
                
                # Verify audience (client ID)
                if token_data.get("aud") != GOOGLE_CLIENT_ID:
                    logger.error("❌ Invalid Google token audience")
                    return None
                
                # Verify issuer
                if token_data.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                    logger.error("❌ Invalid Google token issuer")
                    return None
                
                # Extract user info
                user_data = {
                    "sub": token_data.get("sub"),
                    "email": token_data.get("email"),
                    "name": token_data.get("name"),
                    "picture": token_data.get("picture"),
                    "email_verified": token_data.get("email_verified", False)
                }
                
                logger.info(f"✅ Google token verified for user: {user_data['email']}")
                return user_data
                
        except Exception as e:
            logger.error(f"❌ Google token verification error: {str(e)}")
            return None

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user"""
    
    # Development bypass
    if DEV_MODE and credentials.credentials.startswith("dev-token-"):
        logger.info("🔧 DEV MODE: Using development bypass token")
        return {
            "user_id": "dev-user",
            "email": "dev@example.com",
            "name": "Development User"
        }
    
    # Verify JWT token
    payload = AuthService.verify_token(credentials.credentials)
    if payload is None:
        logger.warning(f"❌ Invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

# Optional dependency (doesn't raise exception if no auth)
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google SSO"""
    logger.info("🔐 Google authentication attempt")
    
    try:
        # Verify Google ID token
        google_user = await AuthService.verify_google_token(request.id_token)
        
        if not google_user:
            logger.error("❌ Invalid Google ID token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google ID token"
            )
        
        # Create user data
        user_data = {
            "user_id": google_user["sub"],
            "email": google_user["email"],
            "name": google_user["name"],
            "picture": google_user.get("picture"),
            "auth_provider": "google",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Create access token
        access_token = AuthService.create_access_token(user_data)
        
        logger.info(f"✅ Google authentication successful for: {user_data['email']}")
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_info=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Google authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    logger.info(f"👋 User logout: {current_user.get('email', 'unknown')}")
    
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    logger.info(f"👤 User info request: {current_user.get('email', 'unknown')}")
    
    return {
        "user": current_user,
        "authenticated": True,
        "auth_provider": current_user.get("auth_provider", "unknown")
    }

@router.post("/dev/bypass", response_model=AuthResponse)
async def development_bypass():
    """Development authentication bypass (only works in dev mode)"""
    
    if not DEV_MODE:
        logger.warning("⚠️ Development bypass attempted in production mode")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development bypass not available in production"
        )
    
    logger.info("🔧 DEV MODE: Using authentication bypass")
    
    # Create mock user data
    user_data = {
        "user_id": "dev-user-123",
        "email": "dev@example.com",
        "name": "Development User",
        "picture": "https://via.placeholder.com/100",
        "auth_provider": "development",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Create access token
    access_token = AuthService.create_access_token(user_data)
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_info=user_data
    )

@router.post("/google/callback", response_model=AuthResponse)
async def google_oauth_callback(request: dict):
    """Handle Google OAuth callback"""
    logger.info("🔐 Google OAuth callback received")
    
    try:
        code = request.get("code")
        redirect_uri = request.get("redirect_uri")
        
        if not code:
            logger.error("❌ No authorization code provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No authorization code provided"
            )
        
        # Log the request details for debugging
        logger.info(f"🔄 Exchanging code for tokens:")
        logger.info(f"   Client ID: {GOOGLE_CLIENT_ID}")
        logger.info(f"   Redirect URI: {redirect_uri}")
        logger.info(f"   Code (first 10 chars): {code[:10]}...")
        
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_data = {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                error_details = token_response.text
                logger.error(f"❌ Token exchange failed: {token_response.status_code}")
                logger.error(f"❌ Google error response: {error_details}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange authorization code: {error_details}"
                )
            
            token_data = token_response.json()
            id_token = token_data.get("id_token")
            
            if not id_token:
                logger.error("❌ No ID token in response")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No ID token received"
                )
            
            # Verify the ID token
            google_user = await AuthService.verify_google_token(id_token)
            
            if not google_user:
                logger.error("❌ Invalid Google ID token")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID token"
                )
            
            # Create user data
            user_data = {
                "user_id": google_user["sub"],
                "email": google_user["email"],
                "name": google_user["name"],
                "picture": google_user.get("picture"),
                "auth_provider": "google",
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Create access token
            access_token = AuthService.create_access_token(user_data)
            
            logger.info(f"✅ Google OAuth authentication successful for: {user_data['email']}")
            
            return AuthResponse(
                access_token=access_token,
                token_type="bearer",
                user_info=user_data
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Google OAuth callback error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed"
        )

@router.get("/health")
async def auth_health():
    """Authentication health check"""
    return {
        "status": "healthy",
        "dev_mode": DEV_MODE,
        "token_expiry_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
    }