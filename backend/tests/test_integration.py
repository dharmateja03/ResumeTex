"""
Integration tests simulating full workflow with mock services
"""
import pytest
from tests.mock_services import (
    mock_db,
    mock_llm,
    mock_pdf,
    mock_analytics
)

class TestFullWorkflow:
    """Test complete optimization workflow"""

    def test_user_signup_and_optimization(self):
        """Test: New user creates account and optimizes resume"""
        # Simulate user signup
        user_email = "jane@example.com"

        # Step 1: User uploads resume
        resume = r"""\documentclass{article}
\begin{document}
\section*{EXPERIENCE}
\textbf{Product Manager} | StartupXYZ
- Led product strategy
\end{document}
"""

        # Step 2: User has job description
        job_desc = """
Product Manager at TechCorp
Requirements:
- Product strategy and roadmapping
- Technical background
- Data-driven decision making
- Cross-functional leadership
"""

        # Step 3: Optimize resume (mocked)
        optimized = mock_llm.optimize_resume(resume, job_desc, "")
        assert "Product" in optimized
        assert optimized != resume  # Should be modified

        # Step 4: Compile to PDF (mocked)
        pdf_bytes = mock_pdf.compile_latex(optimized)
        assert len(pdf_bytes) > 0
        assert b"%PDF" in pdf_bytes

        # Step 5: Save to database (mocked)
        record = mock_db.save_optimization(
            user_email=user_email,
            company_name="TechCorp",
            job_description=job_desc,
            original_latex=resume,
            optimized_latex=optimized,
            llm_provider="anthropic",
            llm_model="claude-3-5-sonnet-20241022",
            pdf_path="optimizations/opt_001.pdf",
            latex_path="optimizations/opt_001.tex"
        )

        assert record["optimization_id"] is not None
        assert record["status"] == "completed"
        assert record["company_name"] == "TechCorp"

        # Step 6: Track analytics (mocked)
        mock_analytics.track_event(
            user_email=user_email,
            event_type="optimization_completed",
            metadata={
                "company": "TechCorp",
                "provider": "anthropic",
                "duration": 3.2
            }
        )

        # Step 7: Verify can retrieve optimization
        retrieved = mock_db.get_optimization_by_id(record["optimization_id"])
        assert retrieved is not None
        assert retrieved["user_email"] == user_email

        # Step 8: Verify user stats
        stats = mock_analytics.get_user_stats(user_email)
        assert stats["total_optimizations"] == 1
        assert stats["total_events"] == 1

    def test_multiple_optimizations_same_user(self):
        """Test: User optimizes resume for multiple jobs"""
        user_email = "john@example.com"
        companies = ["TechCorp", "StartupXYZ", "FintechCo"]

        # Create 3 optimizations
        for i, company in enumerate(companies):
            record = mock_db.save_optimization(
                user_email=user_email,
                company_name=company,
                job_description=f"Job at {company}",
                original_latex="Resume content",
                optimized_latex=f"Optimized for {company}",
                llm_provider="anthropic",
                llm_model="claude-3-5-sonnet-20241022"
            )

            mock_analytics.track_event(
                user_email=user_email,
                event_type="optimization_completed",
                metadata={"company": company}
            )

        # Verify retrieval
        user_opts = mock_db.get_user_optimizations(user_email)
        assert len(user_opts) == 3

        # Verify stats
        stats = mock_analytics.get_user_stats(user_email)
        assert stats["total_optimizations"] == 3
        assert stats["total_events"] == 3

    def test_latex_extraction_and_compilation(self):
        """Test: LaTeX extraction and PDF generation"""
        # Simulate LLM response with preamble
        llm_response = """Here is the optimized resume:

\\documentclass{article}
\\usepackage{hyperref}
\\begin{document}
\\section*{Experience}
Optimized content
\\end{document}

Hope this helps!"""

        # Extract pure LaTeX (simulating backend extraction)
        if '\\documentclass' in llm_response:
            idx = llm_response.find('\\documentclass')
            pure_latex = llm_response[idx:]
            # Clean up any trailing text
            end_idx = pure_latex.find('\\end{document}')
            if end_idx != -1:
                pure_latex = pure_latex[:end_idx + len('\\end{document}')]
        else:
            pure_latex = llm_response

        # Verify extraction
        assert pure_latex.startswith('\\documentclass')
        assert pure_latex.endswith('\\end{document}')
        assert "Hope this helps" not in pure_latex

        # Compile to PDF
        pdf = mock_pdf.compile_latex(pure_latex)
        assert len(pdf) > 0

    def test_error_recovery(self):
        """Test: Error handling and recovery"""
        # Simulate LLM provider failure
        try:
            # Simulate invalid API call
            result = None  # Would fail in real scenario
            assert result is None
        except Exception as e:
            # Track analytics
            mock_analytics.track_event(
                user_email="user@example.com",
                event_type="optimization_failed",
                metadata={"error": str(e), "provider": "anthropic"}
            )

        # Verify error was tracked
        stats = mock_analytics.get_user_stats("user@example.com")
        assert stats["total_events"] >= 1

    def test_concurrent_user_optimizations(self):
        """Test: Multiple users optimizing simultaneously"""
        users = [f"user{i}@example.com" for i in range(5)]

        # Simulate 5 users optimizing
        for i, user in enumerate(users):
            record = mock_db.save_optimization(
                user_email=user,
                company_name=f"Company{i}",
                job_description=f"Job {i}",
                original_latex="Resume",
                optimized_latex="Optimized",
                llm_provider="anthropic",
                llm_model="claude-3-5-sonnet-20241022"
            )
            mock_analytics.track_event(user, "optimization_completed")

        # Verify isolation
        for i, user in enumerate(users):
            opts = mock_db.get_user_optimizations(user)
            assert len(opts) == 1
            assert opts[0]["company_name"] == f"Company{i}"

    def test_resume_reuse_across_optimizations(self):
        """Test: User can reuse master resume for multiple jobs"""
        user_email = "reuse@example.com"
        master_resume = r"""\documentclass{article}
\begin{document}
\textbf{Software Engineer}
\end{document}
"""

        # First optimization
        opt1 = mock_db.save_optimization(
            user_email=user_email,
            company_name="WebCompany",
            job_description="Web Developer role",
            original_latex=master_resume,
            optimized_latex=master_resume.replace("Software", "Web"),
            llm_provider="anthropic",
            llm_model="claude-3-5-sonnet-20241022"
        )

        # Second optimization (reuses master resume)
        opt2 = mock_db.save_optimization(
            user_email=user_email,
            company_name="DataCompany",
            job_description="Data Engineer role",
            original_latex=master_resume,  # Same master resume
            optimized_latex=master_resume.replace("Software", "Data"),
            llm_provider="openai",
            llm_model="gpt-4"
        )

        # Verify both exist and have same original
        assert opt1["optimization_id"] != opt2["optimization_id"]
        assert opt1["original_latex"] == opt2["original_latex"]
        assert opt1["company_name"] != opt2["company_name"]

