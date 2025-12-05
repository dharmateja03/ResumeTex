"""
LaTeX parser service for resume content processing
"""
import logging
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class LaTeXSection:
    """Represents a LaTeX section"""
    name: str
    content: str
    start_line: int
    end_line: int

@dataclass
class LaTeXParseResult:
    """Result of LaTeX parsing"""
    is_valid: bool
    sections: List[LaTeXSection]
    document_class: str
    packages: List[str]
    errors: List[str]
    warnings: List[str]

class LaTeXParser:
    """Service for parsing and validating LaTeX resume content"""
    
    def __init__(self):
        # Common resume sections to identify
        self.common_sections = [
            'experience', 'education', 'skills', 'projects', 'summary',
            'objective', 'achievements', 'certifications', 'publications',
            'awards', 'languages', 'interests', 'contact', 'personal'
        ]
        
        # Required LaTeX structure patterns
        self.required_patterns = {
            'document_class': r'\\documentclass\s*\[.*?\]\s*\{(.*?)\}',
            'begin_document': r'\\begin\s*\{document\}',
            'end_document': r'\\end\s*\{document\}',
            'packages': r'\\usepackage\s*(?:\[.*?\])?\s*\{(.*?)\}',
            'sections': r'\\(sub)?section\s*\{([^}]+)\}',
            'items': r'\\item\s+(.+?)(?=\\item|\\end|\n\s*\n|$)'
        }
    
    def parse_latex(self, tex_content: str) -> LaTeXParseResult:
        """Parse LaTeX content and extract structure"""
        logger.info(f"🔍 Parsing LaTeX content ({len(tex_content)} characters)")
        
        errors = []
        warnings = []
        
        # Validate basic structure
        validation_result = self._validate_structure(tex_content)
        errors.extend(validation_result['errors'])
        warnings.extend(validation_result['warnings'])
        
        # Extract document class
        document_class = self._extract_document_class(tex_content)
        logger.info(f"📄 Document class: {document_class}")
        
        # Extract packages
        packages = self._extract_packages(tex_content)
        logger.info(f"📦 Found {len(packages)} packages: {', '.join(packages[:5])}{'...' if len(packages) > 5 else ''}")
        
        # Extract sections
        sections = self._extract_sections(tex_content)
        logger.info(f"📑 Found {len(sections)} sections")
        
        # Check for common resume sections
        self._check_resume_sections(sections, warnings)
        
        is_valid = len(errors) == 0
        
        result = LaTeXParseResult(
            is_valid=is_valid,
            sections=sections,
            document_class=document_class,
            packages=packages,
            errors=errors,
            warnings=warnings
        )
        
        if is_valid:
            logger.info("✅ LaTeX content is valid")
        else:
            logger.warning(f"⚠️ LaTeX content has {len(errors)} errors")
            
        return result
    
    def clean_latex_content(self, tex_content: str) -> str:
        """Clean and normalize LaTeX content"""
        logger.info("🧹 Cleaning LaTeX content")

        # Strip markdown code fences (```latex, ```, etc.)
        tex_content = self._strip_markdown_fences(tex_content)

        # Remove excessive whitespace
        tex_content = re.sub(r'\n\s*\n\s*\n+', '\n\n', tex_content)

        # Normalize indentation
        tex_content = re.sub(r'^[ \t]+', '', tex_content, flags=re.MULTILINE)

        # Fix common LaTeX issues
        tex_content = self._fix_common_issues(tex_content)

        logger.info("✅ LaTeX content cleaned")
        return tex_content.strip()

    def _strip_markdown_fences(self, tex_content: str) -> str:
        """Remove markdown code fences from LLM responses"""
        logger.info("🔍 Checking for markdown code fences")

        # Pattern for markdown code fences
        # Matches: ```latex\n...\n``` or ```\n...\n```
        fence_pattern = r'^```(?:latex|tex)?\s*\n(.*?)\n```\s*$'

        match = re.match(fence_pattern, tex_content.strip(), re.DOTALL | re.MULTILINE)
        if match:
            logger.warning("⚠️ Found markdown code fences - stripping them")
            cleaned = match.group(1).strip()
            logger.info(f"✂️ Stripped fences: {len(tex_content)} → {len(cleaned)} chars")
            return cleaned

        # Also handle single backticks or incomplete fences
        if tex_content.strip().startswith('```'):
            logger.warning("⚠️ Content starts with ``` - attempting to clean")
            lines = tex_content.split('\n')
            # Remove first line if it's just ```
            if lines[0].strip().startswith('```'):
                lines = lines[1:]
            # Remove last line if it's just ```
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned = '\n'.join(lines).strip()
            logger.info(f"✂️ Cleaned incomplete fences: {len(tex_content)} → {len(cleaned)} chars")
            return cleaned

        logger.info("✓ No markdown fences found")
        return tex_content
    
    def extract_content_blocks(self, tex_content: str) -> Dict[str, str]:
        """Extract key content blocks for analysis"""
        logger.info("🔍 Extracting content blocks")
        
        blocks = {}
        
        # Extract text between common commands
        patterns = {
            'titles': r'\\title\s*\{([^}]+)\}',
            'names': r'\\name\s*\{([^}]+)\}',
            'emails': r'\\email\s*\{([^}]+)\}',
            'phones': r'\\phone\s*\{([^}]+)\}',
            'addresses': r'\\address\s*\{([^}]+)\}',
            'urls': r'\\url\s*\{([^}]+)\}',
            'hrefs': r'\\href\s*\{[^}]+\}\s*\{([^}]+)\}'
        }
        
        for block_name, pattern in patterns.items():
            matches = re.findall(pattern, tex_content, re.IGNORECASE | re.DOTALL)
            if matches:
                blocks[block_name] = matches
                logger.info(f"📌 Found {len(matches)} {block_name}")
        
        return blocks
    
    def validate_optimization_result(self, original_tex: str, optimized_tex: str) -> Dict[str, any]:
        """Validate that optimization preserved LaTeX structure"""
        logger.info("🔍 Validating optimization result")
        
        original_result = self.parse_latex(original_tex)
        optimized_result = self.parse_latex(optimized_tex)
        
        validation = {
            'is_valid': optimized_result.is_valid,
            'structure_preserved': True,
            'issues': [],
            'statistics': {
                'original_length': len(original_tex),
                'optimized_length': len(optimized_tex),
                'length_change': len(optimized_tex) - len(original_tex),
                'sections_original': len(original_result.sections),
                'sections_optimized': len(optimized_result.sections)
            }
        }
        
        # Check if document class changed
        if original_result.document_class != optimized_result.document_class:
            validation['issues'].append(f"Document class changed: {original_result.document_class} → {optimized_result.document_class}")
        
        # Check if major sections were removed
        original_section_names = {s.name.lower() for s in original_result.sections}
        optimized_section_names = {s.name.lower() for s in optimized_result.sections}
        
        removed_sections = original_section_names - optimized_section_names
        if removed_sections:
            validation['issues'].append(f"Sections removed: {', '.join(removed_sections)}")
            validation['structure_preserved'] = False
        
        # Check for compilation errors
        if optimized_result.errors:
            validation['issues'].extend([f"Compilation error: {error}" for error in optimized_result.errors])
            validation['structure_preserved'] = False
        
        logger.info(f"📊 Validation result: {'✅ Valid' if validation['is_valid'] else '❌ Invalid'}")
        return validation
    
    def _validate_structure(self, tex_content: str) -> Dict[str, List[str]]:
        """Validate basic LaTeX structure"""
        errors = []
        warnings = []
        
        # Check for required elements
        if not re.search(self.required_patterns['document_class'], tex_content):
            errors.append("Missing \\documentclass declaration")
        
        if not re.search(self.required_patterns['begin_document'], tex_content):
            errors.append("Missing \\begin{document}")
        
        if not re.search(self.required_patterns['end_document'], tex_content):
            errors.append("Missing \\end{document}")
        
        # Skip brace balance check - LaTeX compiler will handle this
        
        # Check for common issues
        if '\\maketitle' not in tex_content and '\\name' not in tex_content:
            warnings.append("No title or name command found")
        
        return {'errors': errors, 'warnings': warnings}
    
    def _extract_document_class(self, tex_content: str) -> str:
        """Extract document class"""
        match = re.search(self.required_patterns['document_class'], tex_content)
        return match.group(1) if match else 'unknown'
    
    def _extract_packages(self, tex_content: str) -> List[str]:
        """Extract used packages"""
        matches = re.findall(self.required_patterns['packages'], tex_content)
        packages = []
        for match in matches:
            # Handle multiple packages in one usepackage
            packages.extend([pkg.strip() for pkg in match.split(',')])
        return packages
    
    def _extract_sections(self, tex_content: str) -> List[LaTeXSection]:
        """Extract document sections"""
        sections = []
        lines = tex_content.split('\n')
        
        section_pattern = re.compile(r'\\(sub)?section\s*\{([^}]+)\}', re.IGNORECASE)
        
        current_section = None
        current_content = []
        
        for i, line in enumerate(lines):
            match = section_pattern.search(line)
            
            if match:
                # Save previous section
                if current_section:
                    sections.append(LaTeXSection(
                        name=current_section,
                        content='\n'.join(current_content),
                        start_line=current_start_line,
                        end_line=i-1
                    ))
                
                # Start new section
                current_section = match.group(2).strip()
                current_content = []
                current_start_line = i
            else:
                if current_section:
                    current_content.append(line)
        
        # Save last section
        if current_section:
            sections.append(LaTeXSection(
                name=current_section,
                content='\n'.join(current_content),
                start_line=current_start_line,
                end_line=len(lines)-1
            ))
        
        return sections
    
    def _check_resume_sections(self, sections: List[LaTeXSection], warnings: List[str]):
        """Check for common resume sections"""
        found_sections = {s.name.lower().strip() for s in sections}
        
        # Check for essential sections
        essential_sections = {'experience', 'education', 'skills'}
        missing_essential = essential_sections - found_sections
        
        if missing_essential:
            warnings.append(f"Missing essential sections: {', '.join(missing_essential)}")
        
        # Check for common sections
        common_found = sum(1 for section in self.common_sections if section in found_sections)
        if common_found < 3:
            warnings.append("Less than 3 common resume sections found")
    
    def _fix_common_issues(self, tex_content: str) -> str:
        """Fix common LaTeX issues"""
        
        # Fix spacing around commands
        tex_content = re.sub(r'\\([a-zA-Z]+)\s*\{', r'\\\1{', tex_content)
        
        # Fix multiple spaces
        tex_content = re.sub(r' +', ' ', tex_content)
        
        # Fix line endings
        tex_content = re.sub(r'\r\n', '\n', tex_content)
        
        return tex_content

# Global LaTeX parser instance
latex_parser = LaTeXParser()