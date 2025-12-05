/**
 * Authentication utilities for both Clerk and dev bypass
 */

export const isAuthenticated = (): boolean => {
  // Check for dev bypass token
  const devToken = localStorage.getItem('auth_token');
  if (devToken && devToken.startsWith('dev-token-')) {
    return true;
  }

  // Check for Clerk authentication (will be handled by Clerk SDK)
  return false;
};

export const getUserInfo = (): any => {
  try {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
};
