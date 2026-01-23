"""
Resume Optimizer FastAPI Application
Production-ready with proper error handling, logging, and CORS configuration.
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
from dotenv import load_dotenv

from routes.auth import router as auth_router
from routes.llm import router as llm_router
from routes.optimize import router as optimize_router
from routes.download import router as download_router
from routes.analytics import router as analytics_router
from routes.history import router as history_router
from routes.ats import router as ats_router
from routes.resume_beta import router as resume_beta_router
from database import init_db

# Load environment variables
load_dotenv()

# Configure logging based on environment
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
environment = os.getenv("ENVIRONMENT", "development")

logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ] + ([logging.FileHandler("app.log")] if environment == "development" else [])
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info(f"🚀 Resume Optimizer API starting up in {environment} mode...")
    logger.info(f"📊 Log level set to: {log_level}")

    # Initialize database
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")

    yield
    logger.info("🛑 Resume Optimizer API shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="ResumeTex API",
    description="AI-powered resume optimization platform with Google SSO and LaTeX processing",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if environment == "development" else None,
    redoc_url="/redoc" if environment == "development" else None
)

# Production security middleware - disabled for Railway compatibility
# Railway uses internal hosts for health checks that we can't predict
# if environment == "production":
#     allowed_hosts = os.getenv("ALLOWED_HOSTS", "*").split(",")
#     app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS middleware - permissive for development
if environment == "production":
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://yourdomain.com").split(",")
else:
    # Development: Allow all origins
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if environment == "production" else False,  # credentials not compatible with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(llm_router, prefix="/llm", tags=["LLM Configuration"])
app.include_router(optimize_router, prefix="/optimize", tags=["Resume Optimization"])
app.include_router(download_router, prefix="/download", tags=["File Downloads"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(history_router, prefix="/history", tags=["History"])
app.include_router(ats_router, prefix="/ats", tags=["ATS Analysis"])
app.include_router(resume_beta_router, prefix="/resume_beta", tags=["Resume Beta"])

# Global error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP {exc.status_code} error at {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.error(f"Validation error at {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error at {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred" if environment == "production" else str(exc)
        }
    )

# Static file serving for frontend
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve static files if frontend build exists
if os.path.exists("frontend_build"):
    app.mount("/static", StaticFiles(directory="frontend_build/static"), name="static")
    
    @app.get("/")
    async def serve_frontend():
        """Serve the React frontend"""
        return FileResponse("frontend_build/index.html")
    
    # Catch-all route for React Router
    @app.get("/{full_path:path}")
    async def serve_react_routes(full_path: str):
        """Serve React app for all non-API routes"""
        # Don't interfere with API routes
        if full_path.startswith(("auth/", "llm/", "optimize/", "download/", "analytics/", "history/", "ats/", "resume_beta/", "health", "metrics", "docs")):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse("frontend_build/index.html")
else:
    # API-only mode
    @app.get("/")
    async def root():
        """Root endpoint with API information"""
        return {
            "name": "ResumeTex API",
            "version": "1.0.0",
            "description": "AI-powered resume optimization platform",
            "status": "online",
            "environment": environment,
            "frontend_url": "Deploy frontend separately for full application"
        }

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    import time
    import redis
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": environment,
        "services": {}
    }
    
    # Check Redis connection (optional in development)
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            r = redis.from_url(redis_url)
            r.ping()
            health_status["services"]["redis"] = "healthy"
        except Exception as e:
            health_status["services"]["redis"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"
    else:
        health_status["services"]["redis"] = "not configured (optional)"
    
    # Check environment variables
    required_vars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SECRET_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        health_status["services"]["config"] = f"missing variables: {', '.join(missing_vars)}"
        health_status["status"] = "degraded"
    else:
        health_status["services"]["config"] = "healthy"
    
    return health_status

@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint for monitoring"""
    import psutil
    import time
    
    return {
        "timestamp": time.time(),
        "uptime": time.time() - psutil.boot_time(),
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent
    }

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for monitoring"""
    import time
    start_time = time.time()
    
    # Log request
    logger.info(f"📨 {request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"📤 {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    return response

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8001))
    logger.info(f"🚀 Starting Resume Optimizer API on port {port}")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )