"""
Resume optimization routes - main functionality
"""
import logging
import uuid
import asyncio
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from models.schemas import (
    OptimizationRequest, OptimizationResponse, OptimizationStatus,
    OptimizationResult, ErrorResponse
)
from pydantic import BaseModel
from services.llm_service import llm_service
from services.cache_service import cache_service
from services.tex_parser import latex_parser
from services.pdf_generator import pdf_generator
from routes.auth import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store for optimization status (in production, use Redis or database)
optimization_status_store: Dict[str, Dict[str, Any]] = {}

class CompileLatexRequest(BaseModel):
    tex_content: str
    optimization_id: Optional[str] = None

@router.post("/", response_model=OptimizationResponse)
async def optimize_resume(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
):
    """Main resume optimization endpoint"""
    user_email = 'anonymous'
    optimization_id = str(uuid.uuid4())
    
    logger.info(f"🎯 Starting resume optimization for {user_email}")
    logger.info(f"📊 Request details - ID: {optimization_id}, Company: {request.company_name}")
    logger.info(f"📄 Input sizes - LaTeX: {len(request.tex_content)} chars, Job desc: {len(request.job_description)} chars")
    
    try:
        # Initialize optimization status
        optimization_status_store[optimization_id] = {
            "status": "processing",
            "progress": 0,
            "message": "Starting optimization...",
            "created_at": datetime.now(),
            "user_email": user_email,
            "company_name": request.company_name,
            "job_description": request.job_description,
            "custom_instructions": request.custom_instructions,
            "original_tex": request.tex_content,
            "llm_provider": request.llm_config.provider.value,
            "llm_model": request.llm_config.model
        }
        
        # Validate LaTeX content
        logger.info(f"🔍 Validating LaTeX content for {optimization_id}")
        parse_result = latex_parser.parse_latex(request.tex_content)
        
        if not parse_result.is_valid:
            logger.error(f"❌ Invalid LaTeX content: {parse_result.errors}")
            optimization_status_store[optimization_id]["status"] = "failed"
            optimization_status_store[optimization_id]["error"] = f"Invalid LaTeX: {', '.join(parse_result.errors)}"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid LaTeX content: {', '.join(parse_result.errors)}"
            )
        
        # Update progress
        optimization_status_store[optimization_id]["progress"] = 20
        optimization_status_store[optimization_id]["message"] = "LaTeX validated, checking cache..."
        
        # Check cache for existing optimization
        logger.info(f"🔍 Checking cache for optimization {optimization_id}")
        cached_result = await cache_service.get_optimization_result(
            request.tex_content,
            request.job_description, 
            request.llm_config.provider.value,
            request.llm_config.model
        )
        
        if cached_result:
            logger.info(f"🎯 Found cached optimization result for {optimization_id}")
            
            # Ensure cached result includes job details
            enhanced_cached_result = {
                **cached_result,
                'job_description': request.job_description,
                'company_name': request.company_name,
                'custom_instructions': request.custom_instructions,
                'original_tex': request.tex_content
            }
            
            # Update status to completed with cached result
            optimization_status_store[optimization_id].update({
                "status": "completed",
                "progress": 100,
                "message": "Optimization completed (from cache)",
                "result": enhanced_cached_result,
                "cached": True
            })
            
            # Start background PDF generation
            background_tasks.add_task(
                generate_pdf_background,
                optimization_id,
                cached_result['optimized_tex'],
                request.company_name
            )
            
            return OptimizationResponse(
                optimization_id=optimization_id,
                status="completed",
                estimated_time_seconds=1
            )
        
        # No cache hit, start background processing
        background_tasks.add_task(
            process_optimization_background,
            optimization_id,
            request
        )
        
        logger.info(f"🚀 Background optimization started for {optimization_id}")
        
        return OptimizationResponse(
            optimization_id=optimization_id,
            status="processing",
            estimated_time_seconds=30
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Optimization request failed: {str(e)}")
        
        if optimization_id in optimization_status_store:
            optimization_status_store[optimization_id]["status"] = "failed"
            optimization_status_store[optimization_id]["error"] = str(e)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(e)}"
        )

