import secrets
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, cookie_name: str = 'csrf_token', header_name: str = 'X-CSRF-Token'):
        super().__init__(app)
        self.cookie_name = cookie_name
        self.header_name = header_name
        self.safe_methods = {'GET', 'HEAD', 'OPTIONS'}
    
    async def dispatch(self, request: Request, call_next):
        if request.method in self.safe_methods:
            response = await call_next(request)
            if not request.cookies.get(self.cookie_name):
                self._set_csrf_cookie(response)
            return response
        
        csrf_cookie = request.cookies.get(self.cookie_name)
        csrf_header = request.headers.get(self.header_name)
        
        if not csrf_cookie or not csrf_header:
            raise HTTPException(status_code=403, detail='CSRF token missing')
        
        if not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(status_code=403, detail='Invalid CSRF token')
        
        response = await call_next(request)
        if not request.cookies.get(self.cookie_name):
            self._set_csrf_cookie(response)
        
        return response
    
    def _set_csrf_cookie(self, response: Response):
        token = secrets.token_urlsafe(32)
        response.set_cookie(
            key=self.cookie_name,
            value=token,
            httponly=False,  # Must be readable by JS to set X-CSRF-Token header
            secure=True,
            samesite='strict',
            max_age=3600 * 24 * 7,
            path='/',
        )

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)

def validate_csrf_token(token: str, cookie_token: str) -> bool:
    return secrets.compare_digest(token, cookie_token)
