export interface DecodedToken {
  sub: string;
  email: string;
  accountId: string;
  memberId: string;
  role: string | string[];
}

export const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    
    // Base64Url to Base64
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 using built-in atob
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (error) {
    console.error('[jwt] Error decoding token:', error);
    return null;
  }
};