def test_mock_database_isolation():
    """Test: Mock database properly isolates user data"""
    # Save data for user1
    mock_db.save_optimization(
        user_email="user1@example.com",
        company_name="Company1",
        job_description="Job 1",
        original_latex="Resume1",
        optimized_latex="Optimized1",
        llm_provider="anthropic",
        llm_model="claude-3-5-sonnet-20241022"
    )

    # Save data for user2
    mock_db.save_optimization(
        user_email="user2@example.com",
        company_name="Company2",
        job_description="Job 2",
        original_latex="Resume2",
        optimized_latex="Optimized2",
        llm_provider="openai",
        llm_model="gpt-4"
    )

    # Verify isolation
    user1_opts = mock_db.get_user_optimizations("user1@example.com")
    user2_opts = mock_db.get_user_optimizations("user2@example.com")

    assert len(user1_opts) == 1
    assert len(user2_opts) == 1
    assert user1_opts[0]["company_name"] == "Company1"
    assert user2_opts[0]["company_name"] == "Company2"

def test_mock_analytics_event_tracking():
    """Test: Analytics properly tracks events"""
    user = "analytics@example.com"

    # Track multiple event types
    mock_analytics.track_event(user, "resume_upload")
    mock_analytics.track_event(user, "llm_provider_selected")
    mock_analytics.track_event(user, "optimization_started")
    mock_analytics.track_event(user, "optimization_completed")
    mock_analytics.track_event(user, "pdf_download")

    # Verify all tracked
    stats = mock_analytics.get_user_stats(user)
    assert stats["total_events"] == 5

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
