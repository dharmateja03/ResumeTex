"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# LLM Provider Types
class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    DEEPSEEK = "deepseek"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"

# Authentication Schemas
class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Google ID token")

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: Dict[str, Any]

# LLM Configuration Schemas
class LLMConnectionTest(BaseModel):
    provider: LLMProvider
    api_key: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    custom_endpoint: Optional[str] = None

class LLMConnectionResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: str
    response_time_ms: Optional[int] = None

class LLMConfig(BaseModel):
    provider: LLMProvider
    model: str
    api_key: str
    custom_endpoint: Optional[str] = None

class LLMProvider_Info(BaseModel):
    id: str
    name: str
    models: List[str]

# Optimization Schemas
class OptimizationRequest(BaseModel):
    tex_content: str = Field(..., min_length=10, description="LaTeX resume content")
    job_description: str = Field(..., min_length=10, description="Job description")
    company_name: str = Field(..., min_length=1, description="Company name")
    custom_instructions: Optional[str] = Field(None, description="Additional AI instructions")
    llm_config: LLMConfig
    generate_cold_email: bool = Field(default=False, description="Generate cold email (max 250 words)")
    generate_cover_letter: bool = Field(default=False, description="Generate cover letter")

class OptimizationResponse(BaseModel):
    optimization_id: str
    status: str = "processing"
    estimated_time_seconds: Optional[int] = None

class OptimizationStatus(BaseModel):
    optimization_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: int = Field(..., ge=0, le=100)
    message: Optional[str] = None
    result_url: Optional[str] = None
    error: Optional[str] = None

class OptimizationResult(BaseModel):
    optimization_id: str
    status: str
    optimized_tex: Optional[str] = None
    original_tex: Optional[str] = None
    job_description: Optional[str] = None
    company_name: Optional[str] = None
    custom_instructions: Optional[str] = None
    pdf_download_url: Optional[str] = None
    latex_download_url: Optional[str] = None  # For failed PDF compilations
    error_message: Optional[str] = None  # Error details if status is failed
    cold_email: Optional[str] = None
    cover_letter: Optional[str] = None
    processing_stats: Dict[str, Any]

# Analytics Schemas
class UserStats(BaseModel):
    total_optimizations: int
    optimizations_today: int
    most_recent_optimization: Optional[datetime] = None
    favorite_llm_provider: Optional[str] = None

class OptimizationHistory(BaseModel):
    optimization_id: str
    company_name: str
    created_at: datetime
    llm_provider: str
    status: str

class AnalyticsResponse(BaseModel):
    user_stats: UserStats
    recent_optimizations: List[OptimizationHistory]

# System Health Schemas
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, str]  # service_name: status

class LLMHealthCheck(BaseModel):
    provider: str
    status: str
    response_time_ms: Optional[int] = None
    error: Optional[str] = None

# Error Schemas
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

# File Upload Schemas
class FileInfo(BaseModel):
    filename: str
    size_bytes: int
    content_type: str

class DownloadResponse(BaseModel):
    download_url: str
    expires_at: datetime
    file_info: FileInfo