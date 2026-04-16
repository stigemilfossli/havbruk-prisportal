from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # CSP - Content Security Policy
        # Note: Adjust these policies based on your actual needs
        csp_policies = [
            \
default-src
self
\,
            \script-src
self
unsafe-inline
https://cdn.jsdelivr.net\,
            \style-src
self
unsafe-inline
https://cdn.jsdelivr.net\,
            \img-src
self
data:
https:\,
            \font-src
self
https://cdn.jsdelivr.net\,
            \connect-src
self
\,
            \frame-ancestors
none
\,
            \form-action
self
\,
        ]
        response.headers['Content-Security-Policy'] = '; '.join(csp_policies)
        
        # HSTS - Only enable in production with HTTPS
        # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Permissions Policy
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
