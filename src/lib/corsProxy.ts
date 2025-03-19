// CORS Proxy utility
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

export const withCorsProxy = (url: string): string => {
  // Don't add proxy for localhost or relative URLs
  if (url.startsWith('http://localhost') || url.startsWith('/')) {
    return url;
  }
  return `${CORS_PROXY}${url}`;
}; 