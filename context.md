# Resume Optimizer - System Context

## Overview
A stateless resume optimization system that uses LLM APIs to optimize LaTeX resumes for specific job descriptions, with caching for performance and analytics tracking.

## Architecture
```
Frontend (React) ↔ Backend (FastAPI) ↔ Cache (Redis/Memory) ↔ LLM APIs
                                    ↓
                              Analytics DB (SQLite)
```

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python
- **Caching**: Redis (with in-memory fallback)
- **Database**: SQLite (analytics only)
- **LLM Providers**: OpenAI, Anthropic, Google AI, Mistral

## Authentication
- **Production**: Google SSO required
- **Testing Phase**: No SSO - direct access

## Core Flow
1. **Authentication** → Google SSO login (bypassed in testing)
2. **LLM Configuration** → Test connection before saving (localStorage only)
3. **Resume Upload** → .tex file held in memory only
4. **Job Description** → Text input held in memory only
5. **Optimization** → LLM processing with caching
6. **Download** → Generated PDF served temporarily
7. **Analytics** → Track usage metrics only

## Data Storage Policy
### What we DON'T store:
- User .tex files
- API keys (localStorage only)
- Job descriptions
- Personal user data

### What we DO store:
- Optimization count per user
- Timestamps
- Usage analytics
- Cached optimization results (temporary)

## API Endpoints

### Authentication
```
POST /auth/google          # Google SSO login
POST /auth/logout         # Logout
GET  /auth/me            # Current user info
```

### LLM Configuration
```
GET  /llm/providers       # Available LLM providers
GET  /llm/models/{provider} # Models for provider
POST /llm/test-connection # Test API key BEFORE saving
POST /llm/save-config     # Save only after successful test
```

### Resume Optimization
```
POST /optimize           # Main endpoint
                        # Body: {tex_content, job_description, llm_config}
                        # Combines system prompt + job description
                        # Returns: {optimization_id, status}

GET  /optimize/{id}/status # Check status (async processing)
GET  /optimize/{id}/result # Get result
```

### File Operations
```
GET  /download/{optimization_id}  # Download PDF (temporary)
```

### Analytics
```
GET  /analytics/user-stats        # User optimization count/usage
GET  /analytics/recent            # Recent optimizations
```

### System Health
```
GET  /health             # API health
GET  /health/llm         # LLM services status  
GET  /health/cache       # Cache status
```

### Development (Testing Only)
```
POST /dev/bypass-auth    # Skip Google SSO
GET  /dev/clear-cache    # Clear cache
```

## LLM Processing
### Connection Testing Flow:
1. User enters API key
2. System tests connection with provider
3. Only save configuration if test succeeds
4. Keys stored in localStorage only

### Optimization Flow:
```
POST /optimize
├── Generate cache key: hash(job_description + tex_content + llm_model)
├── Check cache: return if exists
├── If not cached:
│   ├── Load system prompt (latex_system_prompt.txt)
│   ├── Combine: system_prompt + job_description
│   ├── Send to LLM: combined_prompt + tex_content
│   ├── Parse LLM response
│   ├── Generate PDF from optimized LaTeX
│   ├── Cache result (24h TTL)
│   └── Track analytics
└── Return: optimization_id for download
```

## Caching Strategy
- **Cache Key**: MD5 hash of (job_description + tex_content + llm_model)
- **TTL**: 24 hours for optimization results
- **Storage**: Redis primary, in-memory fallback
- **Benefits**: Faster responses, reduced LLM costs

## File Structure
```
backend/
├── app.py                    # FastAPI entry point
├── routes/
│   ├── auth.py              # Authentication endpoints
│   ├── llm.py               # LLM configuration & testing
│   ├── optimize.py          # Main optimization logic
│   ├── download.py          # PDF serving
│   └── analytics.py         # Usage tracking
├── services/
│   ├── llm_service.py       # LLM API integrations
│   ├── tex_parser.py        # LaTeX processing
│   ├── pdf_generator.py     # PDF compilation
│   ├── cache_service.py     # Redis/memory caching
│   └── optimizer.py         # Orchestration logic
├── models/
│   └── schemas.py           # Pydantic models
└── utils/
    └── helpers.py           # Utility functions

frontend/                     # From resumetx_frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx        # Google SSO
│   │   ├── Dashboard.tsx    # Main interface
│   │   ├── LLMSettings.tsx  # API key configuration
│   │   └── Optimize.tsx     # Upload & optimization
│   └── components/          # UI components
└── package.json             # React dependencies

prompts/
└── latex_system_prompt.txt  # LLM optimization instructions
```

## Key Features
1. **Stateless Design**: No persistent user data storage
2. **LLM Caching**: Intelligent caching to reduce API calls
3. **Connection Validation**: Test API keys before saving
4. **Prompt Engineering**: System + user prompts combined
5. **Analytics Tracking**: Usage metrics without storing sensitive data
6. **Temporary File Handling**: Generated PDFs cleaned up automatically
7. **Multi-Provider Support**: OpenAI, Anthropic, Google AI, Mistral
8. **Development Bypass**: SSO bypass for testing phase