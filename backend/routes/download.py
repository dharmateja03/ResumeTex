"""
File download routes for serving generated PDFs
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime

from services.cache_service import cache_service
from services.pdf_generator import pdf_generator
from routes.auth import get_current_user_optional
from models.schemas import DownloadResponse, FileInfo

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/{optimization_id}/latex")
async def download_latex(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Download raw LaTeX file (when PDF compilation fails)"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📥 LaTeX download request from {user_email} for optimization {optimization_id}")

    try:
        # Get file path from cache (could be .tex or .pdf)
        file_path = await cache_service.get_pdf_path(optimization_id)

        if not file_path:
            logger.warning(f"❌ File not found in cache for optimization {optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LaTeX file not found or has expired"
            )

        # Check if file exists on disk
        file = Path(file_path)
        if not file.exists():
            logger.error(f"❌ File not found on disk: {file_path}")
            await cache_service.delete(f"pdf_result:{optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LaTeX file not found"
            )

        logger.info(f"📄 Serving LaTeX download: {file.name} ({file.stat().st_size} bytes)")

        # Return file response for download
        return FileResponse(
            path=file_path,
            media_type='text/plain',
            filename=file.name,
            headers={
                "Content-Disposition": f"attachment; filename={file.name}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ LaTeX download error for optimization {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LaTeX download failed: {str(e)}"
        )

@router.get("/{optimization_id}/view")
async def view_pdf_inline(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """View PDF inline (for preview in iframe)"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"👁️ PDF inline view request from {user_email} for optimization {optimization_id}")
    
    try:
        # Get PDF path from cache
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        
        if not pdf_path:
            logger.warning(f"❌ PDF not found in cache for optimization {optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not found or has expired"
            )
        
        # Check if file exists on disk
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            logger.error(f"❌ PDF file not found on disk: {pdf_path}")
            await cache_service.delete(f"pdf_result:{optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        logger.info(f"👁️ Serving PDF for inline view: {pdf_file.name}")
        
        # Return file response for inline viewing (no Content-Disposition attachment)
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            headers={
                "Content-Disposition": "inline",  # inline instead of attachment
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ PDF view error for optimization {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF view failed: {str(e)}"
        )

@router.get("/{optimization_id}")
async def download_pdf(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Download generated PDF file (attachment)"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📥 PDF download request from {user_email} for optimization {optimization_id}")
    
    try:
        # Get PDF path from cache
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        
        if not pdf_path:
            logger.warning(f"❌ PDF not found in cache for optimization {optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not found or has expired"
            )
        
        # Check if file exists on disk
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            logger.error(f"❌ PDF file not found on disk: {pdf_path}")
            # Clean up cache entry
            await cache_service.delete(f"pdf_result:{optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Get file info
        file_info = pdf_generator.get_pdf_info(pdf_path)
        if not file_info:
            logger.error(f"❌ Could not get PDF info for: {pdf_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF file information unavailable"
            )
        
        logger.info(f"📄 Serving PDF download: {pdf_file.name} ({file_info['size_bytes']} bytes)")
        
        # Return file response for download
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=pdf_file.name,
            headers={
                "Content-Disposition": f"attachment; filename={pdf_file.name}",  # attachment for download
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Download error for optimization {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(e)}"
        )

@router.get("/{optimization_id}/info", response_model=DownloadResponse)
async def get_download_info(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Get download information without actually downloading"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"ℹ️ Download info request from {user_email} for optimization {optimization_id}")
    
    try:
        # Get PDF path from cache
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        
        if not pdf_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not found or has expired"
            )
        
        # Check if file exists
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            # Clean up cache entry
            await cache_service.delete(f"pdf_result:{optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Get file info
        file_info = pdf_generator.get_pdf_info(pdf_path)
        if not file_info:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF file information unavailable"
            )
        
        # Calculate expiration (assume 1 hour from creation)
        expires_at = file_info['created_at'].replace(hour=file_info['created_at'].hour + 1)
        
        response = DownloadResponse(
            download_url=f"/download/{optimization_id}",
            expires_at=expires_at,
            file_info=FileInfo(
                filename=file_info['filename'],
                size_bytes=file_info['size_bytes'],
                content_type="application/pdf"
            )
        )
        
        logger.info(f"ℹ️ Download info: {file_info['filename']} ({file_info['size_bytes']} bytes)")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting download info for {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get download info: {str(e)}"
        )

@router.head("/{optimization_id}")
async def check_pdf_exists(optimization_id: str):
    """Check if PDF exists without downloading (HEAD request)"""
    logger.info(f"🔍 Checking PDF existence for optimization {optimization_id}")
    
    try:
        # Get PDF path from cache
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        
        if not pdf_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not found"
            )
        
        # Check if file exists
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            await cache_service.delete(f"pdf_result:{optimization_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Get file size for Content-Length header
        file_size = pdf_file.stat().st_size
        
        logger.info(f"✅ PDF exists: {pdf_file.name} ({file_size} bytes)")
        
        # Return headers only (HEAD request)
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=pdf_file.name,
            headers={
                "Content-Length": str(file_size),
                "Content-Type": "application/pdf",
                "Last-Modified": datetime.fromtimestamp(pdf_file.stat().st_mtime).strftime('%a, %d %b %Y %H:%M:%S GMT')
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error checking PDF existence for {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check PDF existence"
        )

@router.delete("/{optimization_id}")
async def delete_pdf(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Delete PDF file (cleanup)"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"🗑️ PDF deletion request from {user_email} for optimization {optimization_id}")
    
    try:
        # Get PDF path from cache
        pdf_path = await cache_service.get_pdf_path(optimization_id)
        
        if pdf_path:
            # Delete file if it exists
            pdf_file = Path(pdf_path)
            if pdf_file.exists():
                pdf_file.unlink()
                logger.info(f"🗑️ Deleted PDF file: {pdf_file.name}")
        
        # Remove from cache
        await cache_service.delete(f"pdf_result:{optimization_id}")
        
        return {"message": "PDF deleted successfully"}
        
    except Exception as e:
        logger.error(f"❌ Error deleting PDF for {optimization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete PDF"
        )

@router.get("/")
async def list_available_downloads(
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """List available downloads (for debugging/admin)"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📋 Listing available downloads for {user_email}")
    
    try:
        # Get cache stats
        cache_stats = await cache_service.get_cache_stats()
        
        # For a full implementation, you'd query the cache for PDF entries
        # For now, return basic info
        
        return {
            "message": "Available downloads endpoint",
            "cache_info": cache_stats,
            "note": "Use specific optimization ID to download PDF"
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing downloads: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list downloads"
        )

@router.get("/health")
async def download_service_health():
    """Download service health check"""
    logger.info("🏥 Download service health check")
    
    try:
        # Check if PDF generator is available
        pdf_initialized = await pdf_generator.initialize()
        
        # Check cache service
        cache_stats = await cache_service.get_cache_stats()
        
        health_info = {
            "status": "healthy",
            "pdf_generator_ready": pdf_initialized,
            "cache_service": cache_stats,
            "services": {
                "file_serving": "ready",
                "cache_access": "ready" if cache_stats else "unavailable"
            }
        }
        
        logger.info("✅ Download service is healthy")
        return health_info
        
    except Exception as e:
        logger.error(f"❌ Download service health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Download service unhealthy: {str(e)}"
        )