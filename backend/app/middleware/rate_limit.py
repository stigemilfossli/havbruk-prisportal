"""
Rate limiting middleware for FastAPI.
Uses in-memory store for simplicity (replace with Redis in production).
"""

import time
from collections import defaultdict
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get current timestamp
        current_time = time.time()
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.window_seconds
        ]
        
        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {self.window_seconds} seconds.",
                headers={"Retry-After": str(self.window_seconds)}
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)
        
        # Continue with request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.requests[client_ip])
        )
        response.headers["X-RateLimit-Reset"] = str(
            int(current_time + self.window_seconds)
        )
        
        return response


# Rate limit configuration for different endpoints
RATE_LIMITS = {
    "/api/auth/login": {"max_requests": 5, "window_seconds": 300},  # 5 attempts per 5 minutes for login
    "/api/auth/register": {"max_requests": 3, "window_seconds": 3600},  # 3 registrations per hour
    "default": {"max_requests": 100, "window_seconds": 60},  # 100 requests per minute for other endpoints
}


def get_rate_limit_config(path: str):
    """Get rate limit configuration for a specific path"""
    for endpoint, config in RATE_LIMITS.items():
        if path.startswith(endpoint):
            return config
    return RATE_LIMITS["default"]