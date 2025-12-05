"""
History routes for viewing past optimizations
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy.orm import Session

from database.models import OptimizationHistory, get_db
from routes.auth import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_optimization_history(
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get optimization history for current user"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📜 Fetching optimization history for {user_email}")

    try:
        # Query optimizations for this user, ordered by most recent first
        optimizations = db.query(OptimizationHistory)\
            .filter(OptimizationHistory.user_email == user_email)\
            .order_by(OptimizationHistory.created_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()

        # Count total optimizations for pagination
        total_count = db.query(OptimizationHistory)\
            .filter(OptimizationHistory.user_email == user_email)\
            .count()

        logger.info(f"✅ Found {len(optimizations)} optimizations (total: {total_count})")

        return {
            "optimizations": [opt.to_dict() for opt in optimizations],
            "total": total_count,
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"❌ Error fetching history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch optimization history: {str(e)}"
        )

@router.get("/{optimization_id}")
async def get_optimization_by_id(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get specific optimization by ID"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📄 Fetching optimization {optimization_id} for {user_email}")

    try:
        optimization = db.query(OptimizationHistory)\
            .filter(
                OptimizationHistory.optimization_id == optimization_id,
                OptimizationHistory.user_email == user_email
            )\
            .first()

        if not optimization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Optimization not found"
            )

        logger.info(f"✅ Found optimization {optimization_id}")
        return optimization.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch optimization: {str(e)}"
        )

@router.get("/{optimization_id}/pdf")
async def download_history_pdf(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Download PDF from history"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📥 PDF download request for {optimization_id} from {user_email}")

    try:
        optimization = db.query(OptimizationHistory)\
            .filter(
                OptimizationHistory.optimization_id == optimization_id,
                OptimizationHistory.user_email == user_email
            )\
            .first()

        if not optimization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Optimization not found"
            )

        if not optimization.pdf_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not available for this optimization"
            )

        # Convert relative path to absolute path
        base_dir = Path(__file__).parent.parent
        pdf_file = base_dir / optimization.pdf_path

        if not pdf_file.exists():
            logger.error(f"❌ PDF file not found on disk: {pdf_file}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )

        logger.info(f"✅ Serving PDF: {pdf_file.name}")

        return FileResponse(
            path=str(pdf_file),
            media_type='application/pdf',
            filename=pdf_file.name,
            headers={
                "Content-Disposition": f"attachment; filename={pdf_file.name}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error downloading PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download PDF: {str(e)}"
        )

@router.get("/{optimization_id}/latex")
async def download_history_latex(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Download LaTeX from history"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📥 LaTeX download request for {optimization_id} from {user_email}")

    try:
        optimization = db.query(OptimizationHistory)\
            .filter(
                OptimizationHistory.optimization_id == optimization_id,
                OptimizationHistory.user_email == user_email
            )\
            .first()

        if not optimization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Optimization not found"
            )

        if not optimization.latex_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LaTeX file not available for this optimization"
            )

        # Convert relative path to absolute path
        base_dir = Path(__file__).parent.parent
        latex_file = base_dir / optimization.latex_path

        if not latex_file.exists():
            logger.error(f"❌ LaTeX file not found on disk: {latex_file}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LaTeX file not found"
            )

        logger.info(f"✅ Serving LaTeX: {latex_file.name}")

        return FileResponse(
            path=str(latex_file),
            media_type='text/plain',
            filename=latex_file.name,
            headers={
                "Content-Disposition": f"attachment; filename={latex_file.name}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error downloading LaTeX: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download LaTeX: {str(e)}"
        )

@router.delete("/{optimization_id}")
async def delete_optimization(
    optimization_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Delete optimization from history"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"🗑️ Delete request for {optimization_id} from {user_email}")

    try:
        optimization = db.query(OptimizationHistory)\
            .filter(
                OptimizationHistory.optimization_id == optimization_id,
                OptimizationHistory.user_email == user_email
            )\
            .first()

        if not optimization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Optimization not found"
            )

        # Delete files if they exist
        base_dir = Path(__file__).parent.parent

        if optimization.pdf_path:
            pdf_file = base_dir / optimization.pdf_path
            if pdf_file.exists():
                pdf_file.unlink()
                logger.info(f"🗑️ Deleted PDF: {pdf_file.name}")

        if optimization.latex_path:
            latex_file = base_dir / optimization.latex_path
            if latex_file.exists():
                latex_file.unlink()
                logger.info(f"🗑️ Deleted LaTeX: {latex_file.name}")

        # Delete database record
        db.delete(optimization)
        db.commit()

        logger.info(f"✅ Deleted optimization {optimization_id}")

        return {"message": "Optimization deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete optimization: {str(e)}"
        )
