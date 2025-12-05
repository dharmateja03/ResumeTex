"""
Database models for optimization history
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, create_engine
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
            'error_message': self.error_message
        }

# Database setup
def get_database_url():
    """Get database URL from environment or use default"""
    # Allow configurable database path for deployment
    db_path = os.getenv('DATABASE_PATH', '/app/data/optimization_history.db')

    # For local development, use a local path
    if not os.getenv('RAILWAY_ENVIRONMENT'):
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'optimization_history.db')

    # Ensure directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    return f'sqlite:///{db_path}'

# Create engine and session
engine = create_engine(get_database_url(), echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
