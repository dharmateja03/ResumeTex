"""
Resume Beta Routes - Block-based resume analysis and optimization
Handles PDF and LaTeX resume uploads with block-level analysis.
"""
import logging
import os
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from routes.auth import get_current_user
from services.document_parser import document_parser
from services.resume_block_parser import resume_block_parser, ResumeBlock
from services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


class ResumeBlockResponse(BaseModel):
    """Response model for a resume block"""
    section: str
    title: str
    content: str
    block_index: int


class UploadResumeResponse(BaseModel):
    """Response model for resume upload and parsing"""
    file_type: str  # 'pdf' or 'latex'
    blocks: List[ResumeBlockResponse]
    total_blocks: int
    sections_found: List[str]


class BlockSuggestion(BaseModel):
    """AI suggestion for a block"""
    block_id: str  # "{section}_{index}"
    suggestion: str
    improvement_focus: str  # e.g., "action_verbs", "quantifiable_metrics", "clarity"


class BlockSuggestionsResponse(BaseModel):
    """Response model for block suggestions"""
    suggestions: List[BlockSuggestion]


def get_resume_llm_config():
    """Get Resume LLM config at runtime"""
    return {
        "provider": os.getenv("RESUME_LLM_PROVIDER", "openai"),
        "model": os.getenv("RESUME_LLM_MODEL", "gpt-4o"),
        "api_key": os.getenv("RESUME_LLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    }


@router.post("/upload", response_model=UploadResumeResponse)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload a PDF or LaTeX resume and parse it into blocks.

    Returns:
    - file_type: 'pdf' or 'latex'
    - blocks: List of parsed resume blocks
    - sections_found: List of section names (Experience, Education, etc.)
    """
    user_email = current_user.get('email', 'unknown')

    logger.info(f"Resume upload from {user_email}: {file.filename}")

    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        logger.error(f"File too large: {len(content)} bytes")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    try:
        # Extract text from file
        text, file_type = await document_parser.extract_text(
            content,
            file.filename,
            file.content_type
        )

        if file_type not in ['pdf', 'latex']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_type}. Supported: PDF, LaTeX"
            )

        logger.info(f"✓ Extracted {len(text)} characters from {file_type}")

        # Parse into blocks
        blocks = resume_block_parser.parse_resume(text)

        if not blocks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not parse resume. Please check the file format."
            )

        # Get unique sections
        sections_found = list(dict.fromkeys([b.section for b in blocks]))

        # Convert blocks to response format
        block_responses = [
            ResumeBlockResponse(
                section=b.section,
                title=b.title,
                content=b.content,
                block_index=b.block_index
            )
            for b in blocks
        ]

        logger.info(f"✓ Parsed {len(blocks)} blocks in sections: {sections_found}")

        return UploadResumeResponse(
            file_type=file_type,
            blocks=block_responses,
            total_blocks=len(blocks),
            sections_found=sections_found
        )

    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing resume: {str(e)}"
        )


class GetSuggestionsRequest(BaseModel):
    """Request model for getting AI suggestions"""
    blocks: List[ResumeBlockResponse]
    job_description: Optional[str] = None
    custom_instructions: Optional[str] = None


@router.post("/suggestions", response_model=BlockSuggestionsResponse)
async def get_block_suggestions(
    request: GetSuggestionsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI suggestions for resume blocks.

    For each block, generate improvement suggestions based on:
    - Job description (if provided)
    - Custom instructions
    - General resume best practices (action verbs, quantifiable metrics, etc.)
    """
    user_email = current_user.get('email', 'unknown')

    logger.info(f"Getting suggestions for {len(request.blocks)} blocks from {user_email}")

    try:
        llm_config = get_resume_llm_config()
        suggestions = []

        for block in request.blocks:
            # Generate suggestion prompt
            context = []
            if request.job_description:
                context.append(f"Job Description:\n{request.job_description}")
            if request.custom_instructions:
                context.append(f"Custom Instructions:\n{request.custom_instructions}")

            context_str = "\n\n".join(context) if context else "General resume best practices"

            prompt = f"""You are a professional resume optimizer. Analyze this resume block and provide ONE specific, actionable suggestion for improvement.

Section: {block.section}
Title: {block.title}

Current Content:
{block.content}

Context:
{context_str}

Provide a suggestion that:
1. Is specific and actionable
2. Focuses on ONE key improvement (action verbs, metrics, clarity, keywords, etc.)
3. Is 1-2 sentences max

Response format:
SUGGESTION: [Your specific suggestion]
FOCUS: [One of: action_verbs, quantifiable_metrics, clarity, ats_keywords, impact, formatting]
"""

            # Get LLM suggestion
            suggestion_text = await llm_service.call_llm(
                prompt,
                llm_config,
                system_prompt="You are a professional resume optimizer. Provide specific, actionable improvement suggestions."
            )

            # Parse response
            focus = "clarity"
            suggestion = suggestion_text

            if "SUGGESTION:" in suggestion_text:
                parts = suggestion_text.split("FOCUS:")
                suggestion = parts[0].replace("SUGGESTION:", "").strip()
                if len(parts) > 1:
                    focus = parts[1].strip().lower()

            block_id = f"{block.section}_{block.block_index}"
            suggestions.append(BlockSuggestion(
                block_id=block_id,
                suggestion=suggestion,
                improvement_focus=focus
            ))

            logger.info(f"  ✓ Generated suggestion for {block_id}")

        return BlockSuggestionsResponse(suggestions=suggestions)

    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating suggestions: {str(e)}"
        )
