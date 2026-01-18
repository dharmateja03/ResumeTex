"""
Database models for optimization history
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class OptimizationHistory(Base):
    """Model for storing optimization history"""
    __tablename__ = 'optimization_history'

    optimization_id = Column(String(50), primary_key=True)
    user_email = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    original_latex = Column(Text, nullable=False)
    optimized_latex = Column(Text, nullable=False)
    pdf_path = Column(String(500), nullable=True)  # Relative path to PDF file
    latex_path = Column(String(500), nullable=True)  # Relative path to LaTeX file
    llm_provider = Column(String(50), nullable=False)
    llm_model = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False)  # 'completed' or 'failed'
    error_message = Column(Text, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)  # Time taken in milliseconds

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'optimization_id': self.optimization_id,
            'user_email': self.user_email,
            'company_name': self.company_name,
            'job_description': self.job_description,
            'original_latex': self.original_latex,
            'optimized_latex': self.optimized_latex,
            'pdf_path': self.pdf_path,
            'latex_path': self.latex_path,
            'llm_provider': self.llm_provider,
            'llm_model': self.llm_model,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': self.status,
            'error_message': self.error_message,
            'processing_time_ms': self.processing_time_ms
        }

# Database setup
def get_database_url():
    """Get database URL from environment or use default"""
    # Check for PostgreSQL DATABASE_URL (Railway provides this)
    database_url = os.getenv('DATABASE_URL')

    if database_url:
        # Railway uses postgres:// but SQLAlchemy needs postgresql://
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        return database_url

    # For local development, use SQLite
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'optimization_history.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return f'sqlite:///{db_path}'

# Create engine and session
engine = create_engine(get_database_url(), echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

    # Run migrations for new columns
    _run_migrations()

def _run_migrations():
    """Run database migrations for schema updates"""
    import logging
    from sqlalchemy import inspect, text

    logger = logging.getLogger(__name__)
    inspector = inspect(engine)

    # Check if optimization_history table exists
    if 'optimization_history' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('optimization_history')]

        # Add processing_time_ms column if it doesn't exist
        if 'processing_time_ms' not in columns:
            try:
                with engine.connect() as conn:
                    # PostgreSQL syntax works for both PostgreSQL and newer SQLite
                    conn.execute(text('ALTER TABLE optimization_history ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER'))
                    conn.commit()
                logger.info("✅ Migration: Added processing_time_ms column")
            except Exception as e:
                # Fallback for older SQLite versions that don't support IF NOT EXISTS
                try:
                    with engine.connect() as conn:
                        conn.execute(text('ALTER TABLE optimization_history ADD COLUMN processing_time_ms INTEGER'))
                        conn.commit()
                    logger.info("✅ Migration: Added processing_time_ms column (fallback)")
                except Exception as e2:
                    logger.error(f"❌ Migration failed: {str(e2)}")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
