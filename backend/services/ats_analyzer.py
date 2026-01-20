"""
ATS Analyzer Service
Analyzes resumes for ATS compatibility and provides detailed feedback.
"""
import logging
import re
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from services.llm_service import llm_service

logger = logging.getLogger(__name__)


@dataclass
class ATSAnalysisResult:
    """Result of ATS analysis"""
    score: int  # 0-100
    summary: str  # Brief summary of the analysis
    keyword_analysis: Optional[Dict[str, Any]] = None  # matched/missing keywords
    formatting_issues: Optional[List[str]] = None  # list of issues found
    sections_detected: Optional[Dict[str, bool]] = None  # contact, experience, etc.
    missing_skills: Optional[List[str]] = None  # skills from JD not in resume
    action_verbs: Optional[Dict[str, List[str]]] = None  # strong/weak verbs
    suggestions: Optional[List[str]] = None  # prioritized improvements

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ATSAnalyzer:
    """Service for analyzing resumes for ATS compatibility"""

    # Common ATS-unfriendly patterns
    FORMATTING_PATTERNS = {
        'tables': r'\\begin\{tabular\}|<table',
        'images': r'\\includegraphics|<img',
        'headers_footers': r'\\fancyhead|\\fancyfoot',
        'columns': r'\\begin\{multicols\}|column-count:',
        'graphics': r'\\begin\{tikzpicture\}',
        'text_boxes': r'\\begin\{textbox\}|text-box',
    }

    # Essential resume sections
    REQUIRED_SECTIONS = [
        'contact', 'experience', 'education', 'skills'
    ]

    # Strong action verbs for resumes
    STRONG_VERBS = [
        'achieved', 'improved', 'developed', 'implemented', 'led', 'managed',
        'created', 'designed', 'increased', 'reduced', 'delivered', 'built',
        'launched', 'optimized', 'automated', 'streamlined', 'spearheaded',
        'orchestrated', 'pioneered', 'transformed', 'accelerated', 'generated'
    ]

    WEAK_VERBS = [
        'helped', 'assisted', 'worked', 'was responsible for', 'participated',
        'contributed', 'supported', 'handled', 'dealt with', 'involved'
    ]

    async def analyze_resume(
        self,
        resume_text: str,
        job_description: Optional[str],
        llm_config: Dict[str, Any]
    ) -> ATSAnalysisResult:
        """
        Perform comprehensive ATS analysis on resume.
        Uses LLM for intelligent analysis and local checks for formatting.
        """
        logger.info(f"Starting ATS analysis (resume: {len(resume_text)} chars, JD: {len(job_description) if job_description else 0} chars)")

        try:
            # Run LLM analysis
            llm_analysis = await self._run_llm_analysis(resume_text, job_description, llm_config)

            # Supplement with local pattern matching
            formatting_issues = self._check_formatting(resume_text)
            verb_analysis = self._analyze_action_verbs(resume_text)

            # Combine results
            result = ATSAnalysisResult(
                score=llm_analysis.get('score', 70),
                summary=llm_analysis.get('summary', 'Analysis completed.'),
                keyword_analysis=llm_analysis.get('keyword_analysis'),
                formatting_issues=formatting_issues or llm_analysis.get('formatting_issues'),
                sections_detected=llm_analysis.get('sections_detected'),
                missing_skills=llm_analysis.get('missing_skills'),
                action_verbs=verb_analysis,
                suggestions=llm_analysis.get('suggestions', [])
            )

            logger.info(f"ATS analysis complete. Score: {result.score}/100")
            return result

        except Exception as e:
            logger.error(f"ATS analysis failed: {str(e)}")
            # Return a basic result on failure
            return ATSAnalysisResult(
                score=50,
                summary=f"Analysis encountered an error: {str(e)}. Basic checks completed.",
                formatting_issues=self._check_formatting(resume_text),
                suggestions=["Unable to complete full analysis. Please try again."]
            )

    async def _run_llm_analysis(
        self,
        resume_text: str,
        job_description: Optional[str],
        llm_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Use LLM to perform intelligent resume analysis"""

        jd_section = f"""
JOB DESCRIPTION TO COMPARE AGAINST:
{job_description}
""" if job_description else "No job description provided - perform general ATS compatibility analysis."

        system_prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer. Analyze the provided resume and return a JSON object with your analysis.

{jd_section}

Analyze the resume and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{{
    "score": <integer 0-100>,
    "summary": "<2-3 sentence summary of overall ATS compatibility>",
    "keyword_analysis": {{
        "matched_keywords": ["keyword1", "keyword2"],
        "missing_keywords": ["keyword3", "keyword4"],
        "match_percentage": <integer 0-100>
    }},
    "sections_detected": {{
        "contact": <boolean>,
        "experience": <boolean>,
        "education": <boolean>,
        "skills": <boolean>,
        "summary": <boolean>,
        "certifications": <boolean>,
        "projects": <boolean>
    }},
    "missing_skills": ["skill1", "skill2"],
    "formatting_issues": ["issue1", "issue2"],
    "suggestions": [
        "Most important suggestion",
        "Second suggestion",
        "Third suggestion",
        "Fourth suggestion",
        "Fifth suggestion"
    ]
}}

SCORING CRITERIA:
- 90-100: Excellent ATS compatibility, well-structured, keyword-optimized
- 80-89: Good compatibility with minor improvements needed
- 70-79: Acceptable but missing some key elements
- 60-69: Needs significant improvement
- Below 60: Major ATS compatibility issues

Return ONLY the JSON object, nothing else."""

        try:
            # Import LLMConfig for the call
            from models.schemas import LLMConfig, LLMProvider

            # Create LLMConfig object from dict
            config = LLMConfig(
                provider=LLMProvider(llm_config['provider']),
                api_key=llm_config['api_key'],
                model=llm_config.get('model', 'claude-3-5-sonnet-20241022')
            )

            result = await llm_service.optimize_resume(
                tex_content=resume_text,
                job_description="Analyze this resume for ATS compatibility.",
                system_prompt=system_prompt,
                config=config
            )

            response_text = result.get('optimized_tex', '')

            # Parse JSON from response
            # Try to find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis = json.loads(json_match.group())
                logger.info(f"LLM analysis parsed successfully. Score: {analysis.get('score', 'N/A')}")
                return analysis
            else:
                logger.warning("Could not find JSON in LLM response")
                return self._default_analysis()

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
            return self._default_analysis()
        except Exception as e:
            logger.error(f"LLM analysis error: {str(e)}")
            return self._default_analysis()

    def _default_analysis(self) -> Dict[str, Any]:
        """Return default analysis when LLM fails"""
        return {
            "score": 65,
            "summary": "Unable to perform full AI analysis. Basic formatting checks completed.",
            "keyword_analysis": None,
            "sections_detected": None,
            "missing_skills": None,
            "formatting_issues": [],
            "suggestions": [
                "Ensure your resume includes clear section headers",
                "Use standard fonts like Arial or Calibri",
                "Include relevant keywords from the job description",
                "Quantify achievements where possible",
                "Keep formatting simple and ATS-friendly"
            ]
        }

    def _check_formatting(self, resume_text: str) -> List[str]:
        """Check for ATS-unfriendly formatting patterns"""
        issues = []

        for pattern_name, pattern in self.FORMATTING_PATTERNS.items():
            if re.search(pattern, resume_text, re.IGNORECASE):
                issue_messages = {
                    'tables': "Tables detected - ATS systems often misread tabular data",
                    'images': "Images detected - ATS cannot read image content",
                    'headers_footers': "Headers/footers detected - content may be missed by ATS",
                    'columns': "Multi-column layout detected - may cause reading order issues",
                    'graphics': "Graphics detected - not readable by ATS",
                    'text_boxes': "Text boxes detected - content may be skipped",
                }
                issues.append(issue_messages.get(pattern_name, f"{pattern_name} formatting detected"))

        return issues if issues else None

    def _analyze_action_verbs(self, resume_text: str) -> Dict[str, List[str]]:
        """Analyze action verbs used in the resume"""
        resume_lower = resume_text.lower()

        strong_found = []
        weak_found = []

        for verb in self.STRONG_VERBS:
            if verb in resume_lower:
                strong_found.append(verb)

        for verb in self.WEAK_VERBS:
            if verb in resume_lower:
                weak_found.append(verb)

        return {
            "strong": strong_found[:10],  # Limit to top 10
            "weak": weak_found[:10]
        }


# Global instance
ats_analyzer = ATSAnalyzer()
