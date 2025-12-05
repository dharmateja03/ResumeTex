"""
Pytest configuration and fixtures for test suite
"""
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import sys
import os

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

@pytest.fixture
def client():
    """Create test client for FastAPI app"""
    from app import app
    return TestClient(app)

@pytest.fixture
def sample_resume():
    """Sample resume in LaTeX format"""
    return r"""\documentclass[11pt]{article}
\usepackage[margin=0.5in]{geometry}
\usepackage{hyperref}

\begin{document}

\noindent
{\Large \textbf{John Doe}} \\
Email: john@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

\section*{EXPERIENCE}

\noindent
\textbf{Software Engineer} \hfill \textit{TechCorp} | Jan 2021 - Present \\
- Developed full-stack web applications using React and Python
- Optimized database queries improving performance by 40%
- Led team of 3 engineers on microservices architecture

\noindent
\textbf{Junior Developer} \hfill \textit{StartupXYZ} | Jun 2019 - Dec 2020 \\
- Built responsive UI components with React and TypeScript
- Implemented REST APIs using FastAPI
- Collaborated with product team on feature prioritization

\section*{SKILLS}

\noindent
\textbf{Languages:} Python, JavaScript, TypeScript, SQL \\
\textbf{Frontend:} React, HTML, CSS, Tailwind \\
\textbf{Backend:} FastAPI, Node.js, PostgreSQL \\
\textbf{Tools:} Git, Docker, AWS, Figma

\section*{EDUCATION}

\noindent
\textbf{B.S. Computer Science} \hfill \textit{State University} | 2019

\end{document}
"""

@pytest.fixture
def sample_job_description():
    """Sample job description"""
    return """
Senior Full Stack Engineer

We're looking for an experienced Full Stack Engineer to join our team.

Requirements:
- 5+ years of experience with React and Python
- Strong knowledge of microservices architecture
- Experience with AWS and Docker
- PostgreSQL and database optimization
- RESTful API design
- Agile development experience

Nice to have:
- Experience with TypeScript
- Knowledge of CI/CD pipelines
- Experience with FastAPI
- Previous startup experience
"""

@pytest.fixture
def mock_llm_response():
    """Mock LLM response with optimized LaTeX"""
    return r"""\documentclass[11pt]{article}
\usepackage[margin=0.5in]{geometry}
\usepackage{hyperref}

\begin{document}

\noindent
{\Large \textbf{John Doe}} \\
Email: john@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

\section*{EXPERIENCE}

\noindent
\textbf{Senior Full Stack Engineer} \hfill \textit{TechCorp} | Jan 2021 - Present \\
- Architected microservices using FastAPI and Python, leveraging AWS for scalable deployments
- Developed React-based single-page applications with TypeScript for type safety
- Optimized PostgreSQL queries and database architecture, improving performance by 40%
- Led team of 3 engineers on microservices and cloud infrastructure initiatives
- Implemented CI/CD pipelines with Docker containerization

\noindent
\textbf{Full Stack Developer} \hfill \textit{StartupXYZ} | Jun 2019 - Dec 2020 \\
- Built responsive React components with TypeScript and modern web standards
- Designed and implemented RESTful APIs using FastAPI
- Worked with PostgreSQL for data modeling and query optimization
- Collaborated with product team in Agile environment

\section*{SKILLS}

\noindent
\textbf{Languages:} Python, JavaScript, TypeScript, SQL \\
\textbf{Frontend:} React, HTML, CSS, Tailwind \\
\textbf{Backend:} FastAPI, Node.js, PostgreSQL, Microservices \\
\textbf{Cloud \& DevOps:} AWS, Docker, CI/CD Pipelines \\
\textbf{Tools:} Git, Agile, RESTful API Design

\section*{EDUCATION}

\noindent
\textbf{B.S. Computer Science} \hfill \textit{State University} | 2019

\end{document}
"""
