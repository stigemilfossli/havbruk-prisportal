"""
Security utilities for input sanitization and validation.
"""

import re
import html
from typing import Any, Optional
from urllib.parse import urlparse


def sanitize_html(text: str) -> str:
    """
    Sanitize HTML input to prevent XSS attacks.
    Removes dangerous tags and attributes.
    """
    if not text:
        return text
    
    # Basic HTML escaping
    text = html.escape(text)
    
    # Allow safe tags (optional - if you want to allow some formatting)
    # For now, we escape everything for maximum safety
    
    return text


def sanitize_sql_input(text: str) -> str:
    """
    Basic SQL injection prevention by removing dangerous characters.
    Note: Always use parameterized queries instead of string concatenation.
    This is just an additional layer of protection.
    """
    if not text:
        return text
    
    # Remove SQL comment characters
    text = re.sub(r'--', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    
    # Remove semicolons (except for the end of statement)
    text = re.sub(r';(?![^;]*$)', '', text)
    
    return text


def validate_url(url: str) -> bool:
    """
    Validate URL format and ensure it's safe.
    """
    if not url:
        return False
    
    try:
        result = urlparse(url)
        
        # Check scheme
        if result.scheme not in ['http', 'https', 'ftp', 'ftps']:
            return False
        
        # Check for dangerous characters
        if re.search(r'[<>"\']', url):
            return False
        
        return True
    except:
        return False


def validate_email(email: str) -> bool:
    """
    Validate email format.
    """
    if not email:
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    """
    if not filename:
        return filename
    
    # Remove directory traversal attempts
    filename = re.sub(r'\.\./', '', filename)
    filename = re.sub(r'\.\.\\', '', filename)
    
    # Remove dangerous characters
    filename = re.sub(r'[<>:"|?*\\/]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message)
    """
    if not password:
        return False, "Password cannot be empty"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def sanitize_json_input(data: Any) -> Any:
    """
    Sanitize JSON input to prevent injection attacks.
    """
    if isinstance(data, str):
        return sanitize_html(data)
    elif isinstance(data, dict):
        return {k: sanitize_json_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json_input(item) for item in data]
    else:
        return data


