"""
ATS Analysis Routes
Provides free ATS checking functionality with optional authentication for full results.
"""
import logging
import os
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from typing import Dict, Any, Optional

from routes.auth import get_current_user_optional
from services.document_parser import document_parser
from services.ats_analyzer import ats_analyzer

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


def get_ats_llm_config():
    """Get ATS LLM config at runtime (not import time)"""
    return {
        "provider": os.getenv("ATS_LLM_PROVIDER", "openrouter"),
        "model": os.getenv("ATS_LLM_MODEL", "deepseek/deepseek-chat"),
        "api_key": os.getenv("ATS_LLM_API_KEY", "")
    }


@router.post("/analyze")
async def analyze_ats(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Analyze resume for ATS compatibility - FREE for all users.

    - Always returns: score, summary, first 2 suggestions
    - Authenticated users get: full keyword analysis, formatting issues,
      sections detected, missing skills, action verbs, all suggestions
    """
    is_authenticated = current_user is not None
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'

    logger.info(f"ATS analysis request from {user_email} (authenticated: {is_authenticated})")

    # Get LLM config at runtime
    ats_config = get_ats_llm_config()

    # Validate server-side API key is configured
    if not ats_config.get("api_key"):
        logger.error(f"ATS_LLM_API_KEY not configured. Provider: {ats_config.get('provider')}, Model: {ats_config.get('model')}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ATS service temporarily unavailable. Please try again later."
        )

    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )

        # Check file size
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # Check file type
        file_type = document_parser.detect_file_type(file.filename, file.content_type)
        if file_type == 'unknown':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload PDF, DOCX, or LaTeX (.tex) file."
            )

        logger.info(f"Processing {file_type} file: {file.filename} ({len(file_bytes)} bytes)")

        # Extract text from document
        resume_text, detected_type = await document_parser.extract_text(
            file_bytes, file.filename, file.content_type
        )

        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract enough text from the document. Please ensure the file is not empty or corrupted."
            )

        logger.info(f"Extracted {len(resume_text)} characters from {detected_type}")

        # Run ATS analysis with server-side API key
        analysis_result = await ats_analyzer.analyze_resume(
            resume_text=resume_text,
            job_description=job_description,
            llm_config=ats_config
        )

        # Build response based on authentication status
        response = {
            "score": analysis_result.score,
            "is_authenticated": is_authenticated,
            "summary": analysis_result.summary,
            "file_type": detected_type,
        }

        if is_authenticated:
            # Full results for authenticated users
            response.update({
                "keyword_analysis": analysis_result.keyword_analysis,
                "formatting_issues": analysis_result.formatting_issues,
                "sections_detected": analysis_result.sections_detected,
                "missing_skills": analysis_result.missing_skills,
                "action_verbs": analysis_result.action_verbs,
                "suggestions": analysis_result.suggestions,
            })
        else:
            # Limited results for unauthenticated users
            response.update({
                "keyword_analysis": None,
                "formatting_issues": None,
                "sections_detected": None,
                "missing_skills": None,
                "action_verbs": None,
                # Only first 2 suggestions
                "suggestions": analysis_result.suggestions[:2] if analysis_result.suggestions else [],
                "locked_features": [
                    "Full keyword analysis",
                    "Formatting issue details",
                    "Section detection",
                    "Missing skills list",
                    "Action verb analysis",
                    "All improvement suggestions"
                ]
            })

        logger.info(f"ATS analysis complete. Score: {analysis_result.score}/100 for {user_email}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/health")
async def ats_health():
    """ATS service health check"""
    config = get_ats_llm_config()
    return {
        "status": "healthy" if config.get("api_key") else "degraded",
        "service": "ats-analyzer",
        "supported_formats": list(document_parser.SUPPORTED_FORMATS),
        "llm_provider": config.get("provider"),
        "llm_model": config.get("model"),
        "api_key_configured": bool(config.get("api_key"))
    }
