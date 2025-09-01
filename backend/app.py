"""
Resume Optimizer FastAPI Application
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routes.auth import router as auth_router
from routes.llm import router as llm_router
from routes.optimize import router as optimize_router
from routes.download import router as download_router
from routes.analytics import router as analytics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Resume Optimizer API starting up...")
    yield
    logger.info("🛑 Resume Optimizer API shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="Resume Optimizer API",
    description="AI-powered resume optimization for job applications",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(llm_router, prefix="/llm", tags=["LLM Configuration"])
app.include_router(optimize_router, prefix="/optimize", tags=["Resume Optimization"])
app.include_router(download_router, prefix="/download", tags=["File Downloads"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    """Root endpoint"""
    logger.info("📍 Root endpoint accessed")
    return {"message": "Resume Optimizer API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.info("🏥 Health check accessed")
    return {"status": "healthy", "message": "Resume Optimizer API is running"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"❌ Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

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