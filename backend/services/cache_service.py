"""
Cache service with Redis and in-memory fallback
"""
import logging
import json
import hashlib
from typing import Optional, Dict, Any, Union
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
    logger.info("✅ Redis client available")
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("⚠️ Redis not available, using in-memory fallback only")

class CacheService:
    """Cache service with Redis primary and in-memory fallback"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        self.redis_connected = False
        
        # TTL settings
        self.default_ttl = 24 * 60 * 60  # 24 hours
        self.pdf_ttl = 60 * 60  # 1 hour for PDFs
        
    async def initialize(self):
        """Initialize Redis connection"""
        if not REDIS_AVAILABLE:
            logger.info("📝 Using in-memory cache only")
            return
            
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            self.redis_connected = True
            logger.info(f"✅ Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {str(e)}, using in-memory fallback")
            self.redis_connected = False
    
    def generate_cache_key(self, data: str) -> str:
        """Generate MD5 hash for cache key"""
        return hashlib.md5(data.encode()).hexdigest()
    
    def generate_optimization_key(self, tex_content: str, job_description: str, 
                                 llm_provider: str, llm_model: str) -> str:
        """Generate cache key for optimization results"""
        combined = f"{tex_content}|{job_description}|{llm_provider}|{llm_model}"
        cache_key = self.generate_cache_key(combined)
        logger.info(f"🔑 Generated optimization cache key: {cache_key[:8]}...")
        return cache_key
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis first, then memory)"""
        try:
            # Try Redis first
            if self.redis_connected and self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    logger.info(f"📥 Cache HIT (Redis): {key[:16]}...")
                    return json.loads(value.decode())
            
            # Fallback to memory cache
            if key in self.memory_cache:
                entry = self.memory_cache[key]
                if datetime.now() < entry['expires_at']:
                    logger.info(f"📥 Cache HIT (Memory): {key[:16]}...")
                    return entry['data']
                else:
                    # Expired, remove it
                    del self.memory_cache[key]
                    logger.info(f"🗑️ Expired cache entry removed: {key[:16]}...")
            
            logger.info(f"❌ Cache MISS: {key[:16]}...")
            return None
            
        except Exception as e:
            logger.error(f"❌ Cache get error for {key[:16]}: {str(e)}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache (Redis and memory)"""
        if ttl is None:
            ttl = self.default_ttl
            
        try:
            serialized_value = json.dumps(value)
            logger.info(f"💾 Caching data: {key[:16]}... (TTL: {ttl}s, Size: {len(serialized_value)} bytes)")
            
            # Try Redis first
            if self.redis_connected and self.redis_client:
                await self.redis_client.setex(key, ttl, serialized_value)
                logger.info(f"✅ Cached in Redis: {key[:16]}...")
            
            # Always cache in memory as backup
            expires_at = datetime.now() + timedelta(seconds=ttl)
            self.memory_cache[key] = {
                'data': value,
                'expires_at': expires_at
            }
            logger.info(f"✅ Cached in memory: {key[:16]}...")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Cache set error for {key[:16]}: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            # Delete from Redis
            if self.redis_connected and self.redis_client:
                await self.redis_client.delete(key)
                logger.info(f"🗑️ Deleted from Redis: {key[:16]}...")
            
            # Delete from memory
            if key in self.memory_cache:
                del self.memory_cache[key]
                logger.info(f"🗑️ Deleted from memory: {key[:16]}...")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Cache delete error for {key[:16]}: {str(e)}")
            return False
    
    async def cache_optimization_result(self, tex_content: str, job_description: str,
                                      llm_provider: str, llm_model: str,
                                      result: Dict[str, Any]) -> str:
        """Cache optimization result and return cache key"""
        cache_key = self.generate_optimization_key(tex_content, job_description, 
                                                  llm_provider, llm_model)
        
        cache_data = {
            'result': result,
            'cached_at': datetime.now().isoformat(),
            'tex_length': len(tex_content),
            'job_desc_length': len(job_description),
            'llm_provider': llm_provider,
            'llm_model': llm_model
        }
        
        await self.set(cache_key, cache_data, self.default_ttl)
        logger.info(f"💾 Cached optimization result for {llm_provider}/{llm_model}")
        return cache_key
    
    async def get_optimization_result(self, tex_content: str, job_description: str,
                                    llm_provider: str, llm_model: str) -> Optional[Dict[str, Any]]:
        """Get cached optimization result"""
        cache_key = self.generate_optimization_key(tex_content, job_description,
                                                  llm_provider, llm_model)
        
        cached_data = await self.get(cache_key)
        if cached_data:
            logger.info(f"🎯 Found cached optimization for {llm_provider}/{llm_model}")
            return cached_data['result']
        
        return None
    
    async def cache_pdf_file(self, optimization_id: str, pdf_path: str) -> bool:
        """Cache PDF file path"""
        key = f"pdf_result:{optimization_id}"
        data = {
            'pdf_path': pdf_path,
            'created_at': datetime.now().isoformat()
        }
        
        return await self.set(key, data, self.pdf_ttl)
    
    async def get_pdf_path(self, optimization_id: str) -> Optional[str]:
        """Get cached PDF path"""
        key = f"pdf_result:{optimization_id}"
        data = await self.get(key)
        
        if data:
            logger.info(f"📄 Found cached PDF for optimization {optimization_id}")
            return data['pdf_path']
        
        return None
    
    async def cleanup_expired(self):
        """Clean up expired entries from memory cache"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if now >= entry['expires_at']
        ]
        
        for key in expired_keys:
            del self.memory_cache[key]
            
        if expired_keys:
            logger.info(f"🧹 Cleaned up {len(expired_keys)} expired cache entries")
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = {
            'redis_connected': self.redis_connected,
            'memory_cache_size': len(self.memory_cache),
            'redis_url': self.redis_url if self.redis_connected else None
        }
        
        # Get Redis info if available
        if self.redis_connected and self.redis_client:
            try:
                redis_info = await self.redis_client.info('memory')
                stats['redis_memory_usage'] = redis_info.get('used_memory_human', 'N/A')
            except Exception as e:
                logger.error(f"❌ Error getting Redis stats: {str(e)}")
        
        return stats
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("🔌 Redis connection closed")

# Global cache service instance
cache_service = CacheService()