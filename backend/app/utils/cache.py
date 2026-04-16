"""
Simple caching utilities for improving performance.
In production, use Redis or Memcached instead.
"""

import time
from typing import Any, Optional, Callable
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class SimpleCache:
    """Simple in-memory cache with TTL support."""
    
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry is None or time.time() < expiry:
                return value
            else:
                # Remove expired entry
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with optional TTL (seconds)."""
        expiry = time.time() + ttl if ttl is not None else None
        self._cache[key] = (value, expiry)
    
    def delete(self, key: str):
        """Delete value from cache."""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self):
        """Clear all cache entries."""
        self._cache.clear()
    
    def size(self) -> int:
        """Get number of cache entries."""
        return len(self._cache)


# Global cache instance
cache = SimpleCache()


def cached(ttl: Optional[int] = None, key_prefix: str = ""):
    """
    Decorator for caching function results.
    
    Args:
        ttl: Time to live in seconds (None = no expiry)
        key_prefix: Prefix for cache key
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {cache_key}, cached for {ttl}s")
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern.
    
    Args:
        pattern: Pattern to match cache keys (supports * wildcard)
    """
    keys_to_delete = []
    for key in cache._cache.keys():
        if pattern == "*" or pattern in key:
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        cache.delete(key)
    
    logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching '{pattern}'")


# Cache configurations for different data types
CACHE_CONFIG = {
    "products_list": 300,  # 5 minutes
    "product_details": 600,  # 10 minutes
    "suppliers_list": 300,  # 5 minutes
    "prices": 180,  # 3 minutes (prices change frequently)
    "stats": 60,  # 1 minute
    "categories": 3600,  # 1 hour
}


def get_cache_ttl(cache_type: str) -> Optional[int]:
    """Get TTL for cache type from configuration."""
    return CACHE_CONFIG.get(cache_type)


# Cache key generators
def product_list_key(category: Optional[str] = None, query: Optional[str] = None) -> str:
    """Generate cache key for product list."""
    return f"products:list:{category or 'all'}:{query or ''}"


def product_details_key(product_id: int) -> str:
    """Generate cache key for product details."""
    return f"products:details:{product_id}"


def supplier_list_key(category: Optional[str] = None, region: Optional[str] = None) -> str:
    """Generate cache key for supplier list."""
    return f"suppliers:list:{category or 'all'}:{region or 'all'}"


def prices_key(product_id: Optional[int] = None, supplier_id: Optional[int] = None) -> str:
    """Generate cache key for prices."""
    return f"prices:{product_id or 'all'}:{supplier_id or 'all'}"


def stats_key() -> str:
    """Generate cache key for stats."""
    return "stats:global"