async def process_optimization_background(optimization_id: str, request: OptimizationRequest):
    """Background task for processing optimization"""
    logger.info(f"🔄 Background processing started for {optimization_id}")
    
    try:
        # Update progress
        optimization_status_store[optimization_id]["progress"] = 40
        optimization_status_store[optimization_id]["message"] = "Calling LLM API..."
        
        # Load system prompt
        system_prompt = await load_system_prompt()
        
        # Call LLM service
        logger.info(f"📤 Sending to LLM for optimization {optimization_id}")
        llm_result = await llm_service.optimize_resume(
            request.tex_content,
            request.job_description,
            system_prompt,
            request.llm_config
        )
        
        # Update progress
        optimization_status_store[optimization_id]["progress"] = 70
        optimization_status_store[optimization_id]["message"] = "LLM processing completed, validating result..."
        
        # Validate optimization result
        optimized_tex = llm_result['optimized_tex']
        
        # Log the complete LLM-generated LaTeX code
        logger.info(f"📝 COMPLETE LLM-GENERATED LaTeX CODE (ID: {optimization_id}):")
        logger.info("=" * 80)
        logger.info(optimized_tex)
        logger.info("=" * 80)
        logger.info(f"📊 LLM generated {len(optimized_tex)} characters of LaTeX")
        
        validation_result = latex_parser.validate_optimization_result(
            request.tex_content,
            optimized_tex
        )
        
        if not validation_result['is_valid']:
            logger.error(f"❌ Optimization result validation failed for {optimization_id}")
            optimization_status_store[optimization_id]["status"] = "failed"
            optimization_status_store[optimization_id]["error"] = "Generated LaTeX is invalid"
            return
        
        # Cache the result with job details
        logger.info(f"💾 Caching optimization result for {optimization_id}")
        status_data = optimization_status_store[optimization_id]
        enhanced_result = {
            **llm_result,
            'job_description': status_data.get("job_description"),
            'company_name': status_data.get("company_name"),
            'custom_instructions': status_data.get("custom_instructions"),
            'original_tex': status_data.get("original_tex")
        }
        
        await cache_service.cache_optimization_result(
            request.tex_content,
            request.job_description,
            request.llm_config.provider.value,
            request.llm_config.model,
            enhanced_result
        )
        
        # Update progress
        optimization_status_store[optimization_id]["progress"] = 85
        optimization_status_store[optimization_id]["message"] = "Generating PDF..."
        
        # Generate PDF
        pdf_result = await pdf_generator.compile_latex_to_pdf(
            optimized_tex,
            optimization_id,
            request.company_name
        )
        
        if not pdf_result['success']:
            logger.error(f"❌ PDF generation failed for {optimization_id}")
            optimization_status_store[optimization_id]["status"] = "failed"
            optimization_status_store[optimization_id]["error"] = "PDF generation failed"
            return
        
        # Cache PDF path
        await cache_service.cache_pdf_file(optimization_id, pdf_result['pdf_path'])
        
        # Complete optimization with all details
        final_result = {
            **enhanced_result,  # This already includes job details
            'pdf_info': pdf_result,
            'validation': validation_result,
            'optimization_id': optimization_id
        }
        
        optimization_status_store[optimization_id].update({
            "status": "completed",
            "progress": 100,
            "message": "Optimization completed successfully",
            "result": final_result,
            "cached": False,
            "completed_at": datetime.now()
        })
        
        logger.info(f"✅ Optimization completed successfully for {optimization_id}")
        
    except Exception as e:
        logger.error(f"❌ Background optimization failed for {optimization_id}: {str(e)}")
        optimization_status_store[optimization_id]["status"] = "failed"
        optimization_status_store[optimization_id]["error"] = str(e)

async def generate_pdf_background(optimization_id: str, optimized_tex: str, company_name: str):
    """Background task for PDF generation from cached result"""
    logger.info(f"📄 Generating PDF in background for {optimization_id}")
    
    try:
        pdf_result = await pdf_generator.compile_latex_to_pdf(
            optimized_tex,
            optimization_id,
            company_name
        )
        
        if pdf_result['success']:
            await cache_service.cache_pdf_file(optimization_id, pdf_result['pdf_path'])
            logger.info(f"✅ Background PDF generation completed for {optimization_id}")
        else:
            logger.error(f"❌ Background PDF generation failed for {optimization_id}")
            
    except Exception as e:
        logger.error(f"❌ Background PDF generation error for {optimization_id}: {str(e)}")

@router.get("/{optimization_id}/status", response_model=OptimizationStatus)
async def get_optimization_status(optimization_id: str):
    """Get optimization status"""
    logger.info(f"📊 Status check for optimization {optimization_id}")
    
    if optimization_id not in optimization_status_store:
        logger.warning(f"❌ Optimization not found: {optimization_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found"
        )
    
    status_data = optimization_status_store[optimization_id]
    
    response = OptimizationStatus(
        optimization_id=optimization_id,
        status=status_data["status"],
        progress=status_data["progress"],
        message=status_data.get("message"),
        error=status_data.get("error")
    )
    
    # Add result URL if completed
    if status_data["status"] == "completed":
        response.result_url = f"/optimize/{optimization_id}/result"
    
    logger.info(f"📊 Status: {status_data['status']} ({status_data['progress']}%) for {optimization_id}")
    return response

@router.get("/{optimization_id}/result", response_model=OptimizationResult)
async def get_optimization_result(optimization_id: str):
    """Get optimization result"""
    logger.info(f"📋 Getting result for optimization {optimization_id}")
    
    if optimization_id not in optimization_status_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found"
        )
    
    status_data = optimization_status_store[optimization_id]
    
    if status_data["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Optimization not completed. Status: {status_data['status']}"
        )
    
    result = status_data.get("result", {})
    
    # Get PDF download URL if available
    pdf_download_url = None
    pdf_path = await cache_service.get_pdf_path(optimization_id)
    if pdf_path:
        pdf_download_url = f"/download/{optimization_id}"
    
    processing_stats = {
        "processing_time_seconds": result.get("processing_time_seconds"),
        "input_chars": result.get("input_chars"),
        "output_chars": result.get("output_chars"),
        "provider": result.get("provider"),
        "model": result.get("model"),
        "cached": status_data.get("cached", False)
    }
    
    logger.info(f"✅ Returning result for optimization {optimization_id}")
    
    return OptimizationResult(
        optimization_id=optimization_id,
        status="completed",
        optimized_tex=result.get("optimized_tex"),
        original_tex=status_data.get("original_tex"),
        job_description=status_data.get("job_description"),
        company_name=status_data.get("company_name"),
        custom_instructions=status_data.get("custom_instructions"),
        pdf_download_url=pdf_download_url,
        processing_stats=processing_stats
    )

async def load_system_prompt() -> str:
    """Load system prompt from file"""
    try:
        prompt_path = Path(__file__).parent.parent.parent / "latex_system_prompt.txt"
        
        if prompt_path.exists():
            with open(prompt_path, 'r', encoding='utf-8') as f:
                prompt = f.read().strip()
                logger.info(f"📜 Loaded system prompt ({len(prompt)} chars)")
                return prompt
        else:
            logger.warning("⚠️ System prompt file not found, using default")
            return """
CRITICAL INSTRUCTIONS:
- Output ONLY valid, compilable LaTeX code
- No explanations, comments, or markdown
- Complete document from \\documentclass to \\end{document}

OPTIMIZATION REQUIREMENTS:
1. Update experience descriptions for job relevance
2. Reorder technical skills matching job requirements  
3. Incorporate ATS-friendly keywords
4. Maintain professional LaTeX formatting
5. Ensure proper page fitting
""".strip()
            
    except Exception as e:
        logger.error(f"❌ Error loading system prompt: {str(e)}")
        raise

@router.delete("/{optimization_id}")
async def delete_optimization(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Delete optimization and cleanup files"""
    logger.info(f"🗑️ Deleting optimization {optimization_id}")
    
    if optimization_id not in optimization_status_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found"
        )
    
    try:
        # Remove from status store
        del optimization_status_store[optimization_id]
        
        # Remove cached PDF
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        if pdf_path and Path(pdf_path).exists():
            Path(pdf_path).unlink()
            logger.info(f"🗑️ Deleted PDF file: {pdf_path}")
        
        logger.info(f"✅ Optimization {optimization_id} deleted successfully")
        return {"message": "Optimization deleted successfully"}
        
    except Exception as e:
        logger.error(f"❌ Error deleting optimization {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete optimization"
        )

@router.post("/compile-latex")
async def compile_latex(request: CompileLatexRequest):
    """Compile edited LaTeX code to PDF"""
    compile_id = request.optimization_id or str(uuid.uuid4())
    logger.info(f"🔨 Compiling edited LaTeX code for {compile_id}")
    
    try:
        # Validate the LaTeX content
        parse_result = latex_parser.parse_latex(request.tex_content)
        
        if not parse_result.is_valid:
            logger.error(f"❌ Invalid LaTeX content for compilation: {parse_result.errors}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid LaTeX content: {', '.join(parse_result.errors)}"
            )
        
        logger.info(f"📄 LaTeX content validated, compiling to PDF...")
        
        # Generate PDF from the edited LaTeX
        pdf_result = await pdf_generator.compile_latex_to_pdf(
            request.tex_content,
            compile_id,
            "edited_resume"  # default company name for manual compilations
        )
        
        if not pdf_result['success']:
            logger.error(f"❌ PDF compilation failed for {compile_id}: {pdf_result.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PDF compilation failed: {pdf_result.get('error', 'Unknown error')}"
            )
        
        # Cache the PDF file
        await cache_service.cache_pdf_file(compile_id, pdf_result['pdf_path'])
        
        # Update the optimization status if it exists
        if compile_id in optimization_status_store:
            optimization_status_store[compile_id]["pdf_updated"] = datetime.now()
            optimization_status_store[compile_id]["manual_compile"] = True
        
        logger.info(f"✅ LaTeX compilation completed successfully for {compile_id}")
        
        return {
            "success": True,
            "message": "LaTeX compiled successfully",
            "compile_id": compile_id,
            "pdf_download_url": f"/download/{compile_id}",
            "pdf_info": pdf_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ LaTeX compilation error for {compile_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compilation failed: {str(e)}"
        )

@router.get("/health")
async def optimization_health():
    """Optimization service health check"""
    logger.info("🏥 Optimization service health check")
    
    try:
        # Check if services are initialized
        services_status = {
            "llm_service": "ready",
            "cache_service": "ready", 
            "latex_parser": "ready",
            "pdf_generator": await pdf_generator.initialize()
        }
        
        active_optimizations = len([
            opt for opt in optimization_status_store.values()
            if opt["status"] == "processing"
        ])
        
        health_info = {
            "status": "healthy",
            "services": services_status,
            "active_optimizations": active_optimizations,
            "total_optimizations": len(optimization_status_store)
        }
        
        logger.info("✅ Optimization service is healthy")
        return health_info
        
    except Exception as e:
        logger.error(f"❌ Optimization service health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Optimization service unhealthy: {str(e)}"
        )