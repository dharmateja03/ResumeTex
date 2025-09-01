"""
Celery tasks for background processing
"""
import logging
from celery import current_task
from celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def compile_latex_task(self, tex_content: str, optimization_id: str, company_name: str):
    """Background task for LaTeX compilation"""
    try:
        logger.info(f"🔄 Starting LaTeX compilation task for {optimization_id}")
        
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'current': 10, 'total': 100, 'status': 'Starting compilation...'}
        )
        
        # Import here to avoid circular imports
        from services.pdf_generator import pdf_generator
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'current': 50, 'total': 100, 'status': 'Compiling LaTeX...'}
        )
        
        # Compile PDF
        import asyncio
        result = asyncio.run(pdf_generator.compile_latex_to_pdf(
            tex_content, optimization_id, company_name
        ))
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'current': 90, 'total': 100, 'status': 'Finalizing...'}
        )
        
        logger.info(f"✅ LaTeX compilation completed for {optimization_id}")
        
        return {
            'status': 'completed',
            'result': result
        }
        
    except Exception as e:
        logger.error(f"❌ LaTeX compilation failed for {optimization_id}: {str(e)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise

@celery_app.task
def cleanup_old_files():
    """Background task for cleaning up old files"""
    try:
        logger.info("🧹 Starting file cleanup task")
        
        from services.pdf_generator import pdf_generator
        import asyncio
        
        asyncio.run(pdf_generator.cleanup_old_files(max_age_hours=24))
        
        logger.info("✅ File cleanup completed")
        return {"status": "completed", "message": "Old files cleaned up"}
        
    except Exception as e:
        logger.error(f"❌ File cleanup failed: {str(e)}")
        raise