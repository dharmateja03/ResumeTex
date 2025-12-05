FROM python:3.9-slim

# Copy all prompt files to root
COPY latex_system_prompt.txt /latex_system_prompt.txt
COPY email_and_cover_letter_prompt.txt /email_and_cover_letter_prompt.txt
COPY cold_email_prompt.txt /cold_email_prompt.txt
COPY cover_letter_prompt.txt /cover_letter_prompt.txt

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

# Copy application (ensure all subdirectories are copied)
COPY backend/ .

# Verify database directory was copied and show full structure
RUN echo "=== /app directory ===" && ls -laR /app | head -100

# Set Python path to include /app
ENV PYTHONPATH=/app:$PYTHONPATH

# Create directories
RUN mkdir -p /tmp/resume_pdfs

# Expose port
EXPOSE 8001

# Start application
CMD ["python", "app.py"]