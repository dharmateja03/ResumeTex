"""
Mock services for testing without real API calls
"""
import json
from typing import Dict, Any
from datetime import datetime
import uuid

class MockLLMService:
    """Mock LLM service that returns dummy optimized resumes"""

    @staticmethod
    def optimize_resume(
        resume_latex: str,
        job_description: str,
        custom_instructions: str = ""
    ) -> str:
        """
        Mock optimization - returns LaTeX with job keywords inserted
        """
        # Simulate LaTeX response with optimizations
        optimized = resume_latex.replace(
            r"\textbf{Software Engineer}",
            r"\textbf{Senior Full Stack Engineer}"
        ).replace(
            "Python, JavaScript",
            "Python, JavaScript, TypeScript, FastAPI, React"
        ).replace(
            "microservices architecture",
            "microservices architecture, cloud infrastructure, AWS, Docker"
        )

        return optimized

class MockDatabaseService:
    """Mock database for testing without real SQLite"""

    def __init__(self):
        self.optimizations = {}

    def save_optimization(
        self,
        user_email: str,
        company_name: str,
        job_description: str,
        original_latex: str,
        optimized_latex: str,
        llm_provider: str,
        llm_model: str,
        pdf_path: str = None,
        latex_path: str = None
    ) -> Dict[str, Any]:
        """Save optimization to mock database"""
        optimization_id = str(uuid.uuid4())[:8]

        record = {
            "optimization_id": optimization_id,
            "user_email": user_email,
            "company_name": company_name,
            "job_description": job_description,
            "original_latex": original_latex[:100] + "...",  # Truncate for display
            "optimized_latex": optimized_latex[:100] + "...",
            "pdf_path": pdf_path,
            "latex_path": latex_path,
            "llm_provider": llm_provider,
            "llm_model": llm_model,
            "created_at": datetime.utcnow().isoformat(),
            "status": "completed",
            "error_message": None
        }

        self.optimizations[optimization_id] = record
        return record

    def get_user_optimizations(self, user_email: str) -> list:
        """Get all optimizations for a user"""
        return [
            opt for opt in self.optimizations.values()
            if opt["user_email"] == user_email
        ]

    def get_optimization_by_id(self, optimization_id: str) -> Dict[str, Any]:
        """Get optimization by ID"""
        return self.optimizations.get(optimization_id)

class MockPDFService:
    """Mock PDF service for testing"""

    @staticmethod
    def compile_latex(latex_code: str) -> bytes:
        """Mock PDF compilation"""
        # Return a fake PDF header
        return b"%PDF-1.4\n%Mock PDF Content\n"

    @staticmethod
    def latex_to_pdf(latex_code: str, output_path: str) -> bool:
        """Mock LaTeX to PDF conversion"""
        # Simulate successful compilation
        with open(output_path, 'wb') as f:
            f.write(b"%PDF-1.4\n%Mock PDF from LaTeX\n")
        return True

class MockAnalyticsService:
    """Mock analytics service"""

    def __init__(self):
        self.events = []

    def track_event(
        self,
        user_email: str,
        event_type: str,
        metadata: Dict[str, Any] = None
    ) -> None:
        """Track an analytics event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_email": user_email,
            "event_type": event_type,
            "metadata": metadata or {}
        }
        self.events.append(event)

    def get_user_stats(self, user_email: str) -> Dict[str, Any]:
        """Get user statistics"""
        user_events = [e for e in self.events if e["user_email"] == user_email]
        return {
            "user_email": user_email,
            "total_optimizations": len([e for e in user_events if e["event_type"] == "optimization"]),
            "total_events": len(user_events),
            "first_event": user_events[0]["timestamp"] if user_events else None,
            "last_event": user_events[-1]["timestamp"] if user_events else None
        }

# Global mock instances for testing
mock_db = MockDatabaseService()
mock_llm = MockLLMService()
mock_pdf = MockPDFService()
mock_analytics = MockAnalyticsService()
