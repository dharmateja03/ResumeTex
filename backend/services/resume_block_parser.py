"""
Resume Block Parser Service
Parses resume content into structured blocks (Experience, Education, Skills, etc.)
"""
import logging
import re
from typing import List, Dict, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ResumeBlock:
    """Represents a single resume block (e.g., one job, one degree, etc.)"""
    section: str  # 'experience', 'education', 'skills', etc.
    title: str  # Job title, degree name, skill category, etc.
    content: str  # Full block content
    block_index: int  # Index within section


class ResumeBlockParser:
    """Service for parsing resume content into blocks"""

    # Section patterns to identify resume sections
    SECTION_PATTERNS = {
        'experience': r'(?:experience|work\s+experience|professional\s+experience|employment)',
        'education': r'(?:education|academic|degree)',
        'skills': r'(?:skills|technical\s+skills|competencies|expertise)',
        'projects': r'(?:projects|portfolio|work)',
        'certifications': r'(?:certifications?|licenses?|awards?)',
        'summary': r'(?:summary|objective|professional\s+summary)',
        'languages': r'(?:languages?|linguistic)',
        'publications': r'(?:publications?|research)',
    }

    # Block separators within sections
    BLOCK_SEPARATORS = {
        'experience': r'(?:^|\n)(?=\d{4}|-|•|–|at\s+)',  # Job entries usually start with year or bullet
        'education': r'(?:^|\n)(?=[A-Z][a-z]+\s+(?:University|School|College|Institute))',
        'skills': r'(?:^|\n)(?=•|–|-)',  # Bullet points or dashes
        'projects': r'(?:^|\n)(?=•|–|-|[A-Z][a-z]+(?:\s+|:))',
        'certifications': r'(?:^|\n)(?=•|–|-|[A-Z])',
        'summary': None,  # No subdivision
        'languages': r'(?:^|\n)(?=•|–|-|[A-Z][a-z]+)',
        'publications': r'(?:^|\n)(?=•|–|-)',
    }

    def parse_resume(self, text: str) -> List[ResumeBlock]:
        """Parse resume text into blocks"""
        logger.info(f"📄 Parsing resume ({len(text)} characters)")

        blocks = []
        sections = self._extract_sections(text)

        for section_name, section_content in sections.items():
            section_blocks = self._parse_section(section_name, section_content)
            blocks.extend(section_blocks)

        logger.info(f"✅ Found {len(blocks)} blocks across {len(sections)} sections")
        return blocks

    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Extract major sections from resume text"""
        sections = {}

        # Normalize text
        text = text.strip()

        # Find all section headers and their positions
        section_positions = []
        for section_name, pattern in self.SECTION_PATTERNS.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE))
            for match in matches:
                section_positions.append((match.start(), match.end(), section_name, match.group()))

        # Sort by position
        section_positions.sort(key=lambda x: x[0])

        # Extract content between sections
        for i, (start, end, section_name, matched_text) in enumerate(section_positions):
            # Find where this section's content ends
            if i + 1 < len(section_positions):
                content_end = section_positions[i + 1][0]
            else:
                content_end = len(text)

            # Extract content after the section header
            content = text[end:content_end].strip()

            if content:
                sections[section_name] = content
                logger.info(f"📑 Found {section_name} section ({len(content)} chars)")

        return sections

    def _parse_section(self, section_name: str, section_content: str) -> List[ResumeBlock]:
        """Parse a section into individual blocks"""
        blocks = []

        separator = self.BLOCK_SEPARATORS.get(section_name)

        if separator is None:
            # No subdivision - treat entire section as one block
            title = self._extract_block_title(section_content, section_name)
            blocks.append(ResumeBlock(
                section=section_name,
                title=title,
                content=section_content,
                block_index=0
            ))
        else:
            # Split section into blocks
            block_contents = re.split(separator, section_content)
            block_contents = [b.strip() for b in block_contents if b.strip()]

            for idx, block_content in enumerate(block_contents):
                if len(block_content) > 10:  # Skip very short blocks
                    title = self._extract_block_title(block_content, section_name)
                    blocks.append(ResumeBlock(
                        section=section_name,
                        title=title,
                        content=block_content,
                        block_index=idx
                    ))

        logger.info(f"  └─ {section_name}: {len(blocks)} blocks")
        return blocks

    def _extract_block_title(self, block_content: str, section_name: str) -> str:
        """Extract a title/header from block content"""
        lines = block_content.split('\n')

        if not lines:
            return section_name.capitalize()

        # First non-empty line is usually the title
        for line in lines[:3]:
            line = line.strip()
            if line and len(line) < 100:  # Titles are usually short
                # Clean up common prefixes
                line = re.sub(r'^[•\-–]\s*', '', line)
                return line[:80]  # Limit title length

        return section_name.capitalize()


# Global instance
resume_block_parser = ResumeBlockParser()
