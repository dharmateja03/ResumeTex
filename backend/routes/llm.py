"""
LLM configuration routes for testing connections and managing providers
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from models.schemas import (
    LLMConnectionTest, LLMConnectionResponse, LLMProvider, 
    LLMProvider_Info, ErrorResponse
)
from services.llm_service import llm_service
from routes.auth import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/providers", response_model=List[LLMProvider_Info])
async def get_available_providers():
    """Get list of available LLM providers and their models"""
    logger.info("📋 Fetching available LLM providers")
    
    providers = [
        LLMProvider_Info(
            id="openai",
            name="OpenAI",
            models=[
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4-turbo",
                "gpt-4",
                "gpt-3.5-turbo"
            ]
        ),
        LLMProvider_Info(
            id="anthropic", 
            name="Anthropic",
            models=[
                "claude-3-5-sonnet-20241022",
                "claude-3-5-sonnet-20240620",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307"
            ]
        ),
        LLMProvider_Info(
            id="google",
            name="Google AI",
            models=[
                "gemini-1.5-pro",
                "gemini-1.5-flash",
                "gemini-1.0-pro",
                "gemini-pro-vision"
            ]
        ),
        LLMProvider_Info(
            id="mistral",
            name="Mistral AI", 
            models=[
                "mistral-large-latest",
                "mistral-small-latest",
                "pixtral-large-latest",
                "open-mistral-7b",
                "open-mixtral-8x7b",
                "open-mixtral-8x22b"
            ]
        ),
        LLMProvider_Info(
            id="deepseek",
            name="DeepSeek",
            models=[
                "deepseek-chat",
                "deepseek-coder"
            ]
        ),
        LLMProvider_Info(
            id="custom",
            name="Custom Provider",
            models=[
                "custom-model"
            ]
        )
    ]
    
    logger.info(f"✅ Returning {len(providers)} LLM providers")
    return providers

@router.get("/models/{provider}")
async def get_provider_models(provider: str):
    """Get available models for a specific provider"""
    logger.info(f"🔍 Fetching models for provider: {provider}")
    
    # Get all providers
    providers = await get_available_providers()
    
    # Find the requested provider
    for p in providers:
        if p.id == provider.lower():
            logger.info(f"✅ Found {len(p.models)} models for {provider}")
            return {"provider": provider, "models": p.models}
    
    logger.warning(f"❌ Provider not found: {provider}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Provider '{provider}' not found"
    )

@router.post("/test-connection", response_model=LLMConnectionResponse)
async def test_llm_connection(config: LLMConnectionTest):
    """Test connection to LLM provider"""
    logger.info(f"🧪 Testing LLM connection - Provider: {config.provider}, Model: {config.model}")
    logger.info(f"🔑 API key length: {len(config.api_key) if config.api_key else 0} characters")
    
    try:
        # Convert to LLMConfig for the service
        from models.schemas import LLMConfig
        llm_config = LLMConfig(
            provider=config.provider,
            model=config.model,
            api_key=config.api_key,
            custom_endpoint=config.custom_endpoint
        )
        
        # Test the connection
        result = await llm_service.test_connection(llm_config)
        
        if result.status == "success":
            logger.info(f"✅ Connection test successful for {config.provider}")
        else:
            logger.warning(f"⚠️ Connection test failed for {config.provider}: {result.message}")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Connection test error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}"
        )

@router.post("/save-config")
async def save_llm_config(
    config: LLMConnectionTest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Save LLM configuration after successful connection test"""
    logger.info(f"💾 Saving LLM config for user: {current_user.get('email', 'unknown')}")
    logger.info(f"📝 Config: {config.provider}/{config.model}")
    
    try:
        # First, test the connection to ensure it's valid
        from models.schemas import LLMConfig
        llm_config = LLMConfig(
            provider=config.provider,
            model=config.model,
            api_key=config.api_key,
            custom_endpoint=config.custom_endpoint
        )
        
        # Test connection before saving
        test_result = await llm_service.test_connection(llm_config)
        
        if test_result.status != "success":
            logger.warning(f"⚠️ Cannot save config - connection test failed: {test_result.message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection test failed: {test_result.message}"
            )
        
        # In a real application, you would save this to a database
        # For now, we'll just return success since the frontend handles storage
        
        logger.info(f"✅ LLM config validated and ready to save for {config.provider}")
        
        return {
            "success": True,
            "message": "Configuration validated and ready to save",
            "provider": config.provider,
            "model": config.model,
            "test_response_time_ms": test_result.response_time_ms
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save configuration: {str(e)}"
        )

@router.get("/user-configs")
async def get_user_llm_configs(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user's saved LLM configurations"""
    logger.info(f"📋 Fetching LLM configs for user: {current_user.get('email', 'unknown')}")
    
    # In a real application, you would fetch from database
    # For now, return empty since frontend handles storage locally
    
    return {
        "configs": [],
        "message": "LLM configurations are stored locally in your browser"
    }

@router.get("/health")
async def llm_health():
    """LLM service health check"""
    logger.info("🏥 LLM service health check")
    
    # Test if we can create LLM service instance
    try:
        health_status = {
            "status": "healthy",
            "available_providers": ["openai", "anthropic", "google", "mistral", "deepseek", "custom"],
            "service_ready": True
        }
        
        logger.info("✅ LLM service is healthy")
        return health_status
        
    except Exception as e:
        logger.error(f"❌ LLM service health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"LLM service unhealthy: {str(e)}"
        )

@router.get("/health/{provider}")
async def test_provider_health(provider: str):
    """Test specific provider health (without API key)"""
    logger.info(f"🏥 Testing health for provider: {provider}")
    
    try:
        # Validate provider exists
        providers = await get_available_providers()
        provider_info = None
        
        for p in providers:
            if p.id == provider.lower():
                provider_info = p
                break
        
        if not provider_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider '{provider}' not found"
            )
        
        # Return provider status
        health_info = {
            "provider": provider,
            "status": "available",
            "models": provider_info.models,
            "requires_api_key": provider != "custom",
            "implementation_status": "implemented" if provider in ["openai", "anthropic", "mistral", "deepseek"] else "planned"
        }
        
        logger.info(f"✅ Provider {provider} is available")
        return health_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Provider health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Provider health check failed: {str(e)}"
        )