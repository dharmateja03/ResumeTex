"""
Resume optimization routes - main functionality
"""
import logging
import uuid
import asyncio
import os
import time
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

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
from database.models import OptimizationHistory, get_db, SessionLocal
from shared_state import optimization_status_store

logger = logging.getLogger(__name__)

router = APIRouter()

# Import track_token_usage after router definition to avoid circular import
def track_token_usage(*args, **kwargs):
    """Lazy import to avoid circular dependency"""
    from routes.analytics import track_token_usage as _track_token_usage
    return _track_token_usage(*args, **kwargs)

def get_persistent_storage_dir() -> Path:
    """Get persistent storage directory for files"""
    # Use same logic as database - configurable path for deployment
    if os.getenv('RAILWAY_ENVIRONMENT'):
        storage_path = Path('/app/data/optimizations')
    else:
        storage_path = Path(__file__).parent.parent / 'data' / 'optimizations'

    storage_path.mkdir(exist_ok=True, parents=True)
    return storage_path

def save_to_history(
    optimization_id: str,
    user_email: str,
    company_name: str,
    job_description: str,
    original_latex: str,
    optimized_latex: str,
    llm_provider: str,
    llm_model: str,
    status: str,
    pdf_path: Optional[str] = None,
    latex_path: Optional[str] = None,
    error_message: Optional[str] = None,
    cold_email: Optional[str] = None,
    cover_letter: Optional[str] = None,
    processing_time_ms: Optional[int] = None
):
    """Save optimization to database history"""
    try:
        db = SessionLocal()

        # Convert absolute paths to relative paths for portability
        relative_pdf_path = None
        relative_latex_path = None

        if pdf_path:
            pdf_file = Path(pdf_path)
            if pdf_file.exists():
                relative_pdf_path = str(pdf_file.relative_to(Path(__file__).parent.parent))

        if latex_path:
            latex_file = Path(latex_path)
            if latex_file.exists():
                relative_latex_path = str(latex_file.relative_to(Path(__file__).parent.parent))

        # Create history record
        history_record = OptimizationHistory(
            optimization_id=optimization_id,
            user_email=user_email,
            company_name=company_name,
            job_description=job_description,
            original_latex=original_latex,
            optimized_latex=optimized_latex,
            pdf_path=relative_pdf_path,
            latex_path=relative_latex_path,
            llm_provider=llm_provider,
            llm_model=llm_model,
            status=status,
            error_message=error_message,
            processing_time_ms=processing_time_ms
        )

        db.add(history_record)
        db.commit()
        db.refresh(history_record)

        logger.info(f"✅ Saved optimization {optimization_id} to history database")

    except Exception as e:
        logger.error(f"❌ Failed to save optimization to history: {str(e)}")
        if db:
            db.rollback()
    finally:
        if db:
            db.close()

async def load_cold_email_prompt() -> str:
    """Load cold email prompt from file"""
    try:
        prompt_path = Path(__file__).parent.parent.parent / "cold_email_prompt.txt"
        if prompt_path.exists():
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        return ""
    except Exception as e:
        logger.error(f"❌ Error loading cold email prompt: {str(e)}")
        return ""

async def load_cover_letter_prompt() -> str:
    """Load cover letter prompt from file"""
    try:
        prompt_path = Path(__file__).parent.parent.parent / "cover_letter_prompt.txt"
        if prompt_path.exists():
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        return ""
    except Exception as e:
        logger.error(f"❌ Error loading cover letter prompt: {str(e)}")
        return ""

async def load_email_and_cover_letter_prompt() -> str:
    """Load combined email and cover letter prompt from file"""
    try:
        prompt_path = Path(__file__).parent.parent.parent / "email_and_cover_letter_prompt.txt"
        if prompt_path.exists():
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        return ""
    except Exception as e:
        logger.error(f"❌ Error loading email and cover letter prompt: {str(e)}")
        return ""

async def generate_email_and_cover_letter(resume_text: str, job_description: str, company_name: str, llm_config) -> tuple[Optional[str], Optional[str]]:
    """Generate BOTH cold email AND cover letter in a single LLM call"""
    try:
        prompt_template = await load_email_and_cover_letter_prompt()
        if not prompt_template:
            return None, None

        combined_prompt = f"{prompt_template}\n\nCompany Name: {company_name}\n\nJob Description:\n{job_description}\n\nResume Content:\n{resume_text}"

        logger.info(f"🔄 Generating cold email AND cover letter in single API call...")
        result = await llm_service.optimize_resume(
            tex_content="",  # Not needed for email/letter
            job_description=combined_prompt,
            system_prompt="Generate BOTH a cold email and cover letter based on the following information. Use the exact delimiters specified in the prompt.",
            config=llm_config
        )

        response_text = result.get('optimized_tex', '')

        # Parse the response to extract email and cover letter
        cold_email = None
        cover_letter = None

        import re

        # Extract cold email
        email_match = re.search(r'===BEGIN_COLD_EMAIL===(.*?)===END_COLD_EMAIL===', response_text, re.DOTALL)
        if email_match:
            cold_email = email_match.group(1).strip()
            logger.info(f"✅ Cold email extracted ({len(cold_email)} chars)")
        else:
            logger.warning("⚠️ Could not parse cold email from response")

        # Extract cover letter
        letter_match = re.search(r'===BEGIN_COVER_LETTER===(.*?)===END_COVER_LETTER===', response_text, re.DOTALL)
        if letter_match:
            cover_letter = letter_match.group(1).strip()
            logger.info(f"✅ Cover letter extracted ({len(cover_letter)} chars)")
        else:
            logger.warning("⚠️ Could not parse cover letter from response")

        return cold_email, cover_letter

    except Exception as e:
        logger.error(f"❌ Error generating email and cover letter: {str(e)}")
        return None, None

# Keep old functions for backward compatibility (not used anymore)
async def generate_cold_email(resume_text: str, job_description: str, company_name: str, llm_config) -> Optional[str]:
    """DEPRECATED: Use generate_email_and_cover_letter instead"""
    email, _ = await generate_email_and_cover_letter(resume_text, job_description, company_name, llm_config)
    return email

async def generate_cover_letter(resume_text: str, job_description: str, company_name: str, llm_config) -> Optional[str]:
    """DEPRECATED: Use generate_email_and_cover_letter instead"""
    _, letter = await generate_email_and_cover_letter(resume_text, job_description, company_name, llm_config)
    return letter

class CompileLatexRequest(BaseModel):
    tex_content: str
    optimization_id: Optional[str] = None
    company_name: Optional[str] = "resume"

@router.post("/", response_model=OptimizationResponse)
async def optimize_resume(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Main resume optimization endpoint"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    optimization_id = str(uuid.uuid4())
    
    logger.info(f"🎯 Starting resume optimization for {user_email}")
    logger.info(f"📊 Request details - ID: {optimization_id}, Company: {request.company_name}")
    logger.info(f"📄 Input sizes - LaTeX: {len(request.tex_content)} chars, Job desc: {len(request.job_description)} chars")
    
    try:
        # Track processing time
        import time
        start_time = time.time()

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

        # Load system prompt with character constraints and custom instructions injected
        system_prompt = await load_system_prompt(
            tex_content=request.tex_content,
            custom_instructions=request.custom_instructions
        )
        logger.info(f"📜 System prompt prepared with character constraints")

        # Call LLM service - RUN IN PARALLEL with email/letter generation if requested
        logger.info(f"📤 Sending to LLM for optimization {optimization_id}")

        # Prepare tasks to run in parallel
        tasks = []
        task_names = []

        # Task 1: Resume optimization (always runs)
        tasks.append(llm_service.optimize_resume(
            request.tex_content,
            request.job_description,
            system_prompt,
            request.llm_config
        ))
        task_names.append("resume_optimization")

        # Task 2: Email + Cover Letter generation (if requested, run in parallel!)
        if request.generate_cold_email or request.generate_cover_letter:
            logger.info(f"🚀 Running resume optimization AND email/letter generation IN PARALLEL")
            tasks.append(generate_email_and_cover_letter(
                resume_text=request.tex_content,  # Use original resume for now
                job_description=request.job_description,
                company_name=request.company_name,
                llm_config=request.llm_config
            ))
            task_names.append("email_and_letter")

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks)

        # Extract results
        llm_result = results[0]  # Resume optimization result
        cold_email_content = None
        cover_letter_content = None

        if len(results) > 1:
            cold_email_content, cover_letter_content = results[1]
            logger.info(f"✅ Parallel execution completed - resume + email/letter generated together!")

        # Update progress
        optimization_status_store[optimization_id]["progress"] = 70
        optimization_status_store[optimization_id]["message"] = "LLM processing completed, cleaning and validating result..."

        # Get optimized LaTeX from LLM
        optimized_tex = llm_result['optimized_tex']

        # Log the RAW LLM response (before cleaning)
        logger.info(f"📝 RAW LLM RESPONSE (ID: {optimization_id}):")
        logger.info("=" * 80)
        logger.info(optimized_tex[:500] + "..." if len(optimized_tex) > 500 else optimized_tex)
        logger.info("=" * 80)
        logger.info(f"📊 Raw LLM output: {len(optimized_tex)} characters")

        # Clean the LaTeX content (remove markdown fences, etc.)
        logger.info("🧹 Cleaning LLM response (removing markdown fences, extra whitespace)")
        optimized_tex = latex_parser.clean_latex_content(optimized_tex)

        # Log the CLEANED LaTeX code
        logger.info(f"📝 CLEANED LaTeX CODE (ID: {optimization_id}):")
        logger.info("=" * 80)
        logger.info(optimized_tex[:500] + "..." if len(optimized_tex) > 500 else optimized_tex)
        logger.info("=" * 80)
        logger.info(f"📊 Cleaned LaTeX: {len(optimized_tex)} characters")

        # Update the result with cleaned content
        llm_result['optimized_tex'] = optimized_tex
        
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
        
        # Email and cover letter were already generated in parallel above!
        # Just filter out the ones user didn't request
        if cold_email_content and not request.generate_cold_email:
            cold_email_content = None

        if cover_letter_content and not request.generate_cover_letter:
            cover_letter_content = None

        if cold_email_content:
            logger.info(f"✅ Cold email ready ({len(cold_email_content)} chars)")

        if cover_letter_content:
            logger.info(f"✅ Cover letter ready ({len(cover_letter_content)} chars)")
        
        # Update progress
        optimization_status_store[optimization_id]["progress"] = 95
        optimization_status_store[optimization_id]["message"] = "Generating PDF..."

        # Generate PDF
        pdf_result = None
        pdf_error = None
        try:
            pdf_result = await pdf_generator.compile_latex_to_pdf(
                optimized_tex,
                optimization_id,
                request.company_name
            )
        except Exception as pdf_ex:
            # PDF compilation raised an exception
            pdf_error = str(pdf_ex)
            logger.error(f"❌ PDF compilation exception for {optimization_id}: {pdf_error}")

        if pdf_error or (pdf_result and not pdf_result['success']):
            logger.error(f"❌ PDF generation failed for {optimization_id}")
            logger.info(f"💾 Saving raw LaTeX despite PDF failure for manual download")

            # Save the raw LaTeX content to persistent storage even though PDF failed
            import shutil
            tex_file_path = None
            try:
                # Save to persistent storage instead of temp directory
                storage_dir = get_persistent_storage_dir()
                latex_filename = f"{request.company_name}_resume_{optimization_id}_FAILED.tex"
                tex_file_path = storage_dir / latex_filename

                # Write LaTeX to file
                with open(tex_file_path, 'w', encoding='utf-8') as f:
                    f.write(optimized_tex)

                logger.info(f"✅ Saved raw LaTeX to: {tex_file_path}")

                # Cache the LaTeX file path
                await cache_service.cache_pdf_file(optimization_id, str(tex_file_path))

                # Update status with partial success
                error_msg = pdf_error if pdf_error else pdf_result.get('error', 'Unknown error')
                optimization_status_store[optimization_id].update({
                    "status": "failed",
                    "progress": 100,
                    "message": "⚠️ PDF compilation failed due to limited server resources. Please copy the LaTeX code below and paste it into Overleaf.com to generate your PDF.",
                    "error": f"PDF cannot be compiled on this server due to resource limitations. Please use Overleaf.com: {error_msg}",
                    "result": {
                        **enhanced_result,
                        'optimized_tex': optimized_tex,  # Include LaTeX code for Overleaf
                        'latex_download_url': f"/optimize/{optimization_id}/download/latex",
                        'pdf_compilation_error': error_msg,
                        'has_raw_latex': True,
                        'cold_email': cold_email_content,
                        'cover_letter': cover_letter_content
                    },
                    "cached": False
                })

                # Save to history database (failed status)
                processing_time_ms = int((time.time() - start_time) * 1000)
                save_to_history(
                    optimization_id=optimization_id,
                    user_email=status_data.get("user_email", "anonymous"),
                    company_name=request.company_name,
                    job_description=request.job_description,
                    original_latex=request.tex_content,
                    optimized_latex=optimized_tex,
                    llm_provider=request.llm_config.provider.value,
                    llm_model=request.llm_config.model,
                    status="failed",
                    latex_path=str(tex_file_path),
                    error_message=f"PDF compilation failed: {error_msg}",
                    cold_email=cold_email_content,
                    cover_letter=cover_letter_content,
                    processing_time_ms=processing_time_ms
                )

                logger.info(f"✅ Raw LaTeX available despite PDF failure for {optimization_id}")
                return

            except Exception as e:
                logger.error(f"❌ Failed to save raw LaTeX: {str(e)}")
                optimization_status_store[optimization_id]["status"] = "failed"
                optimization_status_store[optimization_id]["error"] = "PDF generation failed"
                return

        # PDF succeeded - cache PDF path
        if not pdf_result:
            raise Exception("PDF compilation failed unexpectedly")

        await cache_service.cache_pdf_file(optimization_id, pdf_result['pdf_path'])

        # Save LaTeX file to persistent storage
        storage_dir = get_persistent_storage_dir()
        latex_filename = f"{request.company_name}_resume_{optimization_id}.tex"
        latex_save_path = storage_dir / latex_filename

        with open(latex_save_path, 'w', encoding='utf-8') as f:
            f.write(optimized_tex)
        logger.info(f"💾 Saved LaTeX file to: {latex_save_path}")

        # Copy PDF to persistent storage
        import shutil
        pdf_filename = f"{request.company_name}_resume_{optimization_id}.pdf"
        pdf_save_path = storage_dir / pdf_filename
        shutil.copy2(pdf_result['pdf_path'], pdf_save_path)
        logger.info(f"💾 Saved PDF file to: {pdf_save_path}")

        # Complete optimization with all details (cold email/cover letter already generated above)
        final_result = {
            **enhanced_result,  # This already includes job details
            'pdf_info': pdf_result,
            'validation': validation_result,
            'optimization_id': optimization_id,
            'cold_email': cold_email_content,
            'cover_letter': cover_letter_content
        }

        optimization_status_store[optimization_id].update({
            "status": "completed",
            "progress": 100,
            "message": "Optimization completed successfully",
            "result": final_result,
            "cached": False,
            "completed_at": datetime.now()
        })

        # Track token usage for analytics
        usage_data = llm_result.get('usage', {})
        if usage_data:
            input_tokens = usage_data.get('input_tokens', 0) + usage_data.get('cache_creation_input_tokens', 0) + usage_data.get('cache_read_input_tokens', 0)
            output_tokens = usage_data.get('output_tokens', 0)
            track_token_usage(
                user_email=status_data.get("user_email", "anonymous"),
                provider=request.llm_config.provider.value,
                model=request.llm_config.model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                company_name=request.company_name
            )

        # Save to history database
        processing_time_ms = int((time.time() - start_time) * 1000)
        save_to_history(
            optimization_id=optimization_id,
            user_email=status_data.get("user_email", "anonymous"),
            company_name=request.company_name,
            job_description=request.job_description,
            original_latex=request.tex_content,
            optimized_latex=optimized_tex,
            llm_provider=request.llm_config.provider.value,
            llm_model=request.llm_config.model,
            status="completed",
            pdf_path=str(pdf_save_path),
            latex_path=str(latex_save_path),
            cold_email=cold_email_content,
            cover_letter=cover_letter_content,
            processing_time_ms=processing_time_ms
        )

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
    current_status = status_data["status"]
    
    # Allow both completed and failed statuses to return results
    if current_status == "processing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Optimization still in progress. Status: {current_status}"
        )
    
    result = status_data.get("result", {})
    
    # Get PDF download URL if available
    pdf_download_url = None
    latex_download_url = None
    pdf_path = await cache_service.get_pdf_path(optimization_id)
    if pdf_path:
        pdf_download_url = f"/download/{optimization_id}"
    
    # Check for LaTeX download if PDF failed
    if current_status == "failed" and result.get("has_raw_latex"):
        latex_download_url = result.get("latex_download_url")
    
    processing_stats = {
        "processing_time_seconds": result.get("processing_time_seconds"),
        "input_chars": result.get("input_chars"),
        "output_chars": result.get("output_chars"),
        "provider": result.get("provider"),
        "model": result.get("model"),
        "cached": status_data.get("cached", False)
    }
    
    # Get error message if failed
    error_message = status_data.get("error") if current_status == "failed" else None
    
    logger.info(f"✅ Returning result for optimization {optimization_id} (status: {current_status})")

    return OptimizationResult(
        optimization_id=optimization_id,
        status=current_status,
        optimized_tex=result.get("optimized_tex"),
        original_tex=status_data.get("original_tex"),
        job_description=status_data.get("job_description"),
        company_name=status_data.get("company_name"),
        custom_instructions=status_data.get("custom_instructions"),
        pdf_download_url=pdf_download_url if current_status == "completed" else None,
        latex_download_url=latex_download_url if current_status == "failed" else None,
        error_message=error_message,
        cold_email=result.get("cold_email"),
        cover_letter=result.get("cover_letter"),
        processing_stats=processing_stats
    )

