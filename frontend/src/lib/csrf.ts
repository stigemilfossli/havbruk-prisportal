// CSRF token utility
export function getCsrfToken(): string | null {
  // CSRF token is in httpOnly cookie, not accessible from JavaScript
  // The token will be automatically included in requests via the X-CSRF-Token header
  // which should be set by the backend middleware
  return null;
}

export function setCsrfTokenHeader(headers: Record<string, string>): Record<string, string> {
  // In a real implementation, you would get the token from a meta tag or similar
  // For now, we rely on the backend to set the appropriate headers
  return headers;
}
