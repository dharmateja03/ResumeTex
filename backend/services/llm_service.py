"""
LLM Service with detailed logging for multiple providers
"""
import logging
import time
import asyncio
from typing import Optional, Dict, Any
import httpx
import json
from models.schemas import LLMProvider, LLMConfig, LLMConnectionResponse

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with various LLM providers"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=120.0)

    async def test_connection(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test connection to LLM provider"""
        start_time = time.time()
        logger.info(f"🔧 Testing connection to {config.provider.value} with model {config.model}")
        
        try:
            if config.provider == LLMProvider.OPENAI:
                response = await self._test_openai(config)
            elif config.provider == LLMProvider.ANTHROPIC:
                response = await self._test_anthropic(config)
            elif config.provider == LLMProvider.GOOGLE:
                response = await self._test_google(config)
            elif config.provider == LLMProvider.MISTRAL:
                response = await self._test_mistral(config)
            elif config.provider == LLMProvider.DEEPSEEK:
                response = await self._test_deepseek(config)
            elif config.provider == LLMProvider.OPENROUTER:
                response = await self._test_openrouter(config)
            elif config.provider == LLMProvider.CUSTOM:
                response = await self._test_custom(config)
            else:
                logger.error(f"❌ Unsupported provider: {config.provider}")
                return LLMConnectionResponse(
                    status="error",
                    message=f"Unsupported provider: {config.provider}"
                )
                
            response_time = int((time.time() - start_time) * 1000)
            response.response_time_ms = response_time
            
            if response.status == "success":
                logger.info(f"✅ Connection successful to {config.provider.value} in {response_time}ms")
            else:
                logger.warning(f"⚠️ Connection failed to {config.provider.value}: {response.message}")
                
            return response
            
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Connection test failed for {config.provider.value}: {str(e)}")
            return LLMConnectionResponse(
                status="error",
                message=f"Connection failed: {str(e)}",
                response_time_ms=response_time
            )
    
    async def optimize_resume(self, 
                            tex_content: str, 
                            job_description: str,
                            system_prompt: str,
                            config: LLMConfig) -> Dict[str, Any]:
        """Optimize resume using LLM"""
        start_time = time.time()
        
        # Log input data statistics
        tex_chars = len(tex_content)
        job_chars = len(job_description)
        system_chars = len(system_prompt)
        
        logger.info(f"🎯 Starting resume optimization with {config.provider.value}")
        logger.info(f"📊 Input data - LaTeX: {tex_chars} chars, Job desc: {job_chars} chars, System prompt: {system_chars} chars")
        
        try:
            # Combine system prompt with job description
            combined_prompt = f"{system_prompt}\n\nJob Description:\n{job_description}"
            
            logger.info(f"🤖 CALLING LLM API: {config.provider.value} - {config.model}")
            logger.info(f"📝 Sending system prompt: {len(system_prompt)} characters")
            logger.info(f"💼 Sending job description: {len(job_description)} characters") 
            logger.info(f"📄 Sending LaTeX resume: {len(tex_content)} characters")
            logger.info(f"🔑 Using API key: {'*' * (len(config.api_key) - 4) + config.api_key[-4:] if len(config.api_key) > 4 else '****'}")
            logger.info(f"📡 Making API call to {config.provider.value}...")
            
            if config.provider == LLMProvider.OPENAI:
                logger.info("🔄 Calling OpenAI API...")
                result = await self._call_openai(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.ANTHROPIC:
                logger.info("🔄 Calling Anthropic Claude API...")
                result = await self._call_anthropic(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.GOOGLE:
                logger.info("🔄 Calling Google Gemini API...")
                result = await self._call_google(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.MISTRAL:
                logger.info("🔄 Calling Mistral AI API...")
                result = await self._call_mistral(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.DEEPSEEK:
                logger.info("🔄 Calling DeepSeek API...")
                result = await self._call_deepseek(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.OPENROUTER:
                logger.info("🔄 Calling OpenRouter API...")
                result = await self._call_openrouter(combined_prompt, tex_content, config)
            elif config.provider == LLMProvider.CUSTOM:
                logger.info("🔄 Calling Custom API endpoint...")
                result = await self._call_custom(combined_prompt, tex_content, config)
            else:
                raise ValueError(f"Unsupported provider: {config.provider}")
            
            processing_time = time.time() - start_time
            
            # Log response statistics
            optimized_content = result.get('optimized_tex', '')
            output_chars = len(optimized_content)
            
            logger.info(f"✅ LLM API CALL SUCCESSFUL!")
            logger.info(f"📥 Received optimized LaTeX from {config.provider.value}")
            logger.info(f"📊 Response stats - Output: {output_chars} chars in {processing_time:.2f}s")
            logger.info(f"📈 Character change: {tex_chars} → {output_chars} ({output_chars - tex_chars:+d})")
            
            # Log first few lines of optimized content to verify it's LaTeX
            if optimized_content:
                first_lines = '\n'.join(optimized_content.split('\n')[:5])
                logger.info(f"📝 Optimized LaTeX preview:\n{first_lines}...")
            else:
                logger.warning("⚠️ WARNING: Empty optimized content received from LLM")
            
            return {
                'optimized_tex': optimized_content,
                'processing_time_seconds': processing_time,
                'input_chars': tex_chars,
                'output_chars': output_chars,
                'provider': config.provider.value,
                'model': config.model
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"❌ LLM optimization failed after {processing_time:.2f}s: {str(e)}")
            raise
    
    # Provider-specific implementations
    async def _test_openai(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test OpenAI connection"""
        try:
            response = await self.client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config.model,
                    "messages": [{"role": "user", "content": "Test connection"}],
                    "max_tokens": 5
                }
            )
            
            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)
                
        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))
    
    async def _call_openai(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call OpenAI API"""
        logger.info(f"🔄 Calling OpenAI API with model {config.model}")
        
        response = await self.client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": config.model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Here is the LaTeX resume to optimize:\n\n{tex_content}"}
                ],
                "temperature": 0.3
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
            
        data = response.json()
        optimized_tex = data['choices'][0]['message']['content']
        
        logger.info(f"✅ OpenAI API response received - {len(optimized_tex)} characters")
        return {'optimized_tex': optimized_tex}
    
    async def _test_anthropic(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test Anthropic connection"""
        try:
            response = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": config.api_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": config.model,
                    "max_tokens": 5,
                    "messages": [{"role": "user", "content": "Test connection"}]
                }
            )
            
            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)
                
        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))
    
    async def _call_anthropic(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call Anthropic API with prompt caching for 90% cost reduction"""
        logger.info(f"🔄 Calling Anthropic API with model {config.model}")
        logger.info(f"📡 Anthropic endpoint: https://api.anthropic.com/v1/messages")
        logger.info(f"📝 Sending combined prompt ({len(prompt)} chars) + LaTeX resume ({len(tex_content)} chars)")
        logger.info(f"💾 Using prompt caching to reduce token costs by ~90%")

        # Use prompt caching to cache the system prompt and resume content
        # This reduces costs from $3/1M tokens to $0.30/1M for cached content
        response = await self.client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": config.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": config.model,
                "max_tokens": 4000,
                "system": [
                    {
                        "type": "text",
                        "text": prompt,
                        "cache_control": {"type": "ephemeral"}
                    }
                ],
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Here is the LaTeX resume to optimize:\n\n{tex_content}",
                                "cache_control": {"type": "ephemeral"}
                            }
                        ]
                    }
                ]
            }
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Anthropic API error: {response.status_code} - {response.text}")
            raise Exception(f"Anthropic API error: {response.status_code} - {response.text}")
            
        logger.info(f"✅ Got HTTP 200 response from Anthropic API")
        data = response.json()
        logger.info(f"📦 Anthropic response parsed successfully")

        # Log cache statistics to show cost savings
        usage = data.get('usage', {})
        input_tokens = usage.get('input_tokens', 0)
        cache_creation_tokens = usage.get('cache_creation_input_tokens', 0)
        cache_read_tokens = usage.get('cache_read_input_tokens', 0)
        output_tokens = usage.get('output_tokens', 0)

        if cache_read_tokens > 0:
            savings_pct = (cache_read_tokens / (cache_read_tokens + input_tokens)) * 90
            logger.info(f"💰 CACHE HIT! Saved ~{savings_pct:.1f}% on input tokens")
            logger.info(f"📊 Usage: {input_tokens} new + {cache_read_tokens} cached (90% off) + {output_tokens} output tokens")
        elif cache_creation_tokens > 0:
            logger.info(f"💾 Cache created: {cache_creation_tokens} tokens (future requests will be 90% cheaper)")
            logger.info(f"📊 Usage: {input_tokens} input + {output_tokens} output tokens")
        else:
            logger.info(f"📊 Usage: {input_tokens} input + {output_tokens} output tokens")

        raw_text = data['content'][0]['text']
        logger.info(f"📝 RAW RESPONSE: {len(raw_text)} characters")

        # STRIP EXPLANATORY TEXT - find where \documentclass starts
        optimized_tex = raw_text
        if '\\documentclass' in raw_text:
            idx = raw_text.find('\\documentclass')
            optimized_tex = raw_text[idx:]
            logger.info(f"✅ STRIPPED TEXT - Found \\documentclass at position {idx}")

        logger.info(f"📝 FINAL LaTeX: {len(optimized_tex)} characters")

        # Log first line to verify LaTeX format
        if optimized_tex.strip():
            first_line = optimized_tex.strip().split('\n')[0]
            logger.info(f"📄 First line: {first_line[:80]}")

        return {
            'optimized_tex': optimized_tex,
            'usage': usage
        }
    
    async def _test_google(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test Google AI connection"""
        # Implementation for Google AI API
        return LLMConnectionResponse(status="error", message="Google AI not implemented yet")
    
    async def _call_google(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call Google AI API"""
        raise NotImplementedError("Google AI integration not implemented yet")
    
    async def _test_mistral(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test Mistral connection"""
        try:
            response = await self.client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config.model,
                    "messages": [{"role": "user", "content": "Test connection"}],
                    "max_tokens": 5
                }
            )
            
            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)
                
        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))
    
    async def _call_mistral(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call Mistral API"""
        logger.info(f"🔄 Calling Mistral API with model {config.model}")
        
        response = await self.client.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": config.model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Here is the LaTeX resume to optimize:\n\n{tex_content}"}
                ],
                "temperature": 0.3
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Mistral API error: {response.status_code} - {response.text}")
            
        data = response.json()
        optimized_tex = data['choices'][0]['message']['content']
        
        logger.info(f"✅ Mistral API response received - {len(optimized_tex)} characters")
        return {'optimized_tex': optimized_tex}
    
    async def _test_deepseek(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test DeepSeek connection"""
        try:
            response = await self.client.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config.model,
                    "messages": [{"role": "user", "content": "Test connection"}],
                    "max_tokens": 5
                }
            )
            
            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)
                
        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))
    
    async def _call_deepseek(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call DeepSeek API"""
        logger.info(f"🔄 Calling DeepSeek API with model {config.model}")
        
        response = await self.client.post(
            "https://api.deepseek.com/chat/completions",
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": config.model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Here is the LaTeX resume to optimize:\n\n{tex_content}"}
                ],
                "temperature": 0.3
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"DeepSeek API error: {response.status_code} - {response.text}")
            
        data = response.json()
        optimized_tex = data['choices'][0]['message']['content']
        
        logger.info(f"✅ DeepSeek API response received - {len(optimized_tex)} characters")
        return {'optimized_tex': optimized_tex}
    
    async def _test_openrouter(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test OpenRouter connection"""
        try:
            response = await self.client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://resume-optimizer.app",
                    "X-Title": "Resume Optimizer"
                },
                json={
                    "model": config.model,
                    "messages": [{"role": "user", "content": "Test connection"}],
                    "max_tokens": 16  # Some models require minimum 16 tokens
                }
            )

            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)

        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))

    async def _call_openrouter(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call OpenRouter API"""
        logger.info(f"🔄 Calling OpenRouter API with model {config.model}")

        response = await self.client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://resume-optimizer.app",
                "X-Title": "Resume Optimizer"
            },
            json={
                "model": config.model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Here is the LaTeX resume to optimize:\n\n{tex_content}"}
                ],
                "temperature": 0.3
            }
        )

        if response.status_code != 200:
            raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")

        data = response.json()
        optimized_tex = data['choices'][0]['message']['content']

        logger.info(f"✅ OpenRouter API response received - {len(optimized_tex)} characters")
        return {'optimized_tex': optimized_tex}

    async def _test_custom(self, config: LLMConfig) -> LLMConnectionResponse:
        """Test custom endpoint connection"""
        if not config.custom_endpoint:
            return LLMConnectionResponse(status="error", message="Custom endpoint URL required")
            
        try:
            response = await self.client.post(
                f"{config.custom_endpoint}/test",
                headers={"Authorization": f"Bearer {config.api_key}"},
                json={"test": True}
            )
            
            if response.status_code == 200:
                return LLMConnectionResponse(status="success", message="Connection successful")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return LLMConnectionResponse(status="error", message=error_msg)
                
        except Exception as e:
            return LLMConnectionResponse(status="error", message=str(e))
    
    async def _call_custom(self, prompt: str, tex_content: str, config: LLMConfig) -> Dict[str, Any]:
        """Call custom endpoint"""
        if not config.custom_endpoint:
            raise ValueError("Custom endpoint URL required")
            
        logger.info(f"🔄 Calling custom endpoint: {config.custom_endpoint}")
        
        response = await self.client.post(
            f"{config.custom_endpoint}/optimize",
            headers={"Authorization": f"Bearer {config.api_key}"},
            json={
                "prompt": prompt,
                "tex_content": tex_content,
                "model": config.model
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Custom API error: {response.status_code} - {response.text}")
            
        data = response.json()
        optimized_tex = data.get('optimized_tex', '')
        
        logger.info(f"✅ Custom API response received - {len(optimized_tex)} characters")
        return {'optimized_tex': optimized_tex}
    
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

# Global LLM service instance
llm_service = LLMService()