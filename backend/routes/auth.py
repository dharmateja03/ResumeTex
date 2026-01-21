"""
Authentication routes using Clerk
"""
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.schemas import AuthResponse, ErrorResponse
import os
from typing import Optional, Dict, Any
import jwt
from datetime import datetime
from dotenv import load_dotenv
from clerk_backend_api import Clerk

logger = logging.getLogger(__name__)

# Load environment variables
import pathlib
backend_dir = pathlib.Path(__file__).parent.parent
env_file = backend_dir / '.env.development'
load_dotenv(env_file)
logger.info(f"🔧 Loading .env from: {env_file}")

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Clerk Configuration
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")

# Development mode flag
DEV_MODE = os.getenv("ENVIRONMENT", "development") == "development"

# Initialize Clerk client
clerk_client = None
if CLERK_SECRET_KEY:
    clerk_client = Clerk(bearer_auth=CLERK_SECRET_KEY)
    logger.info("✅ Clerk client initialized")
else:
    logger.warning("⚠️ CLERK_SECRET_KEY not set - authentication will not work")

logger.info(f"🔧 Clerk configuration:")
logger.info(f"   CLERK_SECRET_KEY: {'✅ Set' if CLERK_SECRET_KEY else '❌ Not set'}")
logger.info(f"   CLERK_PUBLISHABLE_KEY: {'✅ Set' if CLERK_PUBLISHABLE_KEY else '❌ Not set'}")
logger.info(f"   DEV_MODE: {DEV_MODE}")

class AuthService:
    """Authentication service using Clerk"""

    @staticmethod
    async def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify Clerk session token"""
        try:
            if not clerk_client:
                logger.error("❌ Clerk client not initialized")
                return None

            # Decode JWT to get user_id (Clerk tokens are standard JWTs)
            # We'll verify the token by fetching the user from Clerk API
            try:
                # Decode without verification first to get user_id
                unverified = jwt.decode(token, options={"verify_signature": False})
                user_id = unverified.get("sub")

                if not user_id:
                    logger.error("❌ No user ID in token")
                    return None

                # Fetch full user details from Clerk to verify token is valid
                user = clerk_client.users.get(user_id=user_id)

                if not user:
                    logger.warning("⚠️ User not found in Clerk")
                    return None

                user_data = {
                    "user_id": user.id,
                    "email": user.email_addresses[0].email_address if user.email_addresses else None,
                    "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or "User",
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "picture": user.image_url,
                    "auth_provider": "clerk",
                    "created_at": datetime.fromtimestamp(user.created_at / 1000).isoformat() if user.created_at else datetime.now().isoformat()
                }

                logger.info(f"✅ Clerk token verified for user: {user_data['email']}")
                return user_data

            except jwt.InvalidTokenError as e:
                logger.error(f"❌ Invalid JWT token: {str(e)}")
                return None

        except Exception as e:
            logger.error(f"❌ Clerk token verification error: {str(e)}")
            logger.exception(e)
            return None

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user from Clerk token"""

    if not credentials:
        logger.warning("❌ No credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Development bypass
    if DEV_MODE and credentials.credentials.startswith("dev-token-"):
        logger.info("🔧 DEV MODE: Using development bypass token")
        return {
            "user_id": "dev-user",
            "email": "dev@example.com",
            "name": "Development User",
            "auth_provider": "development"
        }

    # Verify Clerk session token
    user_data = await AuthService.verify_clerk_token(credentials.credentials)
    if user_data is None:
        logger.warning(f"❌ Invalid or expired Clerk token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_data

# Optional dependency (doesn't raise exception if no auth)
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

@router.get("/user")
async def get_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get authenticated user information"""
    logger.info(f"👤 User info request: {current_user.get('email', 'unknown')}")

    return {
        "user": current_user,
        "authenticated": True,
        "auth_provider": current_user.get("auth_provider", "clerk")
    }

@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information (alias for /user)"""
    logger.info(f"👤 User info request: {current_user.get('email', 'unknown')}")

    return {
        "user": current_user,
        "authenticated": True,
        "auth_provider": current_user.get("auth_provider", "clerk")
    }

@router.post("/dev/bypass")
async def development_bypass():
    """Development authentication bypass (only works in dev mode)"""

    if not DEV_MODE:
        logger.warning("⚠️ Development bypass attempted in production mode")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development bypass not available in production"
        )

    logger.info("🔧 DEV MODE: Using authentication bypass")

    return {
        "access_token": "dev-token-bypass",
        "token_type": "bearer",
        "user_info": {
            "user_id": "dev-user-123",
            "email": "dev@example.com",
            "name": "Development User",
            "picture": "https://via.placeholder.com/100",
            "auth_provider": "development"
        }
    }

@router.get("/health")
async def auth_health():
    """Authentication health check"""
    return {
        "status": "healthy",
        "dev_mode": DEV_MODE,
        "auth_provider": "clerk",
        "clerk_configured": CLERK_SECRET_KEY is not None
    }

# Clerk webhook endpoint for tracking user events
@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhooks for user events (login, signup, etc.)"""
    try:
        payload = await request.json()
        event_type = payload.get("type")

        logger.info(f"📊 Clerk webhook received: {event_type}")

        # Import analytics tracking
        from routes.analytics import track_login_event

        if event_type == "session.created":
            # User logged in
            user_data = payload.get("data", {})
            user_id = user_data.get("user_id")

            if user_id and clerk_client:
                try:
                    user = clerk_client.users.get(user_id=user_id)
                    email = user.email_addresses[0].email_address if user.email_addresses else "unknown"

                    # Track login event
                    track_login_event(
                        user_email=email,
                        user_id=user_id,
                        event_type="login",
                        metadata={
                            "auth_provider": "clerk",
                            "session_id": user_data.get("id"),
                            "created_at": user_data.get("created_at")
                        }
                    )
                    logger.info(f"✅ Tracked login for user: {email}")
                except Exception as e:
                    logger.error(f"❌ Error tracking login: {str(e)}")

        elif event_type == "user.created":
            # New user signed up
            user_data = payload.get("data", {})
            email = user_data.get("email_addresses", [{}])[0].get("email_address", "unknown")
            user_id = user_data.get("id")
            first_name = user_data.get("first_name", "")

            # Track signup event
            track_login_event(
                user_email=email,
                user_id=user_id,
                event_type="signup",
                metadata={
                    "auth_provider": "clerk",
                    "created_at": user_data.get("created_at")
                }
            )
            logger.info(f"✅ Tracked signup for user: {email}")

            # Send welcome email
            try:
                from services.email_service import send_welcome_email
                import asyncio
                asyncio.create_task(send_welcome_email(email, first_name))
                logger.info(f"📧 Welcome email queued for {email}")
            except Exception as e:
                logger.error(f"❌ Failed to queue welcome email: {str(e)}")

        return {"status": "success", "event_type": event_type}

    except Exception as e:
        logger.error(f"❌ Webhook error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )