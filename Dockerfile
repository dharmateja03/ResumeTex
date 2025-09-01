FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including LaTeX
RUN apt-get update && apt-get install -y \
    gcc g++ curl \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Create directories
RUN mkdir -p /tmp/resume_pdfs

# Expose port
EXPOSE 8001

# Start application
CMD ["python", "app.py"]