from fastapi import FastAPI, UploadFile, File, Form, Request, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
import requests
from bs4 import BeautifulSoup
import tempfile
import subprocess
import re
import os
import base64
import uuid
import logging
import shutil
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import stripe

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY not found in environment variables")

# Import our custom modules
from database import get_db, User, UserLLMConfig, Optimization, Subscription, PaymentHistory, AdminConfig, APIUsage, create_tables
from auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_master, get_current_admin, get_current_employee, authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from llm_handlers import get_llm_handler, AVAILABLE_LLMS
from email_service import create_email_service

# Create storage directory for user files
STORAGE_DIR = "./user_resumes"
os.makedirs(STORAGE_DIR, exist_ok=True)

def check_latex_installation():
    """Check if LaTeX (pdflatex or tectonic) is installed and accessible"""
    # Try pdflatex first (used in Docker)
    try:
        result = subprocess.run(["pdflatex", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            logger.info(f"pdflatex found: {result.stdout.split()[0:4]}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Fallback to tectonic (for local development)
    try:
        result = subprocess.run(["tectonic", "--version"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            logger.info(f"Tectonic found: {result.stdout.strip()}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    logger.warning("Neither pdflatex nor tectonic found. PDF generation may fail.")
    return False

def create_test_latex_document():
    """Create a minimal test LaTeX document to verify compilation"""
    test_latex = r"""\documentclass[11pt,a4paper]{article}
\usepackage[margin=1in]{geometry}
\usepackage{xcolor}
\usepackage{hyperref}

\title{Test Document}
\author{Test Author}
\date{\today}

\begin{document}
\maketitle

This is a test document to verify LaTeX compilation.

\end{document}
"""
    return test_latex

def test_latex_compilation(latex_content, temp_dir):
    """Test LaTeX compilation with detailed error reporting"""
    logger.debug("Testing LaTeX compilation")
    
    test_tex_path = os.path.join(temp_dir, "test_compilation.tex")
    test_pdf_path = os.path.join(temp_dir, "test_compilation.pdf")
    
    try:
        with open(test_tex_path, "w", encoding="utf-8") as f:
            f.write(latex_content)
        
        logger.debug(f"Testing compilation of: {test_tex_path}")
        result = subprocess.run(
            ["tectonic", test_tex_path, "--outdir", temp_dir], 
            capture_output=True, 
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            logger.debug("Test compilation successful")
            return True, None
        else:
            logger.error(f"Test compilation failed with exit code {result.returncode}")
            logger.error(f"Test compilation stdout: {result.stdout}")
            logger.error(f"Test compilation stderr: {result.stderr}")
            return False, f"Compilation failed: {result.stderr}"
            
    except Exception as e:
        logger.error(f"Test compilation error: {e}")
        return False, f"Test compilation error: {str(e)}"

def validate_latex_content(latex_content):
    """Enhanced validation of LaTeX content"""
    logger.debug("Validating LaTeX content")
    
    # Check for basic LaTeX structure
    if not latex_content.strip():
        return False, "LaTeX content is empty"
    
    if "\\documentclass" not in latex_content:
        return False, "Missing \\documentclass"
    
    if "\\begin{document}" not in latex_content:
        return False, "Missing \\begin{document}"
    
    if "\\end{document}" not in latex_content:
        return False, "Missing \\end{document}"
    
    # Check for common problematic packages
    problematic_packages = [
       
    ]
    
    for package in problematic_packages:
        if package in latex_content:
            return False, f"Prohibited package found: {package}"
    
    # BUG FIX 20: Additional syntax validation
    # Check for balanced braces
    # brace_count = 0
    # for char in latex_content:
    #     if char == '{':
    #         brace_count += 1
    #     elif char == '}':
    #         brace_count -= 1
    #         if brace_count < 0:
    #             return False, "Unbalanced braces detected (too many closing braces)"
    
    # if brace_count > 0:
    #     return False, f"Unbalanced braces detected (missing {brace_count} closing braces)"
    
    # Check for incomplete commands
    lines = latex_content.split('\n')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.endswith('\\') and not stripped.endswith('\\\\'):
            return False, f"Incomplete command detected on line {i}: {stripped}"
    
    # Check for common LaTeX syntax errors
    if '\\@' in latex_content and '\\@argdef' not in latex_content:
        logger.warning("Found \\@ symbol which might cause compilation issues")
    
    # Check for missing required packages
    if '\\usepackage{geometry}' not in latex_content and '\\usepackage[margin=' in latex_content:
        return False, "Missing geometry package but using geometry commands"
    
    return True, "LaTeX content appears valid"

# BUG FIX 1: Use lifespan instead of deprecated @app.on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Resume Optimizer application...")
    try:
        # Create database tables
        create_tables()
        logger.info("Database tables created successfully")
        
        # Create master user if it doesn't exist
        try:
            db = next(get_db())
            master_username = os.getenv("MASTER_USERNAME", "admin")
            master_password = os.getenv("MASTER_PASSWORD")
            
            if master_password:
                existing_master = db.query(User).filter(
                    User.username == master_username,
                    User.role == "master"
                ).first()
                
                if not existing_master:
                    # Create new master user
                    hashed_password = get_password_hash(master_password)
                    master_user = User(
                        username=master_username,
                        email=f"{master_username}@system.local",
                        hashed_password=hashed_password,
                        role="master",
                        has_access=True,
                        is_active=True,
                        master_id=None
                    )
                    db.add(master_user)
                    db.commit()
                    logger.info(f"✅ Master user '{master_username}' created successfully")
                else:
                    logger.info(f"Master user '{master_username}' already exists")
                    
            else:
                logger.warning("MASTER_PASSWORD not set - master user not created")
                
        except Exception as e:
            logger.error(f"Error creating master user: {e}")
        finally:
            db.close()
        
        # Run startup tasks (migrations and user seeding)
        try:
            import subprocess
            import sys
            logger.info("Running startup initialization...")
            
            result = subprocess.run([sys.executable, "startup.py"], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                logger.info("✅ Startup initialization completed")
                # Log key messages from startup
                for line in result.stdout.split('\n'):
                    if any(marker in line for marker in ['✅', '👑', '👤', '⚠️', '🎉']):
                        logger.info(line.strip())
            else:
                logger.warning(f"Startup warnings: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.warning("Startup tasks timed out - continuing with app startup")
        except Exception as e:
            logger.warning(f"Startup tasks failed: {e} - continuing with app startup")
        
        # Check LaTeX installation (non-blocking)
        latex_available = check_latex_installation()
        if latex_available:
            logger.info("LaTeX compiler is available - PDF generation enabled")
        else:
            logger.warning("LaTeX compiler not found - PDF generation may fail")
            
        logger.info("Application startup completed successfully")
            
    except Exception as e:
        logger.error(f"Startup error: {e}")
        # Don't raise - let the app start even if there are minor issues
        logger.info("Application starting despite startup warnings")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(title="LaTeX Resume Optimizer", version="2.0.0", lifespan=lifespan)

# Import and mount personal app
from personal_app import personal_app
app.mount("/personal", personal_app)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error in {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "body": str(exc.body) if hasattr(exc, 'body') else "No body"
        }
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_latex_output(text):
    logger.debug("Cleaning LaTeX output")
    logger.debug(f"Raw AI response length: {len(text)}")
    
    # Remove markdown code blocks if present
    if '```latex' in text:
        logger.debug("Found markdown code block, extracting LaTeX")
        start = text.find('```latex') + 8
        end = text.find('```', start)
        if end != -1:
            text = text[start:end].strip()
        else:
            # If no closing ```, take everything after ```latex
            text = text[start:].strip()
    elif '```' in text:
        logger.debug("Found generic code block, extracting content")
        start = text.find('```') + 3
        end = text.find('```', start)
        if end != -1:
            text = text[start:end].strip()
        else:
            text = text[start:].strip()
    
    # Remove any text before \documentclass
    if '\\documentclass' in text:
        start = text.find('\\documentclass')
        text = text[start:]
        logger.debug("Extracted content starting from \\documentclass")
    else:
        logger.warning("No \\documentclass found in AI response")
    
    # Remove any text after \end{document}
    if '\\end{document}' in text:
        end = text.find('\\end{document}') + len('\\end{document}')
        text = text[:end]
        logger.debug("Extracted content ending with \\end{document}")
    else:
        logger.warning("No \\end{document} found in AI response")
    
    # Clean up lines
    lines = text.strip().splitlines()
    forbidden = [
        '\\input{glyphtounicode}',
        '\\fontspec',
        '\\xunicode',
        '\\pdfgentounicode',
        'fontspec.sty',
        'xunicode.sty',
        'glyphtounicode',
    ]
    def is_forbidden(line):
        for key in forbidden:
            if key in line:
                return True
        return False
    
    # Remove forbidden lines and markdown
    lines = [line for line in lines if not line.strip().startswith('```')]
    lines = [line for line in lines if not is_forbidden(line)]
    cleaned = '\n'.join(lines)
    
    # Final regex extraction as fallback
    match = re.search(r'(\\documentclass[\s\S]+?\\end{document})', cleaned)
    if match:
        cleaned = match.group(1)
        logger.debug("Successfully extracted LaTeX using regex")
    else:
        logger.warning("Regex extraction failed, using cleaned text as-is")
    
    # BUG FIX 19: Additional LaTeX syntax validation and fixing
    logger.debug("Performing additional LaTeX syntax validation")
    
    # Check for balanced braces
    brace_count = 0
    for char in cleaned:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count < 0:
                logger.warning("Unbalanced braces detected, attempting to fix")
                break
    
    if brace_count > 0:
        logger.warning(f"Unbalanced braces detected (count: {brace_count}), adding missing closing braces")
        cleaned += '}' * brace_count
    
    # Check for incomplete commands (commands that end with backslash)
    lines = cleaned.split('\n')
    fixed_lines = []
    for line in lines:
        # Remove lines that end with backslash (incomplete commands)
        if line.strip().endswith('\\') and not line.strip().endswith('\\\\'):
            logger.warning(f"Removing incomplete command: {line.strip()}")
            continue
        fixed_lines.append(line)
    
    cleaned = '\n'.join(fixed_lines)
    
    # Remove any empty lines at the beginning and end
    cleaned = cleaned.strip()
    
    logger.debug(f"Cleaned LaTeX length: {len(cleaned)}")
    return cleaned

def extract_job_description_from_url(url):
    logger.info(f"Extracting job description from URL: {url}")
    try:
        # BUG FIX 2: Add headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=30)  # BUG FIX 3: Add timeout
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # BUG FIX 4: Remove scripts and style tags for cleaner text
        for script in soup(["script", "style"]):
            script.extract()
        
        text = soup.get_text(separator='\n')
        
        # BUG FIX 5: Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_text = '\n'.join(lines)
        
        logger.info(f"Successfully extracted {len(cleaned_text)} characters from URL")
        return cleaned_text
    except Exception as e:
        logger.error(f"Failed to extract job description from URL: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract job description: {str(e)}")

def replace_header_location(latex_code, new_location):
    logger.debug(f"Replacing location in header with: {new_location}")
    # BUG FIX 6: Handle multiple possible location patterns
    patterns = [
        r'(\\location\{)[^}]*\}',
        r'(\\address\{)[^}]*\}',
        r'(\\textit\{)[^}]*City[^}]*\}',
        r'(City, State[^\\]*)',
    ]
    
    for pattern in patterns:
        if re.search(pattern, latex_code):
            if '\\location' in pattern or '\\address' in pattern:
                latex_code = re.sub(pattern, r'\1' + re.escape(new_location) + r'}', latex_code, count=1)
            else:
                latex_code = re.sub(pattern, re.escape(new_location), latex_code, count=1)
            break
    
    return latex_code

# Authentication endpoints
@app.post("/register")
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("employee"),  # Default to employee role
    db: Session = Depends(get_db)
):
    logger.info(f"Registration attempt for username: {username}, email: {email}, role: {role}")
    try:
        # BUG FIX 7: Add input validation
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if '@' not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate role
        if role not in ["master", "admin", "employee"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'master', 'admin' or 'employee'")
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing_user:
            logger.warning(f"Registration failed - user already exists: {username}")
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(password)
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=role,
            has_access=True if role == "master" else False  # Masters get immediate access
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"User registered successfully: {username} with role: {role}")
        return {"message": "User registered successfully", "role": role}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        db.rollback()  # BUG FIX 8: Rollback on error
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for username: {username}")
    try:
        user = authenticate_user(db, username, password)
        if not user:
            logger.warning(f"Login failed for username: {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        logger.info(f"Login successful for username: {username}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/available-llms")
async def get_available_llms():
    """Get list of available LLM providers and their models"""
    logger.info("Fetching available LLMs")
    return AVAILABLE_LLMS

@app.post("/save-llm-config")
async def save_llm_config(
    llm_provider: str = Form(...),
    model_name: str = Form(...),
    is_default: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user's LLM configuration (without storing API key)"""
    logger.info(f"Saving LLM config for user {current_user.username}: {llm_provider} - {model_name}")
    
    try:
        # Validate LLM provider
        if llm_provider not in AVAILABLE_LLMS:
            logger.error(f"Invalid LLM provider: {llm_provider}")
            raise HTTPException(status_code=400, detail="Invalid LLM provider")
        
        # Validate model name
        if model_name not in AVAILABLE_LLMS[llm_provider]["models"]:
            logger.error(f"Invalid model name: {model_name} for provider {llm_provider}")
            raise HTTPException(status_code=400, detail="Invalid model name")
        
        # If setting as default, unset other defaults for this user
        if is_default:
            db.query(UserLLMConfig).filter(
                UserLLMConfig.user_id == current_user.id,
                UserLLMConfig.is_default == True
            ).update({"is_default": False})
        
        # Save configuration (without API key)
        config = UserLLMConfig(
            user_id=current_user.id,
            llm_provider=llm_provider,
            model_name=model_name,
            is_default=is_default
        )
        db.add(config)
        db.commit()
        
        logger.info(f"LLM config saved successfully for user {current_user.username}")
        return {"message": "LLM configuration saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving LLM config: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save LLM configuration")

@app.get("/user-llm-configs")
async def get_user_llm_configs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's LLM configurations"""
    logger.info(f"Fetching LLM configs for user {current_user.username}")
    try:
        configs = db.query(UserLLMConfig).filter(
            UserLLMConfig.user_id == current_user.id
        ).all()
        
        logger.info(f"Found {len(configs)} configs for user {current_user.username}")
        return [
            {
                "id": config.id,
                "llm_provider": config.llm_provider,
                "model_name": config.model_name,
                "is_default": config.is_default,
                "created_at": config.created_at
            }
            for config in configs
        ]
    except Exception as e:
        logger.error(f"Error fetching LLM configs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch LLM configurations")

# Global variable to store master resumes in memory
master_resumes = {}  # user_id -> resume_data

@app.post("/upload_master_resume/")
async def upload_master_resume(
    latex_file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Upload user's master resume"""
    logger.info(f"Uploading master resume for user {current_user.username}: {latex_file.filename}")
    
    try:
        if not latex_file.filename.endswith('.tex'):
            logger.error(f"Invalid file type: {latex_file.filename}")
            raise HTTPException(status_code=400, detail="File must be a .tex file")
        
        content = (await latex_file.read()).decode("utf-8")
        logger.info(f"Read {len(content)} characters from file {latex_file.filename}")
        
        # BUG FIX 11: Validate LaTeX content before saving
        is_valid, validation_msg = validate_latex_content(content)
        if not is_valid:
            logger.error(f"Invalid LaTeX content: {validation_msg}")
            raise HTTPException(status_code=400, detail=f"Invalid LaTeX file: {validation_msg}")
        
        # Store master resume in database (persistent)
        logger.info(f"Storing master resume in database for user {current_user.username}")
        logger.info(f"User ID: {current_user.id}")
        logger.info(f"Content length: {len(content)} characters")
        logger.info(f"Content preview: {content[:100]}...")
        
        current_user.master_resume_latex = content
        logger.info("Set master_resume_latex field on user object")
        
        try:
            db.commit()
            logger.info("Database commit successful")
            
            # Verify the data was stored
            db.refresh(current_user)
            stored_content = current_user.master_resume_latex
            if stored_content:
                logger.info(f"Verification: Data stored successfully, length: {len(stored_content)}")
            else:
                logger.error("Verification: master_resume_latex is None after commit!")
                
        except Exception as e:
            logger.error(f"Database commit failed: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to store resume: {str(e)}")
        
        # Also store in memory for backwards compatibility
        master_resumes[current_user.id] = {
            'filename': latex_file.filename,
            'latex_content': content,
            'created_at': datetime.utcnow()
        }
        logger.info(f"Also stored in memory cache, total cached resumes: {len(master_resumes)}")
        
        logger.info(f"Master resume uploaded successfully for user {current_user.username}")
        return {"message": "Master resume uploaded and stored successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading master resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload master resume")

@app.post("/optimize_resume/")
async def optimize_resume(
    job_url: str = Form(None),
    job_description: str = Form(None),
    prompt: str = Form(None),
    company_name: str = Form(None),
    location: str = Form(None),
    llm_config_id: int = Form(...),
    api_key: str = Form(None), # Add api_key parameter
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Optimize resume using selected LLM configuration and return PDF for download"""
    logger.info(f"Starting resume optimization for user {current_user.username}")
    logger.info(f"Received data - Company: '{company_name}', Location: '{location}', LLM Config ID: '{llm_config_id}'")
    logger.info(f"Job URL: '{job_url}', Job Description length: {len(job_description) if job_description else 0}")
    
    # Validate required fields with detailed logging
    if not llm_config_id:
        logger.error(f"LLM config ID is missing or invalid: '{llm_config_id}'")
        raise HTTPException(status_code=422, detail="LLM configuration ID is required")
    
    if not api_key or not api_key.strip():
        logger.error("API key is missing or empty")
        raise HTTPException(status_code=422, detail="API key is required")
    
    if not company_name or not company_name.strip():
        logger.error(f"Company name is missing or empty: '{company_name}'")
        raise HTTPException(status_code=422, detail="Company name is required")
    
    if not job_description or not job_description.strip():
        if not job_url or not job_url.strip():
            logger.error(f"Both job description and job URL are missing. Job desc: '{job_description}', Job URL: '{job_url}'")
            raise HTTPException(status_code=422, detail="Either job description or job URL is required")
    
    logger.info("All required fields validated successfully")
    
    temp_dir = None
    try:
        # Get user's master resume from memory
        logger.debug("Fetching master resume from memory")
        master_resume = master_resumes.get(current_user.id)
        
        if not master_resume:
            logger.error(f"No master resume found for user {current_user.username}")
            raise HTTPException(
                status_code=400, 
                detail="No master resume uploaded yet. Please upload resume.tex first!"
            )
        
        logger.info(f"Found master resume: {master_resume['filename']}")
        
        # Get LLM configuration
        logger.debug(f"Fetching LLM config with ID: {llm_config_id}")
        llm_config = db.query(UserLLMConfig).filter(
            UserLLMConfig.id == llm_config_id,
            UserLLMConfig.user_id == current_user.id
        ).first()
        
        if not llm_config:
            logger.error(f"Invalid LLM config ID: {llm_config_id} for user {current_user.username}")
            raise HTTPException(status_code=400, detail="Invalid LLM configuration")
        
        logger.info(f"Using LLM config: {llm_config.llm_provider} - {llm_config.model_name}")
        
        # Get job description
        if job_url:
            logger.info("Extracting job description from URL")
            job_description_text = extract_job_description_from_url(job_url)
        elif job_description:
            logger.info("Using provided job description")
            job_description_text = job_description
        else:
            logger.error("No job description or URL provided")
            raise HTTPException(status_code=400, detail="Provide job_description or job_url!")

        if not company_name:
            logger.error("No company name provided")
            raise HTTPException(status_code=400, detail="Company name is required!")
        
        # Create LLM handler
        logger.debug("Creating LLM handler")
        try:
            llm_handler = get_llm_handler(
                llm_config.llm_provider,
                api_key, # Use the provided api_key
                llm_config.model_name
            )
            logger.info("LLM handler created successfully")
        except Exception as e:
            logger.error(f"Failed to create LLM handler: {e}")
            raise HTTPException(status_code=400, detail=f"LLM configuration error: {str(e)}")
        
        # Prepare prompt
        logger.debug("Preparing AI prompt")
        FIXED_LAST_LINE = (
            "IMPORTANT: You MUST output ONLY valid LaTeX code that starts with \\documentclass and ends with \\end{document}. "
            "Do NOT include any explanations, markdown formatting, code blocks, or text outside the LaTeX code. "
            "Your response must be a complete, compilable LaTeX document. "
            "If you find any geographic, citizenship, or clearance requirements (e.g., 'US Citizens only'), respond ONLY with: BLOCKED: <reason>. "
            "Do NOT use or output \\pdfgentounicode, \\input{glyphtounicode}, \\fontspec, \\xunicode, or any external or non-standard font or Unicode packages or commands. "
            "Only use standard LaTeX packages and commands that compile on Overleaf or TeX Live. "
            "CRITICAL: Ensure all LaTeX commands are complete and properly formatted. "
            "Check that all opening braces { have matching closing braces }. "
            "Do NOT leave any commands incomplete or with missing parameters. "
            "Your output MUST be ONLY the raw, complete LaTeX resume code, starting with \\documentclass and ending with \\end{document}. "
            "If you include anything except the raw, complete LaTeX code, you have failed the task."
        )
        
        location_instruction = f'Update location to this: "{location}"' if location else ''
        if prompt:
            full_prompt = prompt.strip()
            if location_instruction:
                full_prompt += "\n" + location_instruction
            full_prompt += "\n\n" + FIXED_LAST_LINE
        else:
            full_prompt = (location_instruction + "\n\n" if location_instruction else "") + FIXED_LAST_LINE

        logger.info(f"Prepared prompt with {len(full_prompt)} characters")
        
        # Call LLM API with cost tracking and caching
        logger.info("Calling LLM API with cost tracking")
        try:
            llm_response = llm_handler.optimize_resume(
                prompt=full_prompt,
                job_description=job_description_text,
                master_latex=master_resume['latex_content']
            )
            
            if not llm_response.success:
                logger.error(f"LLM API error: {llm_response.error_message}")
                raise HTTPException(status_code=500, detail=f"LLM API error: {llm_response.error_message}")
            
            ai_response = llm_response.content
            logger.info(f"LLM API response received: {len(ai_response)} characters, Cost: ${llm_response.cost_usd:.4f}, Cached: {llm_response.cached_template}")
            logger.debug(f"AI Response preview (first 200 chars): {ai_response[:200]}...")
            
            # Store API usage in database
            api_usage = APIUsage(
                admin_id=admin_user.id,
                optimization_id=optimization.id,
                provider=config.default_model.split('-')[0] if '-' in config.default_model else 'openai',  # Extract provider from model
                model_name=config.default_model,
                input_tokens=llm_response.input_tokens,
                output_tokens=llm_response.output_tokens,
                total_tokens=llm_response.total_tokens,
                cost_usd=llm_response.cost_usd,
                cached_template=llm_response.cached_template,
                response_time_ms=llm_response.response_time_ms,
                success=True
            )
            db.add(api_usage)
            
            # Update optimization record with cost tracking
            optimization.input_tokens = llm_response.input_tokens
            optimization.output_tokens = llm_response.output_tokens
            optimization.total_cost = llm_response.cost_usd
            optimization.cached_template = llm_response.cached_template
            
        except Exception as e:
            logger.error(f"LLM API error: {e}")
            
            # Store failed API usage
            api_usage = APIUsage(
                admin_id=admin_user.id,
                optimization_id=optimization.id,
                provider=config.default_model.split('-')[0] if '-' in config.default_model else 'openai',
                model_name=config.default_model,
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                cost_usd=0.0,
                cached_template=False,
                response_time_ms=0,
                success=False,
                error_message=str(e)
            )
            db.add(api_usage)
            db.commit()
            
            raise HTTPException(status_code=500, detail=f"LLM API error: {str(e)}")
        
        if ai_response.strip().startswith('BLOCKED:'):
            logger.warning(f"Job blocked: {ai_response.strip()}")
            raise HTTPException(status_code=400, detail=ai_response.strip())
        
        # Clean and process LaTeX
        logger.debug("Cleaning LaTeX output")
        optimized_latex = clean_latex_output(ai_response)

        # Additional validation: Check if we have a complete LaTeX document
        if not optimized_latex.strip().startswith('\\documentclass'):
            logger.error("AI response does not start with \\documentclass")
            logger.error(f"Response starts with: {optimized_latex[:100]}...")
            raise HTTPException(
                status_code=500, 
                detail="AI failed to generate valid LaTeX. The response does not contain a proper LaTeX document. Please try again."
            )
        
        if not optimized_latex.strip().endswith('\\end{document}'):
            logger.error("AI response does not end with \\end{document}")
            logger.error(f"Response ends with: {optimized_latex[-100:]}...")
            raise HTTPException(
                status_code=500, 
                detail="AI failed to generate valid LaTeX. The response is incomplete. Please try again."
            )
        
        if location:
            logger.debug("Updating location in header")
            optimized_latex = replace_header_location(optimized_latex, location)

        # Validate LaTeX content before compilation
        logger.debug("Validating LaTeX content")
        is_valid, validation_msg = validate_latex_content(optimized_latex)
        if not is_valid:
            logger.error(f"LaTeX validation failed: {validation_msg}")
            raise HTTPException(status_code=500, detail=f"Generated LaTeX is invalid: {validation_msg}")
        
        logger.info("LaTeX validation passed")
        
        # BUG FIX 23: Test compilation before actual compilation
        logger.debug("Testing LaTeX compilation")
        temp_dir = os.path.join(tempfile.gettempdir(), f"resumeopt_test_{str(uuid.uuid4())}")
        os.makedirs(temp_dir, exist_ok=True)
        
        test_success, test_error = test_latex_compilation(optimized_latex, temp_dir)
        if not test_success:
            logger.error(f"Test compilation failed: {test_error}")
            # Clean up test directory
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
            raise HTTPException(
                status_code=500, 
                detail=f"LaTeX compilation test failed. The generated LaTeX has syntax errors: {test_error}"
            )
        
        logger.info("Test compilation successful")
        # Clean up test directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass
        
        # Generate PDF
        logger.info("Generating PDF")
        safe_company_name = re.sub(r'[^\w\-_]', '', company_name)  # Sanitize company name
        base_filename = f"{safe_company_name}_resume"
        
        temp_id = str(uuid.uuid4())
        temp_dir = os.path.join(tempfile.gettempdir(), f"resumeopt_{temp_id}")
        os.makedirs(temp_dir, exist_ok=True)
        tex_path = os.path.join(temp_dir, base_filename + ".tex")
        pdf_path = os.path.join(temp_dir, base_filename + ".pdf")

        logger.debug(f"Writing LaTeX to: {tex_path}")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(optimized_latex)

        # Log the first few lines of the LaTeX for debugging
        logger.debug(f"LaTeX content preview (first 500 chars): {optimized_latex[:500]}...")
        
        # BUG FIX 21: Create a backup of the LaTeX content for debugging
        debug_tex_path = os.path.join(temp_dir, "debug_" + base_filename + ".tex")
        with open(debug_tex_path, "w", encoding="utf-8") as f:
            f.write(f"% Debug version of LaTeX content\n% Generated at: {datetime.utcnow()}\n% Original length: {len(optimized_latex)} characters\n\n")
            f.write(optimized_latex)
        logger.debug(f"Debug LaTeX file created: {debug_tex_path}")
        
        try:
            logger.debug(f"Running tectonic command: tectonic {tex_path} --outdir {temp_dir}")
            result = subprocess.run(
                ["tectonic", tex_path, "--outdir", temp_dir], 
                check=True, 
                capture_output=True, 
                text=True,
                timeout=60  # BUG FIX 14: Add timeout to prevent hanging
            )
            logger.info("PDF compilation successful")
            
            # BUG FIX 15: Log tectonic output for debugging
            if result.stdout:
                logger.debug(f"Tectonic stdout: {result.stdout}")
            if result.stderr:
                logger.debug(f"Tectonic stderr: {result.stderr}")
                
        except subprocess.CalledProcessError as e:
            logger.error(f"PDF compilation failed with exit code {e.returncode}")
            logger.error(f"Tectonic stdout: {e.stdout}")
            logger.error(f"Tectonic stderr: {e.stderr}")
            
            # Create a more detailed error message
            error_msg = f"PDF compilation failed (exit code {e.returncode})"
            
            # BUG FIX 22: Provide more specific error analysis
            if "\\@argdef" in str(e.stderr):
                error_msg += "\n\nThis error typically occurs when there are incomplete LaTeX commands or syntax errors."
                error_msg += "\nThe AI may have generated malformed LaTeX code. Please try again."
            elif "File ended while scanning" in str(e.stderr):
                error_msg += "\n\nThis error indicates incomplete LaTeX structure or missing closing braces."
                error_msg += "\nThe AI may have generated incomplete LaTeX code. Please try again."
            elif "Missing \\end{document}" in str(e.stderr):
                error_msg += "\n\nThis error indicates the LaTeX document is incomplete."
                error_msg += "\nThe AI may have generated incomplete LaTeX code. Please try again."
            
            if e.stderr:
                error_msg += f"\n\nError details:\n{e.stderr}"
            if e.stdout:
                error_msg += f"\n\nOutput:\n{e.stdout}"
            
            # Log the problematic LaTeX content for debugging
            logger.error(f"Problematic LaTeX content (first 1000 chars): {optimized_latex[:1000]}...")
            
            raise HTTPException(status_code=500, detail=error_msg)
        except subprocess.TimeoutExpired:
            logger.error("PDF compilation timed out")
            raise HTTPException(status_code=500, detail="PDF compilation timed out")
        except FileNotFoundError:
            logger.error("Tectonic command not found. Please install Tectonic LaTeX compiler.")
            raise HTTPException(
                status_code=500, 
                detail="Tectonic LaTeX compiler not found. Please install it first:\n"
                       "macOS: brew install tectonic\n"
                       "Linux: Download from https://tectonic-typesetting.github.io/\n"
                       "Windows: Download from the official website"
            )
        
        if not os.path.exists(pdf_path):
            logger.error("PDF file not found after compilation")
            raise HTTPException(status_code=500, detail="PDF compilation failed - no output file generated")
        
        logger.info(f"PDF generated successfully: {pdf_path}")
        
        # Save optimization metadata to database (without LaTeX content or PDF path)
        logger.debug("Saving optimization metadata to database")
        optimization = Optimization(
            user_id=current_user.id,
            company_name=company_name,
            location=location or "",
            llm_provider=llm_config.llm_provider,
            model_name=llm_config.model_name
        )
        db.add(optimization)
        db.commit()
        
        # Read the PDF file and return it for download
        try:
            with open(pdf_path, "rb") as f:
                pdf_content = f.read()
            
            # Create filename for download
            download_filename = f"{safe_company_name}.pdf"
            
            logger.info(f"Optimization completed successfully for user {current_user.username}")
            logger.info(f"PDF ready for download: {download_filename}")
            
            # Return PDF file for download
            return Response(
                content=pdf_content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={download_filename}",
                    "Content-Length": str(len(pdf_content))
                }
            )
            
        except Exception as e:
            logger.error(f"Error reading PDF file: {e}")
            raise HTTPException(status_code=500, detail="Failed to read generated PDF file")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in optimize_resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Resume optimization failed")
    finally:
        # Clean up temporary files
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir)
                logger.debug(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary directory {temp_dir}: {e}")

@app.get("/user-optimizations")
async def get_user_optimizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's optimization history (metadata only)"""
    logger.info(f"Fetching optimization history for user {current_user.username}")
    try:
        optimizations = db.query(Optimization).filter(
            Optimization.user_id == current_user.id
        ).order_by(Optimization.created_at.desc()).all()
        
        logger.info(f"Found {len(optimizations)} optimizations for user {current_user.username}")
        return [
            {
                "id": opt.id,
                "company_name": opt.company_name,
                "location": opt.location,
                "llm_provider": opt.llm_provider,
                "model_name": opt.model_name,
                "created_at": opt.created_at
            }
            for opt in optimizations
        ]
    except Exception as e:
        logger.error(f"Error fetching optimization history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch optimization history")

@app.get("/download_temp_file/{temp_id}/{filename}")
def download_temp_file(temp_id: str, filename: str):
    logger.info(f"Download request: {filename} from temp_id: {temp_id}")
    try:
        # BUG FIX 17: Validate temp_id to prevent directory traversal
        if not re.match(r'^[a-fA-F0-9\-]{36}$', temp_id):
            raise HTTPException(status_code=400, detail="Invalid temp ID")
        
        temp_dir = os.path.join(tempfile.gettempdir(), f"resumeopt_{temp_id}")
        file_path = os.path.join(temp_dir, filename)
        
        # BUG FIX 18: Validate filename to prevent directory traversal
        if not os.path.basename(filename) == filename or '..' in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail="File not found or expired.")
        
        if filename.endswith('.pdf'):
            media_type = "application/pdf"
        elif filename.endswith('.tex'):
            media_type = "application/x-tex"
        else:
            media_type = "application/octet-stream"
            
        logger.info(f"Serving file: {file_path}")
        return FileResponse(file_path, media_type=media_type, filename=filename)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(status_code=500, detail="File download failed")



@app.post("/test-latex-compilation")
async def test_latex_compilation_endpoint(
    latex_content: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Test LaTeX compilation without saving to database"""
    logger.info(f"Testing LaTeX compilation for user {current_user.username}")
    
    try:
        # Validate LaTeX content
        is_valid, validation_msg = validate_latex_content(latex_content)
        if not is_valid:
            return JSONResponse({
                "success": False,
                "error": f"LaTeX validation failed: {validation_msg}"
            })
        
        # Create temporary directory for testing
        temp_dir = os.path.join(tempfile.gettempdir(), f"resumeopt_test_{str(uuid.uuid4())}")
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Test compilation
            test_success, test_error = test_latex_compilation(latex_content, temp_dir)
            
            if test_success:
                return JSONResponse({
                    "success": True,
                    "message": "LaTeX compilation test successful"
                })
            else:
                return JSONResponse({
                    "success": False,
                    "error": f"LaTeX compilation failed: {test_error}"
                })
        finally:
            # Clean up test directory
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
                
    except Exception as e:
        logger.error(f"Error testing LaTeX compilation: {e}")
        return JSONResponse({
            "success": False,
            "error": f"Test failed: {str(e)}"
        })

@app.get("/stripe-publishable-key")
async def get_stripe_publishable_key():
    """Get Stripe publishable key for frontend"""
    if not STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    return {"publishable_key": STRIPE_PUBLISHABLE_KEY}

@app.post("/create-checkout-session")
async def create_checkout_session(
    plan_type: str = Form(...),  # 'monthly' or 'yearly'
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""
    logger.info(f"Creating checkout session for user {current_user.username}, plan: {plan_type}")
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        # Define pricing based on plan type
        if plan_type == "monthly":
            price_id = os.getenv("STRIPE_MONTHLY_PRICE_ID")
            amount = 1500  # $15.00 in cents
        elif plan_type == "yearly":
            price_id = os.getenv("STRIPE_YEARLY_PRICE_ID")
            amount = 10000  # $100.00 in cents
        else:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        if not price_id:
            raise HTTPException(status_code=500, detail="Stripe price ID not configured")
        
        # Create or get Stripe customer
        existing_subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == 'active'
        ).first()
        
        if existing_subscription:
            customer_id = existing_subscription.stripe_customer_id
        else:
            # Create new customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.username,
                metadata={
                    'user_id': current_user.id,
                    'username': current_user.username
                }
            )
            customer_id = customer.id
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('BASE_URL', 'http://localhost:8000')}/app?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('BASE_URL', 'http://localhost:8000')}/payments?canceled=true",
            metadata={
                'user_id': current_user.id,
                'plan_type': plan_type
            }
        )
        
        logger.info(f"Checkout session created: {checkout_session.id}")
        return {"session_id": checkout_session.id, "url": checkout_session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@app.post("/create-portal-session")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe customer portal session"""
    logger.info(f"Creating portal session for user {current_user.username}")
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        # Get user's subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == 'active'
        ).first()
        
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=f"{os.getenv('BASE_URL', 'http://localhost:8000')}/app"
        )
        
        logger.info(f"Portal session created: {portal_session.id}")
        return {"url": portal_session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Portal error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")

@app.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    try:
        body = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(status_code=400, detail="No signature header")
        
        event = stripe.Webhook.construct_event(body, sig_header, webhook_secret)
        logger.info(f"Webhook received: {event['type']}")
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await handle_checkout_completed(session, db)
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            await handle_subscription_created(subscription, db)
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            await handle_subscription_updated(subscription, db)
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            await handle_subscription_deleted(subscription, db)
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            await handle_payment_succeeded(invoice, db)
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            await handle_payment_failed(invoice, db)
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook error")

async def handle_checkout_completed(session, db: Session):
    """Handle checkout.session.completed webhook"""
    logger.info(f"Handling checkout completed: {session.id}")
    
    user_id = session.metadata.get('user_id')
    plan_type = session.metadata.get('plan_type')
    
    if not user_id or not plan_type:
        logger.error(f"Missing metadata in session: {session.id}")
        return
    
    # Record payment
    payment = PaymentHistory(
        user_id=int(user_id),
        stripe_payment_intent_id=session.payment_intent,
        amount=session.amount_total / 100,  # Convert from cents
        status='succeeded',
        plan_type=plan_type
    )
    db.add(payment)
    db.commit()

async def handle_subscription_created(subscription, db: Session):
    """Handle customer.subscription.created webhook"""
    logger.info(f"Handling subscription created: {subscription.id}")
    
    customer = stripe.Customer.retrieve(subscription.customer)
    user_id = customer.metadata.get('user_id')
    
    if not user_id:
        logger.error(f"No user_id in customer metadata: {subscription.customer}")
        return
    
    # Determine plan type from price
    price_id = subscription.items.data[0].price.id
    plan_type = 'monthly' if 'monthly' in price_id.lower() else 'yearly'
    
    # Create or update subscription record
    existing_sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription.id
    ).first()
    
    if existing_sub:
        existing_sub.status = subscription.status
        existing_sub.current_period_start = datetime.fromtimestamp(subscription.current_period_start)
        existing_sub.current_period_end = datetime.fromtimestamp(subscription.current_period_end)
        existing_sub.amount = subscription.items.data[0].price.unit_amount / 100
    else:
        new_sub = Subscription(
            user_id=int(user_id),
            stripe_customer_id=subscription.customer,
            stripe_subscription_id=subscription.id,
            plan_type=plan_type,
            status=subscription.status,
            current_period_start=datetime.fromtimestamp(subscription.current_period_start),
            current_period_end=datetime.fromtimestamp(subscription.current_period_end),
            amount=subscription.items.data[0].price.unit_amount / 100
        )
        db.add(new_sub)
    
    db.commit()

async def handle_subscription_updated(subscription, db: Session):
    """Handle customer.subscription.updated webhook"""
    logger.info(f"Handling subscription updated: {subscription.id}")
    
    db_sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription.id
    ).first()
    
    if db_sub:
        db_sub.status = subscription.status
        db_sub.current_period_start = datetime.fromtimestamp(subscription.current_period_start)
        db_sub.current_period_end = datetime.fromtimestamp(subscription.current_period_end)
        db_sub.amount = subscription.items.data[0].price.unit_amount / 100
        db.commit()

async def handle_subscription_deleted(subscription, db: Session):
    """Handle customer.subscription.deleted webhook"""
    logger.info(f"Handling subscription deleted: {subscription.id}")
    
    db_sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription.id
    ).first()
    
    if db_sub:
        db_sub.status = 'canceled'
        db.commit()

async def handle_payment_succeeded(invoice, db: Session):
    """Handle invoice.payment_succeeded webhook"""
    logger.info(f"Handling payment succeeded: {invoice.id}")
    
    if invoice.subscription:
        subscription = stripe.Subscription.retrieve(invoice.subscription)
        customer = stripe.Customer.retrieve(subscription.customer)
        user_id = customer.metadata.get('user_id')
        
        if user_id:
            payment = PaymentHistory(
                user_id=int(user_id),
                stripe_payment_intent_id=invoice.payment_intent,
                amount=invoice.amount_paid / 100,
                status='succeeded',
                plan_type='monthly' if 'monthly' in subscription.items.data[0].price.id.lower() else 'yearly'
            )
            db.add(payment)
            db.commit()

async def handle_payment_failed(invoice, db: Session):
    """Handle invoice.payment_failed webhook"""
    logger.info(f"Handling payment failed: {invoice.id}")
    
    if invoice.subscription:
        subscription = stripe.Subscription.retrieve(invoice.subscription)
        customer = stripe.Customer.retrieve(subscription.customer)
        user_id = customer.metadata.get('user_id')
        
        if user_id:
            payment = PaymentHistory(
                user_id=int(user_id),
                stripe_payment_intent_id=invoice.payment_intent,
                amount=invoice.amount_due / 100,
                status='failed',
                plan_type='monthly' if 'monthly' in subscription.items.data[0].price.id.lower() else 'yearly'
            )
            db.add(payment)
            db.commit()

@app.get("/user-subscription")
async def get_user_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription status"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == 'active'
    ).first()
    
    if subscription:
        return {
            "has_subscription": True,
            "plan_type": subscription.plan_type,
            "status": subscription.status,
            "current_period_end": subscription.current_period_end,
            "amount": subscription.amount
        }
    else:
        return {"has_subscription": False}

# ==================== ROLE-BASED ENDPOINTS ====================

@app.post("/admin/add-employee")
async def add_employee(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add a new employee to the current admin (1:1 relationship)"""
    try:
        # Check if admin already has an employee
        existing_employee = db.query(User).filter(
            User.admin_id == current_admin.id,
            User.role == "employee"
        ).first()
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an employee. Each admin can only have one employee."
            )
        
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
        
        # Create new employee
        hashed_password = get_password_hash(password)
        new_employee = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="employee",
            admin_id=current_admin.id  # Assign to current admin
        )
        
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)
        
        return {"message": f"Employee {username} added successfully to your team"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding employee: {str(e)}"
        )

@app.get("/admin/get-employees")
async def get_employees(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get the employee managed by the current admin (1:1 relationship)"""
    try:
        employee = db.query(User).filter(
            User.role == "employee",
            User.admin_id == current_admin.id
        ).first()
        
        if employee:
            return [{
                "id": employee.id,
                "username": employee.username,
                "email": employee.email,
                "role": employee.role,
                "is_active": employee.is_active,
                "created_at": employee.created_at,
                "admin_id": employee.admin_id
            }]
        else:
            return []  # No employee assigned
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching employee: {str(e)}"
        )

@app.post("/admin/toggle-employee-status")
async def toggle_employee_status(
    employee_id: int = Body(...),
    is_active: bool = Body(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Toggle employee active status (only for employees managed by current admin)"""
    try:
        # Find employee and verify they belong to current admin
        employee = db.query(User).filter(
            User.id == employee_id,
            User.role == "employee",
            User.admin_id == current_admin.id
        ).first()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found or not managed by you"
            )
        
        employee.is_active = is_active
        db.commit()
        
        return {"message": f"Employee {employee.username} status updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating employee status: {str(e)}"
        )

@app.get("/admin/all-optimizations")
async def get_all_optimizations(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get optimizations from the employee managed by the current admin (1:1 relationship)"""
    try:
        # Get the employee managed by this admin
        employee = db.query(User).filter(
            User.role == "employee",
            User.admin_id == current_admin.id
        ).first()
        
        if not employee:
            return []  # No employee, no optimizations
        
        # Get optimizations from this employee
        optimizations = db.query(Optimization).filter(
            Optimization.user_id == employee.id
        ).all()
        
        result = []
        for opt in optimizations:
            result.append({
                "id": opt.id,
                "employee_name": employee.username,
                "employee_email": employee.email,
                "company_name": opt.company_name,
                "location": opt.location,
                "job_description": opt.job_description,
                "resume_pdf_path": opt.resume_pdf_path,
                "status": opt.status,
                "created_at": opt.created_at,
                "updated_at": opt.updated_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching optimizations: {str(e)}"
        )

@app.post("/admin/save-config")
async def save_admin_config(
    openai_api_key: str = Form(None),
    anthropic_api_key: str = Form(None),
    deepseek_api_key: str = Form(None),
    default_model: str = Form("gpt-4"),
    default_prompt: str = Form(None),
    notification_email: str = Form(None),
    sendgrid_api_key: str = Form(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Save admin configuration (each admin has their own config)"""
    try:
        # Check if config exists for this admin
        config = db.query(AdminConfig).filter(AdminConfig.admin_id == current_admin.id).first()
        
        if config:
            # Update existing config
            if openai_api_key is not None:
                config.openai_api_key = openai_api_key
            if anthropic_api_key is not None:
                config.anthropic_api_key = anthropic_api_key
            if deepseek_api_key is not None:
                config.deepseek_api_key = deepseek_api_key
            if default_model is not None:
                config.default_model = default_model
            if default_prompt is not None:
                config.default_prompt = default_prompt
            if notification_email is not None:
                config.notification_email = notification_email
            if sendgrid_api_key is not None:
                config.sendgrid_api_key = sendgrid_api_key
            config.updated_at = datetime.utcnow()
        else:
            # Create new config
            config = AdminConfig(
                admin_id=current_admin.id,
                openai_api_key=openai_api_key,
                anthropic_api_key=anthropic_api_key,
                deepseek_api_key=deepseek_api_key,
                default_model=default_model,
                default_prompt=default_prompt,
                notification_email=notification_email,
                sendgrid_api_key=sendgrid_api_key
            )
            db.add(config)
        
        db.commit()
        return {"message": "Configuration saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving configuration: {str(e)}"
        )

@app.get("/admin/get-config")
async def get_admin_config(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin configuration for the current admin"""
    try:
        config = db.query(AdminConfig).filter(AdminConfig.admin_id == current_admin.id).first()
        
        if not config:
            return {"message": "No configuration found for this admin"}
        
        return {
            "openai_api_key": config.openai_api_key,
            "anthropic_api_key": config.anthropic_api_key,
            "deepseek_api_key": config.deepseek_api_key,
            "default_model": config.default_model,
            "default_prompt": config.default_prompt,
            "notification_email": config.notification_email,
            "sendgrid_api_key": config.sendgrid_api_key,
            "created_at": config.created_at,
            "updated_at": config.updated_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching configuration: {str(e)}"
        )

@app.post("/employee/upload-job")
async def employee_upload_job(
    job_description: str = Form(...),
    company_name: str = Form(...),
    location: str = Form(None),
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Employee uploads job description for resume optimization"""
    logger.info(f"Employee {current_user.username} uploading job for {company_name}")
    
    try:
        # Get admin configuration for this employee's admin
        admin_config = db.query(AdminConfig).filter(
            AdminConfig.admin_id == current_user.admin_id
        ).first()
        
        if not admin_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No admin configuration found. Please contact your administrator."
            )
        
        # Create optimization record
        optimization = Optimization(
            user_id=current_user.id,
            company_name=company_name,
            location=location or "",
            job_description=job_description,
            llm_provider="openai",  # Default to OpenAI
            model_name=admin_config.default_model,
            status="pending"
        )
        db.add(optimization)
        db.commit()
        
        # Process the optimization
        try:
            # Get the master resume - employees should use their admin's master resume
            master_resume_content = None
            
            if current_user.role == "admin":
                # Admin uses their own master resume
                master_resume_content = current_user.master_resume_latex
                logger.info(f"Admin {current_user.username} using own master resume")
            elif current_user.role == "employee" and current_user.admin_id:
                # Employee uses their admin's master resume
                admin_user = db.query(User).filter(User.id == current_user.admin_id).first()
                if admin_user:
                    master_resume_content = admin_user.master_resume_latex
                    logger.info(f"Employee {current_user.username} using admin {admin_user.username}'s master resume")
                else:
                    logger.error(f"Admin not found for employee {current_user.username}")
            
            if not master_resume_content:
                logger.info(f"Master resume not found in database for user {current_user.username}, checking memory")
                # Fallback to memory storage - check both user and admin
                user_id_to_check = current_user.admin_id if current_user.role == "employee" else current_user.id
                master_resume = master_resumes.get(user_id_to_check)
                if not master_resume:
                    logger.error(f"Master resume not found in memory either for user {current_user.username}")
                    if current_user.role == "employee":
                        admin_user = db.query(User).filter(User.id == current_user.admin_id).first()
                        admin_name = admin_user.username if admin_user else "your admin"
                        raise HTTPException(status_code=400, detail=f"Master resume not uploaded by admin {admin_name}. Please ask {admin_name} to upload the master resume first.")
                    else:
                        raise HTTPException(status_code=400, detail="Master resume not uploaded. Please upload your master resume first.")
                master_resume_content = master_resume['latex_content']
                logger.info(f"Using master resume from memory for user {current_user.username}")
            else:
                logger.info(f"Using master resume from database for user {current_user.username}, content length: {len(master_resume_content)}")
            
            # Get LLM handler
            logger.info(f"Creating LLM handler for anthropic with model: {admin_config.default_model}")
            llm_handler = get_llm_handler("anthropic", admin_config.anthropic_api_key, admin_config.default_model)
            
            # Create prompt using admin's default prompt
            prompt = admin_config.default_prompt.format(
                job_description=job_description,
                company_name=company_name
            )
            logger.info(f"Created prompt for optimization: {len(prompt)} characters")
            logger.info(f"Job description length: {len(job_description)} characters")
            logger.info(f"Master resume content length: {len(master_resume_content)} characters")
            
            # Optimize resume
            logger.info(f"Calling LLM optimize_resume for user {current_user.username}")
            llm_response = llm_handler.optimize_resume(
                prompt, 
                job_description,
                master_resume_content
            )
            logger.info(f"LLM optimization completed, response type: {type(llm_response)}")
            
            # Extract the content from LLMResponse
            optimized_latex = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
            logger.info(f"Optimized LaTeX content length: {len(optimized_latex) if optimized_latex else 0} characters")
            
            # Debug LLM response details
            if hasattr(llm_response, 'success'):
                logger.info(f"LLM Response success: {llm_response.success}")
            if hasattr(llm_response, 'cost_usd'):
                logger.info(f"LLM Response cost: ${llm_response.cost_usd:.4f}")
            if hasattr(llm_response, 'error_message'):
                logger.info(f"LLM Response error: {llm_response.error_message}")
            
            # Check if we got valid content
            if not optimized_latex or len(optimized_latex.strip()) == 0:
                logger.error("LLM returned empty content!")
                logger.error(f"Raw LLM response: {llm_response}")
                raise HTTPException(status_code=500, detail="LLM returned empty response. Check API key and model configuration.")
                
            logger.info(f"LaTeX content preview: {optimized_latex[:200]}...")
            
            # Compile to PDF
            temp_dir = os.path.join(STORAGE_DIR, str(current_user.id))
            os.makedirs(temp_dir, exist_ok=True)
            logger.info(f"Created/verified temp directory: {temp_dir}")
            logger.info(f"Temp directory exists: {os.path.exists(temp_dir)}")
            
            pdf_filename = f"resume_{company_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = os.path.join(temp_dir, pdf_filename)
            
            # Compile LaTeX to PDF
            latex_content = optimized_latex
            temp_latex_file = os.path.join(temp_dir, "temp_resume.tex")
            
            logger.info(f"Writing LaTeX content to: {temp_latex_file}")
            logger.info(f"LaTeX content preview: {latex_content[:500]}...")
            
            with open(temp_latex_file, 'w', encoding='utf-8') as f:
                f.write(latex_content)
                
            logger.info(f"LaTeX file written, size: {os.path.getsize(temp_latex_file)} bytes")
            logger.info(f"LaTeX file exists: {os.path.exists(temp_latex_file)}")
            logger.info(f"Working directory: {os.getcwd()}")
            logger.info(f"Absolute temp dir: {os.path.abspath(temp_dir)}")
            logger.info(f"Absolute LaTeX file: {os.path.abspath(temp_latex_file)}")
            
            # Try Tectonic first, fallback to pdflatex
            compilation_success = False
            
            # Try Tectonic
            try:
                logger.info("Attempting LaTeX compilation with Tectonic")
                abs_temp_dir = os.path.abspath(temp_dir)
                abs_latex_file = os.path.abspath(temp_latex_file)
                
                cmd = ["tectonic", "--outdir", abs_temp_dir, abs_latex_file]
                logger.info(f"Tectonic command: {' '.join(cmd)}")
                logger.info(f"Working directory: {abs_temp_dir}")
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=abs_temp_dir
                )
                
                if result.returncode == 0:
                    compilation_success = True
                    logger.info("LaTeX compilation successful with Tectonic")
                else:
                    logger.warning(f"Tectonic compilation failed: {result.stderr}")
                    
            except FileNotFoundError:
                logger.warning("Tectonic not found, trying pdflatex")
            except Exception as e:
                logger.warning(f"Tectonic error: {e}")
            
            # Fallback to pdflatex if Tectonic failed
            if not compilation_success:
                try:
                    logger.info("Attempting LaTeX compilation with pdflatex")
                    abs_temp_dir = os.path.abspath(temp_dir)
                    abs_latex_file = os.path.abspath(temp_latex_file)
                    
                    cmd = ["pdflatex", "-output-directory", abs_temp_dir, abs_latex_file]
                    logger.info(f"pdflatex command: {' '.join(cmd)}")
                    logger.info(f"Working directory: {abs_temp_dir}")
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        cwd=abs_temp_dir
                    )
                    
                    if result.returncode == 0:
                        compilation_success = True
                        logger.info("LaTeX compilation successful with pdflatex")
                    else:
                        logger.error(f"pdflatex compilation failed with return code: {result.returncode}")
                        logger.error(f"pdflatex stderr: {result.stderr}")
                        logger.error(f"pdflatex stdout: {result.stdout}")
                        
                        # Check if PDF was actually created despite errors
                        expected_pdf = temp_latex_file.replace('.tex', '.pdf')
                        if os.path.exists(expected_pdf):
                            logger.info("PDF was created despite pdflatex warnings - continuing")
                            compilation_success = True
                        
                except FileNotFoundError:
                    logger.error("Neither Tectonic nor pdflatex found!")
                except Exception as e:
                    logger.error(f"pdflatex error: {e}")
            
            if not compilation_success:
                logger.warning("PDF compilation failed - returning LaTeX content without PDF")
                # Still mark as completed but without PDF
                optimization.status = "completed_no_pdf"
                optimization.total_cost = llm_response.cost_usd if hasattr(llm_response, 'cost_usd') else 0.0
                optimization.cached_template = llm_response.cached_template if hasattr(llm_response, 'cached_template') else False
                db.commit()
                
                # Return success with LaTeX content instead of failing completely
                logger.info(f"Optimization completed without PDF - Cost: ${optimization.total_cost:.4f}")
                return {
                    "message": "Job uploaded and resume optimized successfully (LaTeX only - PDF compilation unavailable)",
                    "optimization_id": optimization.id,
                    "latex_content": optimized_latex,
                    "note": "PDF compilation failed, but optimized LaTeX is available"
                }
            
            # Check what PDF file was actually created and rename it
            actual_pdf = os.path.join(temp_dir, "temp_resume.pdf")
            if os.path.exists(actual_pdf):
                # Rename to the expected filename
                import shutil
                shutil.move(actual_pdf, pdf_path)
                logger.info(f"Renamed PDF from {actual_pdf} to {pdf_path}")
            else:
                logger.error(f"Expected PDF not found at {actual_pdf}")
                # Check what files exist
                import glob
                files = glob.glob(os.path.join(temp_dir, "*.pdf"))
                logger.error(f"PDF files in directory: {files}")
            
            # Update optimization record with PDF path and cost
            optimization.resume_pdf_path = pdf_path
            optimization.status = "completed"
            optimization.total_cost = llm_response.cost_usd if hasattr(llm_response, 'cost_usd') else 0.0
            optimization.cached_template = llm_response.cached_template if hasattr(llm_response, 'cached_template') else False
            db.commit()
            
            logger.info(f"Optimization completed - Cost: ${optimization.total_cost:.4f}, Cached: {optimization.cached_template}")
            
            # Send email to admin (optional - only if SendGrid is configured)
            email_sent = False
            if admin_config.sendgrid_api_key and admin_config.notification_email:
                logger.info("Sending email notification to admin")
                email_service = create_email_service(admin_config.sendgrid_api_key)
                if email_service:
                    email_sent = email_service.send_resume_email(
                        to_email=admin_config.notification_email,
                        from_email="noreply@resumeoptimizer.com",
                        company_name=company_name,
                        job_description=job_description,
                        pdf_path=pdf_path,
                        employee_name=current_user.username
                    )
                    if email_sent:
                        logger.info(f"Email sent successfully for optimization {optimization.id}")
                    else:
                        logger.warning(f"Failed to send email for optimization {optimization.id}")
            else:
                logger.info("Email notification skipped - SendGrid not configured")
            
            logger.info(f"Resume optimization completed successfully for {current_user.username}")
            return {
                "message": "Job uploaded and resume optimized successfully",
                "optimization_id": optimization.id,
                "pdf_filename": pdf_filename,
                "download_available": True,
                "email_sent": email_sent
            }
            
        except Exception as e:
            logger.error(f"Error processing optimization: {e}")
            optimization.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to process optimization: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading job: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload job")

@app.get("/employee/my-optimizations")
async def employee_get_optimizations(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Get employee's optimization history"""
    logger.info(f"Employee {current_user.username} fetching optimizations")
    
    try:
        optimizations = db.query(Optimization).filter(
            Optimization.user_id == current_user.id
        ).order_by(Optimization.created_at.desc()).all()
        
        logger.info(f"Found {len(optimizations)} optimizations for user {current_user.username}")
        for opt in optimizations:
            logger.info(f"Optimization {opt.id}: {opt.company_name} - {opt.status}")
        
        result = [
            {
                "id": opt.id,
                "company_name": opt.company_name,
                "location": opt.location,
                "job_description": opt.job_description,
                "status": opt.status,
                "created_at": opt.created_at,
                "has_pdf": opt.resume_pdf_path and os.path.exists(opt.resume_pdf_path) if opt.resume_pdf_path else False
            }
            for opt in optimizations
        ]
        
        logger.info(f"Returning {len(result)} optimizations to frontend")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching employee optimizations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch optimizations")

@app.get("/employee/download-resume/{optimization_id}")
async def employee_download_resume(
    optimization_id: int,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Download generated resume PDF for employee"""
    logger.info(f"Employee {current_user.username} downloading resume for optimization {optimization_id}")
    
    try:
        # Get the optimization record
        optimization = db.query(Optimization).filter(
            Optimization.id == optimization_id,
            Optimization.user_id == current_user.id
        ).first()
        
        if not optimization:
            raise HTTPException(status_code=404, detail="Optimization not found or not authorized")
        
        # Check if PDF exists
        logger.info(f"Download request for optimization {optimization_id}")
        logger.info(f"PDF path in database: {optimization.resume_pdf_path}")
        logger.info(f"PDF file exists: {os.path.exists(optimization.resume_pdf_path) if optimization.resume_pdf_path else False}")
        logger.info(f"Optimization status: {optimization.status}")
        
        if not optimization.resume_pdf_path:
            raise HTTPException(status_code=404, detail="Resume PDF path not set - compilation may have failed")
        
        if not os.path.exists(optimization.resume_pdf_path):
            # List files in the directory to help debug
            import glob
            dir_path = os.path.dirname(optimization.resume_pdf_path)
            if os.path.exists(dir_path):
                files = glob.glob(os.path.join(dir_path, "*"))
                logger.info(f"Files in directory {dir_path}: {files}")
            raise HTTPException(status_code=404, detail=f"Resume PDF file not found at: {optimization.resume_pdf_path}")
        
        # Determine filename for download
        safe_company_name = "".join(c for c in optimization.company_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"resume_{safe_company_name}_{optimization.created_at.strftime('%Y%m%d')}.pdf"
        
        logger.info(f"Serving PDF: {optimization.resume_pdf_path}")
        return FileResponse(
            path=optimization.resume_pdf_path,
            filename=filename,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to download resume")

@app.get("/admin/all-optimizations")
async def admin_get_all_optimizations(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all optimizations for admin review"""
    logger.info(f"Admin {current_user.username} fetching all optimizations")
    
    try:
        optimizations = db.query(Optimization).join(User).order_by(Optimization.created_at.desc()).all()
        
        return [
            {
                "id": opt.id,
                "employee_name": opt.user.username,
                "employee_email": opt.user.email,
                "company_name": opt.company_name,
                "location": opt.location,
                "job_description": opt.job_description,
                "status": opt.status,
                "resume_pdf_path": opt.resume_pdf_path,
                "created_at": opt.created_at
            }
            for opt in optimizations
        ]
        
    except Exception as e:
        logger.error(f"Error fetching all optimizations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch optimizations")





@app.get("/payments", response_class=HTMLResponse)
async def payments_page():
    """Serve the payments page"""
    return FileResponse('payments.html')

@app.get("/home", response_class=HTMLResponse)
async def home_page():
    """Serve the landing page."""
    logger.info("Serving home landing page")
    try:
        with open("home.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("home.html file not found")
        return HTMLResponse(content="<h1>Landing page not found. Please ensure home.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving home page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve home page")

@app.get("/app", response_class=HTMLResponse)
async def app_page():
    """Serve the main application page."""
    logger.info("Serving main application page")
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("index.html file not found")
        return HTMLResponse(content="<h1>Application file not found. Please ensure index.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving application page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve application page")

@app.get("/admin", response_class=HTMLResponse)
async def admin_page():
    """Serve the admin dashboard page."""
    logger.info("Serving admin dashboard page")
    try:
        with open("admin.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("admin.html file not found")
        return HTMLResponse(content="<h1>Admin dashboard not found. Please ensure admin.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving admin page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve admin page")

@app.get("/admin/api-usage")
async def get_admin_api_usage(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get API usage statistics for the current admin"""
    logger.info(f"Fetching API usage statistics for admin: {current_admin.username}")
    
    try:
        # Query all API usage records for this admin with related optimization data
        usage_records = db.query(APIUsage).filter(
            APIUsage.admin_id == current_admin.id
        ).order_by(APIUsage.created_at.desc()).all()
        
        if not usage_records:
            logger.info(f"No API usage records found for admin: {current_admin.username}")
            return {
                "total_requests": 0,
                "total_cost": 0.0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_tokens": 0,
                "cached_requests": 0,
                "successful_requests": 0,
                "recent_usage": []
            }
        
        # Calculate totals
        total_requests = len(usage_records)
        total_cost = sum(record.cost_usd for record in usage_records)
        total_input_tokens = sum(record.input_tokens for record in usage_records)
        total_output_tokens = sum(record.output_tokens for record in usage_records)
        total_tokens = sum(record.total_tokens for record in usage_records)
        cached_requests = sum(1 for record in usage_records if record.cached_template)
        successful_requests = sum(1 for record in usage_records if record.success)
        
        # Get recent usage (last 10 records)
        recent_usage = []
        for record in usage_records[:10]:
            # Get employee information through optimization if available
            employee_username = "N/A"
            if record.optimization_id:
                optimization = db.query(Optimization).filter(Optimization.id == record.optimization_id).first()
                if optimization:
                    employee = db.query(User).filter(User.id == optimization.user_id).first()
                    if employee:
                        employee_username = employee.username
            
            recent_usage.append({
                "id": record.id,
                "provider": record.provider,
                "model": record.model_name,
                "cost": record.cost_usd,
                "input_tokens": record.input_tokens,
                "output_tokens": record.output_tokens,
                "total_tokens": record.total_tokens,
                "cached": record.cached_template,
                "success": record.success,
                "response_time_ms": record.response_time_ms,
                "created_at": record.created_at,
                "employee_username": employee_username,
                "error_message": record.error_message if not record.success else None
            })
        
        logger.info(f"API usage statistics retrieved for admin {current_admin.username}: {total_requests} requests, ${total_cost:.4f} total cost")
        
        return {
            "total_requests": total_requests,
            "total_cost": round(total_cost, 4),
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "total_tokens": total_tokens,
            "cached_requests": cached_requests,
            "successful_requests": successful_requests,
            "cache_rate": round((cached_requests / total_requests * 100), 2) if total_requests > 0 else 0,
            "success_rate": round((successful_requests / total_requests * 100), 2) if total_requests > 0 else 0,
            "recent_usage": recent_usage
        }
        
    except Exception as e:
        logger.error(f"Error fetching API usage statistics for admin {current_admin.username}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch API usage statistics: {str(e)}"
        )

@app.get("/admin/cost-chart")
async def get_admin_cost_chart(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get daily cost data for chart visualization for the current admin"""
    logger.info(f"Fetching cost chart data for admin: {current_admin.username}")
    
    try:
        from sqlalchemy import func, cast, Date
        from datetime import datetime, timedelta
        
        # Get data for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Query daily costs grouped by date
        daily_costs = db.query(
            cast(APIUsage.created_at, Date).label('date'),
            func.sum(APIUsage.cost_usd).label('total_cost'),
            func.count(APIUsage.id).label('request_count'),
            func.sum(APIUsage.input_tokens).label('total_input_tokens'),
            func.sum(APIUsage.output_tokens).label('total_output_tokens'),
            func.sum(APIUsage.total_tokens).label('total_tokens'),
            func.sum(func.case([(APIUsage.cached_template == True, 1)], else_=0)).label('cached_count'),
            func.sum(func.case([(APIUsage.success == True, 1)], else_=0)).label('successful_count'),
            func.avg(APIUsage.response_time_ms).label('avg_response_time')
        ).filter(
            APIUsage.admin_id == current_admin.id,
            APIUsage.created_at >= thirty_days_ago
        ).group_by(
            cast(APIUsage.created_at, Date)
        ).order_by(
            cast(APIUsage.created_at, Date)
        ).all()
        
        # Format data for chart
        chart_data = []
        for record in daily_costs:
            chart_data.append({
                "date": record.date.strftime("%Y-%m-%d"),
                "cost": round(float(record.total_cost), 4),
                "requests": record.request_count,
                "input_tokens": record.total_input_tokens,
                "output_tokens": record.total_output_tokens,
                "total_tokens": record.total_tokens,
                "cached_requests": record.cached_count,
                "successful_requests": record.successful_count,
                "avg_response_time": round(float(record.avg_response_time), 2) if record.avg_response_time else 0
            })
        
        # Fill in missing dates with zero values for the last 30 days
        complete_data = []
        current_date = thirty_days_ago.date()
        end_date = datetime.utcnow().date()
        data_dict = {item["date"]: item for item in chart_data}
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            if date_str in data_dict:
                complete_data.append(data_dict[date_str])
            else:
                complete_data.append({
                    "date": date_str,
                    "cost": 0.0,
                    "requests": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "cached_requests": 0,
                    "successful_requests": 0,
                    "avg_response_time": 0
                })
            current_date += timedelta(days=1)
        
        chart_data = complete_data
        
        logger.info(f"Cost chart data retrieved for admin {current_admin.username}: {len(chart_data)} data points")
        
        return {
            "chart_data": chart_data,
            "period_days": 30,
            "total_days_with_usage": len([d for d in chart_data if d["cost"] > 0]),
            "date_range": {
                "start": thirty_days_ago.strftime("%Y-%m-%d"),
                "end": datetime.utcnow().strftime("%Y-%m-%d")
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching cost chart data for admin {current_admin.username}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch cost chart data: {str(e)}"
        )

@app.get("/master", response_class=HTMLResponse)
async def master_page():
    """Serve the master dashboard page."""
    logger.info("Serving master dashboard page")
    try:
        with open("master.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("master.html file not found")
        return HTMLResponse(content="<h1>Master dashboard not found. Please ensure master.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving master page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve master page")

@app.post("/master/create-admin")
async def create_admin(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    current_user: User = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Create new admin account (masters only)"""
    logger.info(f"Master {current_user.username} creating admin: {username}")
    
    try:
        # Input validation
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if '@' not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing_user:
            logger.warning(f"Admin creation failed - user already exists: {username}")
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        # Create new admin
        hashed_password = get_password_hash(password)
        new_admin = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="admin",
            master_id=current_user.id,  # Track who created this admin
            has_access=True  # Masters grant immediate access to admins
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        logger.info(f"Admin {username} created successfully by master {current_user.username}")
        return {"message": f"Admin {username} created successfully", "admin_id": new_admin.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create admin")

@app.post("/master/create-employee")
async def create_employee(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    admin_id: int = Form(...),
    current_user: User = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Create new employee and assign to admin (masters only)"""
    logger.info(f"Master {current_user.username} creating employee: {username} for admin_id: {admin_id}")
    
    try:
        # Input validation
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if '@' not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Verify the admin exists and is created by this master
        admin = db.query(User).filter(
            User.id == admin_id,
            User.role == "admin",
            User.master_id == current_user.id
        ).first()
        if not admin:
            raise HTTPException(
                status_code=400,
                detail="Invalid admin ID or admin not created by you"
            )
        
        # Check if admin already has an employee (1:1 relationship)
        existing_employee = db.query(User).filter(
            User.admin_id == admin_id,
            User.role == "employee"
        ).first()
        if existing_employee:
            raise HTTPException(
                status_code=400,
                detail=f"Admin {admin.username} already has an employee. Each admin can only have one employee."
            )
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing_user:
            logger.warning(f"Employee creation failed - user already exists: {username}")
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        # Create new employee
        hashed_password = get_password_hash(password)
        new_employee = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="employee",
            master_id=current_user.id,  # Track who created this employee
            admin_id=admin_id,  # Assign to the specified admin
            has_access=True  # Masters grant immediate access to employees
        )
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)
        
        logger.info(f"Employee {username} created successfully by master {current_user.username} and assigned to admin {admin.username}")
        return {
            "message": f"Employee {username} created successfully and assigned to admin {admin.username}",
            "employee_id": new_employee.id,
            "admin_username": admin.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating employee: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create employee")

@app.get("/master/get-admins")
async def get_admins(
    current_user: User = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Get all admins created by this master"""
    logger.info(f"Master {current_user.username} fetching created admins")
    
    try:
        admins = db.query(User).filter(
            User.role == "admin",
            User.master_id == current_user.id
        ).order_by(User.created_at.desc()).all()
        
        result = []
        for admin in admins:
            # Get the employee count for each admin (should be 0 or 1)
            employee_count = db.query(User).filter(
                User.role == "employee",
                User.admin_id == admin.id
            ).count()
            
            result.append({
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "is_active": admin.is_active,
                "has_access": admin.has_access,
                "employee_count": employee_count,
                "created_at": admin.created_at
            })
        
        logger.info(f"Found {len(admins)} admins created by master {current_user.username}")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching admins: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admins")

@app.get("/master/get-all-users")
async def get_all_users(
    current_user: User = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Get all users created by this master (admins and employees)"""
    logger.info(f"Master {current_user.username} fetching all created users")
    
    try:
        # Get all users created by this master
        users = db.query(User).filter(
            User.master_id == current_user.id
        ).order_by(User.role, User.created_at.desc()).all()
        
        result = []
        for user in users:
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "has_access": user.has_access,
                "created_at": user.created_at
            }
            
            # Add admin info for employees
            if user.role == "employee" and user.admin_id:
                admin = db.query(User).filter(User.id == user.admin_id).first()
                if admin:
                    user_data["admin_username"] = admin.username
                    user_data["admin_id"] = admin.id
            
            result.append(user_data)
        
        logger.info(f"Found {len(users)} users created by master {current_user.username}")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching all users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@app.post("/master/grant-access")
async def grant_access(
    user_id: int = Form(...),
    grant_access: bool = Form(...),
    current_user: User = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Grant or revoke access to users created by this master"""
    logger.info(f"Master {current_user.username} {'granting' if grant_access else 'revoking'} access for user_id: {user_id}")
    
    try:
        # Find user and verify they were created by this master
        user = db.query(User).filter(
            User.id == user_id,
            User.master_id == current_user.id
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found or not created by you"
            )
        
        # Masters always have access, cannot be revoked
        if user.role == "master":
            raise HTTPException(
                status_code=400,
                detail="Cannot modify access for master users"
            )
        
        # Update access
        old_access = user.has_access
        user.has_access = grant_access
        db.commit()
        
        action = "granted" if grant_access else "revoked"
        logger.info(f"Access {action} for user {user.username} by master {current_user.username}")
        
        return {
            "message": f"Access {action} for user {user.username}",
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
            "old_access": old_access,
            "new_access": grant_access
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user access: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update user access")

@app.get("/employee", response_class=HTMLResponse)
async def employee_page():
    """Serve the employee dashboard page."""
    logger.info("Serving employee dashboard page")
    try:
        with open("employee.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("employee.html file not found")
        return HTMLResponse(content="<h1>Employee dashboard not found. Please ensure employee.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving employee page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve employee page")

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    """Serve the login page."""
    logger.info("Serving login page")
    try:
        with open("login.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("login.html file not found")
        return HTMLResponse(content="<h1>Login page not found. Please ensure login.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving login page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve login page")

@app.get("/user-info")
async def get_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/user/me")
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information with relationships"""
    user_data = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "has_access": current_user.has_access,
        "managing_admin": None
    }
    
    # If user is an employee, get their managing admin info
    if current_user.role == "employee" and current_user.admin_id:
        admin = db.query(User).filter(User.id == current_user.admin_id).first()
        if admin:
            user_data["managing_admin"] = {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email
            }
    
    return user_data

@app.get("/register", response_class=HTMLResponse)
async def register_page():
    """Serve the registration page."""
    logger.info("Serving registration page")
    try:
        with open("register.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        logger.error("register.html file not found")
        return HTMLResponse(content="<h1>Registration page not found. Please ensure register.html exists.</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving registration page: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve registration page")

@app.get("/logout")
async def logout():
    """Logout endpoint - redirects to login page"""
    logger.info("User logged out")
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Logging Out...</title>
        <script>
            // Clear all authentication data
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            
            // Redirect to login page
            window.location.href = '/login';
        </script>
    </head>
    <body>
        <p>Logging out...</p>
    </body>
    </html>
    """)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Redirect root to login page."""
    logger.info("Redirecting root to login page")
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/login")

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "resume-optimizer",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Debug environment variables
    print("=== DEPLOYMENT DEBUG INFO ===")
    print(f"PORT environment variable: '{os.environ.get('PORT', 'NOT_SET')}'")
    print(f"All environment variables with 'PORT': {[k for k in os.environ.keys() if 'PORT' in k.upper()]}")
    
    try:
        port = int(os.environ.get("PORT", 8000))
        print(f"Successfully parsed port: {port}")
    except ValueError as e:
        print(f"ERROR: Could not parse PORT as integer: {e}")
        print(f"PORT value: '{os.environ.get('PORT')}'")
        port = 8000
        print(f"Defaulting to port: {port}")
    
    print(f"Starting server on host: 0.0.0.0, port: {port}")
    print("=== END DEBUG INFO ===")
    
    uvicorn.run("main1:app", host="0.0.0.0", port=port)
