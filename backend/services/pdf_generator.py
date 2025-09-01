"""
PDF generator service for LaTeX compilation
"""
import logging
import os
import tempfile
import shutil
import subprocess
import asyncio
from typing import Dict, Optional, Tuple
from pathlib import Path
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class PDFGeneratorError(Exception):
    """Custom exception for PDF generation errors"""
    pass

class PDFGenerator:
    """Service for compiling LaTeX to PDF"""
    
    def __init__(self, output_dir: str = None):
        self.output_dir = Path(output_dir) if output_dir else Path(tempfile.gettempdir()) / "resume_pdfs"
        self.output_dir.mkdir(exist_ok=True, parents=True)
        
        # Supported LaTeX compilers (in order of preference)
        # XeLaTeX is preferred for better Unicode and font support
        self.compilers = ['xelatex', 'pdflatex', 'lualatex', 'tectonic']
        self.selected_compiler = None
        
        # Compilation settings
        self.max_compile_time = 30  # seconds
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        
        logger.info(f"📁 PDF output directory: {self.output_dir}")
    
    async def initialize(self) -> bool:
        """Initialize PDF generator and find available compiler"""
        logger.info("🔧 Initializing PDF generator...")
        
        for compiler in self.compilers:
            if await self._check_compiler_available(compiler):
                self.selected_compiler = compiler
                logger.info(f"✅ Using LaTeX compiler: {compiler}")
                return True
        
        logger.error("❌ No LaTeX compiler found!")
        return False
    
    async def compile_latex_to_pdf(self, tex_content: str, optimization_id: str, 
                                 company_name: str = "resume") -> Dict[str, any]:
        """Compile LaTeX content to PDF"""
        if not self.selected_compiler:
            logger.info("🔧 PDF generator not initialized, initializing now...")
            if not await self.initialize():
                raise PDFGeneratorError("No LaTeX compiler available")
        
        logger.info(f"🔨 Compiling LaTeX to PDF (ID: {optimization_id})")
        logger.info(f"📄 Input LaTeX: {len(tex_content)} characters")
        
        # Create unique working directory
        work_dir = self.output_dir / f"compile_{optimization_id}"
        work_dir.mkdir(exist_ok=True)
        
        try:
            # Generate safe filename
            safe_company_name = self._sanitize_filename(company_name)
            tex_filename = f"{safe_company_name}_resume.tex"
            pdf_filename = f"{safe_company_name}_resume.pdf"
            
            tex_path = work_dir / tex_filename
            pdf_path = work_dir / pdf_filename
            
            # Write LaTeX content to file  
            logger.info(f"💾 Writing LaTeX to: {tex_path}")
            
            # Prepare LaTeX content with glyphtounicode support for Tectonic
            enhanced_tex_content = self._prepare_tex_for_tectonic(tex_content)
            
            with open(tex_path, 'w', encoding='utf-8') as f:
                f.write(enhanced_tex_content)
                
            # Copy glyphtounicode.tex to working directory for Tectonic
            self._setup_tectonic_support_files(work_dir)
            
            # Compile with selected compiler
            start_time = datetime.now()
            compilation_result = await self._compile_with_compiler(
                tex_path, work_dir, self.selected_compiler, optimization_id
            )
            compile_time = (datetime.now() - start_time).total_seconds()
            
            # Check if PDF was generated
            if not pdf_path.exists():
                raise PDFGeneratorError("PDF file not generated")
            
            # Get file size
            pdf_size = pdf_path.stat().st_size
            logger.info(f"📊 PDF generated: {pdf_size} bytes in {compile_time:.2f}s")
            
            # Validate PDF size
            if pdf_size > self.max_file_size:
                raise PDFGeneratorError(f"PDF file too large: {pdf_size} bytes")
            
            if pdf_size < 1000:  # Less than 1KB probably means error
                raise PDFGeneratorError(f"PDF file suspiciously small: {pdf_size} bytes")
            
            # Move PDF to final location
            final_pdf_path = self.output_dir / pdf_filename
            shutil.move(str(pdf_path), str(final_pdf_path))
            
            logger.info(f"✅ PDF successfully generated: {final_pdf_path}")
            
            return {
                'success': True,
                'pdf_path': str(final_pdf_path),
                'pdf_filename': pdf_filename,
                'file_size': pdf_size,
                'compile_time_seconds': compile_time,
                'compiler_used': self.selected_compiler,
                'compilation_log': compilation_result.get('log', ''),
                'warnings': compilation_result.get('warnings', [])
            }
            
        except Exception as e:
            logger.error(f"❌ PDF compilation failed: {str(e)}")
            raise PDFGeneratorError(f"PDF compilation failed: {str(e)}")
        
        finally:
            # Cleanup working directory
            if work_dir.exists():
                try:
                    shutil.rmtree(work_dir)
                    logger.info(f"🧹 Cleaned up working directory: {work_dir}")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to cleanup {work_dir}: {str(e)}")
    
    async def _check_compiler_available(self, compiler: str) -> bool:
        """Check if compiler is available"""
        try:
            # Try common installation paths for MacTeX
            possible_paths = [
                compiler,  # Check PATH first
                f'/usr/local/texlive/2025/bin/universal-darwin/{compiler}',  # MacTeX 2025
                f'/usr/local/texlive/2024/bin/universal-darwin/{compiler}',  # MacTeX 2024
                f'/usr/local/texlive/2023/bin/universal-darwin/{compiler}',  # MacTeX 2023
                f'/Library/TeX/texbin/{compiler}',  # MacTeX symlinks
            ]
            
            for compiler_path in possible_paths:
                try:
                    process = await asyncio.create_subprocess_exec(
                        compiler_path, '--version',
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(), timeout=5.0
                    )
                    
                    if process.returncode == 0:
                        logger.info(f"✅ Found {compiler} at: {compiler_path}")
                        # Store the working path for later use
                        setattr(self, f'{compiler}_path', compiler_path)
                        return True
                        
                except (asyncio.TimeoutError, FileNotFoundError, Exception):
                    continue  # Try next path
            
            logger.info(f"❌ {compiler} not found in any location")
            return False
                
        except Exception as e:
            logger.info(f"❌ {compiler} check failed: {str(e)}")
            return False
    
    async def _compile_with_compiler(self, tex_path: Path, work_dir: Path, 
                                   compiler: str, optimization_id: str = None) -> Dict[str, any]:
        """Compile LaTeX file with specified compiler"""
        logger.info(f"🔄 Compiling with {compiler}...")
        
        if compiler == 'tectonic':
            return await self._compile_with_tectonic(tex_path, work_dir, optimization_id)
        else:
            return await self._compile_with_standard(tex_path, work_dir, compiler)
    
    async def _compile_with_tectonic(self, tex_path: Path, work_dir: Path, optimization_id: str = None) -> Dict[str, any]:
        """Compile with Tectonic (modern LaTeX engine)"""
        cmd = [
            'tectonic',
            '--outdir', str(work_dir),
            str(tex_path)
        ]
        
        logger.info(f"🚀 Running: {' '.join(cmd)}")
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=work_dir
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=self.max_compile_time
            )
            
            log = stdout.decode('utf-8', errors='ignore') + stderr.decode('utf-8', errors='ignore')
            logger.info(f"📝 Tectonic output:\n{log}")
            
            if process.returncode != 0:
                # Check for common Tectonic issues that might be recoverable
                if "glyphtounicode" in log or "Undefined control sequence" in log:
                    logger.warning(f"⚠️ Tectonic failed with compatibility issue: {log[:200]}...")
                    logger.info("💡 This is a known Tectonic issue with certain LaTeX packages")
                    
                    # Extract line number and context from error
                    import re
                    line_match = re.search(r'(\w+\.tex):(\d+):', log)
                    if line_match:
                        filename, line_num = line_match.groups()
                        logger.error(f"❌ Error in {filename} at line {line_num}")
                        
                        # Try to show the problematic line
                        try:
                            with open(tex_path, 'r', encoding='utf-8') as f:
                                lines = f.readlines()
                                if int(line_num) <= len(lines):
                                    problem_line = lines[int(line_num) - 1].strip()
                                    logger.error(f"🔍 Problem line {line_num}: {problem_line}")
                        except Exception as e:
                            logger.warning(f"⚠️ Could not read problematic line: {str(e)}")
                    
                    # Save the LaTeX file for debugging
                    debug_path = self.output_dir / f"debug_{optimization_id}.tex"
                    try:
                        shutil.copy2(tex_path, debug_path)
                        logger.info(f"🔍 Saved problematic LaTeX for debugging: {debug_path}")
                    except Exception as e:
                        logger.warning(f"⚠️ Could not save debug file: {str(e)}")
                    
                    raise PDFGeneratorError(f"Tectonic compilation failed due to package compatibility. Problem detected at line {line_match.group(2) if line_match else 'unknown'}. LaTeX saved for debugging at: {debug_path if 'debug_path' in locals() else 'unavailable'}. Error: {log}")
                
                raise PDFGeneratorError(f"Tectonic compilation failed (exit code: {process.returncode})\n{log}")
            
            return {
                'log': log,
                'warnings': self._extract_warnings(log),
                'success': True
            }
            
        except asyncio.TimeoutError:
            raise PDFGeneratorError(f"Compilation timed out after {self.max_compile_time}s")
    
    async def _compile_with_standard(self, tex_path: Path, work_dir: Path, 
                                   compiler: str) -> Dict[str, any]:
        """Compile with standard LaTeX compilers"""
        
        # Use stored compiler path if available, otherwise use compiler name
        compiler_path = getattr(self, f'{compiler}_path', compiler)
        
        cmd = [
            compiler_path,
            '-interaction=nonstopmode',
            '-halt-on-error',
            '-output-directory', str(work_dir),
            str(tex_path)
        ]
        
        logger.info(f"🚀 Running: {' '.join(cmd)}")
        
        try:
            # Run compilation (may need multiple passes)
            all_logs = []
            
            for pass_num in range(1, 3):  # Usually 2 passes are enough
                logger.info(f"📖 Compilation pass {pass_num}")
                
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=work_dir
                )
                
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=self.max_compile_time
                )
                
                log = stdout.decode('utf-8', errors='ignore') + stderr.decode('utf-8', errors='ignore')
                all_logs.append(f"=== Pass {pass_num} ===\n{log}")
                
                if process.returncode != 0:
                    raise PDFGeneratorError(f"{compiler} compilation failed (exit code: {process.returncode})\n{log}")
                
                # Check if PDF exists after first pass
                pdf_path = work_dir / tex_path.with_suffix('.pdf').name
                if pdf_path.exists():
                    break
            
            combined_log = '\n'.join(all_logs)
            logger.info(f"📝 {compiler} compilation completed")
            
            return {
                'log': combined_log,
                'warnings': self._extract_warnings(combined_log),
                'success': True
            }
            
        except asyncio.TimeoutError:
            raise PDFGeneratorError(f"Compilation timed out after {self.max_compile_time}s")
    
    def _extract_warnings(self, log: str) -> list:
        """Extract warnings from compilation log"""
        warnings = []
        
        # Common warning patterns
        warning_patterns = [
            r'Warning: (.+)',
            r'Package \w+ Warning: (.+)',
            r'LaTeX Warning: (.+)',
            r'Overfull \\hbox',
            r'Underfull \\hbox'
        ]
        
        for pattern in warning_patterns:
            import re
            matches = re.findall(pattern, log, re.MULTILINE)
            warnings.extend(matches)
        
        return warnings[:10]  # Limit to first 10 warnings
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe file system usage"""
        import re
        
        # Remove/replace unsafe characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'\s+', '_', filename)
        filename = filename.strip('._')
        
        # Limit length
        if len(filename) > 50:
            filename = filename[:50]
        
        # Ensure not empty
        if not filename:
            filename = 'resume'
        
        return filename
    
    async def cleanup_old_files(self, max_age_hours: int = 24):
        """Clean up old PDF files"""
        logger.info(f"🧹 Cleaning up PDF files older than {max_age_hours} hours")
        
        current_time = datetime.now()
        removed_count = 0
        
        try:
            for pdf_file in self.output_dir.glob("*.pdf"):
                file_age = current_time - datetime.fromtimestamp(pdf_file.stat().st_mtime)
                
                if file_age.total_seconds() > max_age_hours * 3600:
                    pdf_file.unlink()
                    removed_count += 1
                    logger.info(f"🗑️ Removed old PDF: {pdf_file.name}")
            
            logger.info(f"✅ Cleanup complete: {removed_count} files removed")
            
        except Exception as e:
            logger.error(f"❌ Cleanup error: {str(e)}")
    
    def get_pdf_info(self, pdf_path: str) -> Optional[Dict[str, any]]:
        """Get PDF file information"""
        path = Path(pdf_path)
        
        if not path.exists():
            return None
        
        stat = path.stat()
        return {
            'filename': path.name,
            'size_bytes': stat.st_size,
            'created_at': datetime.fromtimestamp(stat.st_ctime),
            'modified_at': datetime.fromtimestamp(stat.st_mtime),
            'exists': True
        }
    
    def _prepare_tex_for_tectonic(self, tex_content: str) -> str:
        """Prepare LaTeX content with Tectonic compatibility enhancements"""
        
        # Apply Tectonic compatibility fixes
        tex_content = self._fix_tectonic_compatibility(tex_content)
        
        # Check if glyphtounicode is already included
        if '\\input{glyphtounicode}' in tex_content or 'glyphtounicode.tex' in tex_content:
            logger.info("📝 glyphtounicode already included in LaTeX")
            return tex_content
        
        # Find the position after \documentclass and packages
        lines = tex_content.split('\n')
        insert_position = 0
        
        for i, line in enumerate(lines):
            if line.strip().startswith('\\begin{document}'):
                insert_position = i
                break
            elif line.strip().startswith('\\usepackage'):
                insert_position = i + 1
        
        # Insert glyphtounicode input before \begin{document}
        if insert_position > 0:
            lines.insert(insert_position, '\\IfFileExists{glyphtounicode.tex}{\\input{glyphtounicode}}{} % Tectonic compatibility')
            logger.info("📝 Added glyphtounicode support to LaTeX content")
            return '\n'.join(lines)
        
        return tex_content
    
    def _fix_tectonic_compatibility(self, tex_content: str) -> str:
        """Fix known Tectonic compatibility issues"""
        original_content = tex_content
        
        # Remove or replace pdfTeX-specific commands that Tectonic doesn't support
        tectonic_incompatible = [
            r'\\pdfgentounicode\s*=\s*1',  # pdfTeX Unicode generation
            r'\\pdfcompresslevel\s*=\s*\d+',  # PDF compression level
            r'\\pdfobjcompresslevel\s*=\s*\d+',  # Object compression
            r'\\pdfminorversion\s*=\s*\d+',  # PDF version
        ]
        
        import re
        fixes_applied = []
        
        for pattern in tectonic_incompatible:
            if re.search(pattern, tex_content):
                tex_content = re.sub(pattern, '% Removed for Tectonic compatibility', tex_content)
                fixes_applied.append(pattern)
        
        # Fix problematic packages
        problematic_packages = [
            r'\\usepackage\{microtype\}',  # Often causes issues
            r'\\usepackage\[.*?\]\{microtype\}',
        ]
        
        for pattern in problematic_packages:
            if re.search(pattern, tex_content):
                tex_content = re.sub(pattern, '% \\usepackage{microtype} % Disabled for Tectonic', tex_content)
                fixes_applied.append('microtype package')
        
        if fixes_applied:
            logger.info(f"🔧 Applied Tectonic compatibility fixes: {', '.join(fixes_applied)}")
        
        return tex_content
    
    def _setup_tectonic_support_files(self, work_dir: Path):
        """Copy support files for Tectonic compilation"""
        try:
            # Copy glyphtounicode.tex to working directory
            glyphtounicode_source = Path(__file__).parent.parent / 'glyphtounicode.tex'
            glyphtounicode_dest = work_dir / 'glyphtounicode.tex'
            
            if glyphtounicode_source.exists():
                shutil.copy2(glyphtounicode_source, glyphtounicode_dest)
                logger.info(f"📋 Copied glyphtounicode.tex to working directory")
            else:
                logger.warning(f"⚠️ glyphtounicode.tex not found at {glyphtounicode_source}")
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to setup Tectonic support files: {str(e)}")

# Global PDF generator instance
pdf_generator = PDFGenerator()