def calculate_content_chars(latex_content: str) -> int:
    """Extract only human-readable content from LaTeX, ignore commands"""
    import re
    # Remove LaTeX commands like \section{}, \textbf{}, etc.
    text_only = re.sub(r'\\[a-zA-Z]+\{[^}]*\}|\\[a-zA-Z]+|\{|\}|%.*', '', latex_content)
    # Remove extra whitespace
    text_only = ' '.join(text_only.split())
    return len(text_only.strip())

def get_character_constraints(tex_content: str, tolerance: float = 0.03) -> dict:
    """Calculate character count constraints for the prompt"""
    input_chars = calculate_content_chars(tex_content)
    min_chars = int(input_chars * (1 - tolerance))
    max_chars = int(input_chars * (1 + tolerance))

    return {
        "input_char_count": input_chars,
        "min_chars": min_chars,
        "max_chars": max_chars,
        "tolerance_percent": int(tolerance * 100)
    }

async def load_system_prompt(tex_content: str = None, custom_instructions: str = None) -> str:
    """Load system prompt from file and inject character constraints"""
    try:
        prompt_path = Path(__file__).parent.parent.parent / "latex_system_prompt.txt"

        if prompt_path.exists():
            with open(prompt_path, 'r', encoding='utf-8') as f:
                prompt = f.read().strip()
                logger.info(f"📜 Loaded system prompt template ({len(prompt)} chars)")
        else:
            logger.warning("⚠️ System prompt file not found, using default")
            prompt = """
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

        # If tex_content provided, inject character constraints
        if tex_content:
            constraints = get_character_constraints(tex_content)
            logger.info(f"📏 Character constraints: {constraints['input_char_count']} chars (±3% = {constraints['min_chars']}-{constraints['max_chars']})")

            # Replace placeholders in prompt
            prompt = prompt.replace("{input_char_count}", str(constraints["input_char_count"]))
            prompt = prompt.replace("{min_chars}", str(constraints["min_chars"]))
            prompt = prompt.replace("{max_chars}", str(constraints["max_chars"]))
            prompt = prompt.replace("{section_budgets}", "Not calculated for this optimization.")

        # Replace custom instructions placeholder
        if custom_instructions and custom_instructions.strip():
            prompt = prompt.replace("{custom_instructions}", custom_instructions.strip())
        else:
            prompt = prompt.replace("{custom_instructions}", "None provided - use job description as primary guide")

        return prompt

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
            request.company_name or "resume"
        )
        
        if not pdf_result['success']:
            logger.error(f"❌ PDF compilation failed for {compile_id}: {pdf_result.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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