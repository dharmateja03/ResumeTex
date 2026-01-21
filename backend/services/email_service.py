"""
Email Service using Resend
Sends transactional emails (welcome, notifications, etc.)
"""
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def get_resend_client():
    """Get Resend client at runtime"""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.warning("RESEND_API_KEY not configured - emails disabled")
        return None

    try:
        import resend
        resend.api_key = api_key
        return resend
    except ImportError:
        logger.error("resend package not installed")
        return None


async def send_welcome_email(
    to_email: str,
    user_name: Optional[str] = None
) -> bool:
    """Send welcome email to new user"""
    resend = get_resend_client()
    if not resend:
        return False

    name = user_name or "there"

    try:
        resend.Emails.send({
            "from": "ResumeTex <hello@resumetex.tech>",
            "to": [to_email],
            "subject": "Welcome to ResumeTex - Your Free ATS Resume Optimizer",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #0f172a; font-size: 28px; margin-bottom: 24px;">Welcome to ResumeTex!</h1>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Hey {name},
                </p>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Thanks for signing up! You now have access to:
                </p>

                <ul style="color: #475569; font-size: 16px; line-height: 1.8;">
                    <li><strong>Free ATS Score Checker</strong> - Check your resume's ATS compatibility</li>
                    <li><strong>AI Resume Optimizer</strong> - Tailor your resume to any job description</li>
                    <li><strong>Full Analysis Reports</strong> - Keyword matching, formatting issues & more</li>
                    <li><strong>Cover Letter & Cold Email Generator</strong> - One-click generation</li>
                </ul>

                <div style="margin: 32px 0;">
                    <a href="https://resumetex.tech/#ats-checker"
                       style="background: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        Check Your ATS Score Free
                    </a>
                </div>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Questions? Just reply to this email.
                </p>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Good luck with your job search!<br>
                    <strong>The ResumeTex Team</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

                <p style="color: #94a3b8; font-size: 12px;">
                    ResumeTex - Free AI Resume Optimizer<br>
                    <a href="https://resumetex.tech" style="color: #64748b;">resumetex.tech</a>
                </p>
            </div>
            """
        })

        logger.info(f"Welcome email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
        return False


async def send_optimization_complete_email(
    to_email: str,
    user_name: Optional[str],
    company_name: str,
    optimization_id: str
) -> bool:
    """Send email when optimization is complete"""
    resend = get_resend_client()
    if not resend:
        return False

    name = user_name or "there"

    try:
        resend.Emails.send({
            "from": "ResumeTex <hello@resumetex.tech>",
            "to": [to_email],
            "subject": f"Your resume for {company_name} is ready!",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #0f172a; font-size: 28px; margin-bottom: 24px;">Your Resume is Ready!</h1>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Hey {name},
                </p>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Great news! Your optimized resume for <strong>{company_name}</strong> is ready to download.
                </p>

                <div style="margin: 32px 0;">
                    <a href="https://resumetex.tech/results/{optimization_id}"
                       style="background: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        View & Download Resume
                    </a>
                </div>

                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Good luck with your application!<br>
                    <strong>The ResumeTex Team</strong>
                </p>
            </div>
            """
        })

        logger.info(f"Optimization complete email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send optimization email to {to_email}: {str(e)}")
        return False
