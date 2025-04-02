import * as crypto from 'crypto';
import { clientDataService } from './clientDataService';

// Interface for user data
export interface User {
  id: string;
  username: string;
  role: string;
  displayName: string;
}

// Secret key for token signing (should be in environment variables in production)
const SECRET_KEY = process.env.JWT_SECRET || 'roadmap-jsd-secret-key-change-in-production';

// Token expiration time in seconds (4 hours)
const TOKEN_EXPIRY = 4 * 60 * 60;

/**
 * Authenticate a user against the SharePoint Users list
 * @param username User's email
 * @param password User's password
 * @returns User object if authentication is successful, null otherwise
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    // Get the web URL from clientDataService
    const webUrl = (clientDataService as any).getWebUrl();
    
    // Query the Users list for the provided username
    const endpoint = `${webUrl}/_api/web/lists/getByTitle('RoadmapUsers')/items?$filter=Email eq '${encodeURIComponent(username)}'&$select=Id,Title,Email,Role,Password`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json;odata=nometadata'
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to authenticate: ${response.statusText}`);
    }
    
    const data = await response.json();
    const users = data.value || [];
    
    // Check if user exists and password matches
    if (users.length === 1) {
      const user = users[0];
      
      // In a real application, passwords should be hashed
      // For this example, we're comparing plain text passwords
      if (user.Password === password) {
        return {
          id: user.Id.toString(),
          username: user.Email,
          role: user.Role || 'user',
          displayName: user.Title
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate a token for an authenticated user
 * @param user The authenticated user
 * @returns Secure token
 */
export function generateToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TOKEN_EXPIRY;
  
  const payload = {
    sub: user.username,
    id: user.id,
    role: user.role,
    name: user.displayName,
    iat: now,
    exp: expiresAt
  };
  
  // Convert payload to base64
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64');
  
  // Return token in format: payload.signature
  return `${payloadBase64}.${signature}`;
}

/**
 * Validate a token and return user information if valid
 * @param token The authentication token
 * @returns User object if token is valid, null otherwise
 */
export function validateToken(token: string): User | null {
  try {
    // Split token into payload and signature
    const [payloadBase64, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    
    // Return user information
    return {
      id: payload.id,
      username: payload.sub,
      role: payload.role,
      displayName: payload.name
    };
  } catch (e) {
    console.error('Token validation error:', e);
    return null;
  }
}

/**
 * Generate a CSRF token for form submissions
 * @returns CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if a user has admin privileges
 * @param user The user to check
 * @returns True if the user is an admin, false otherwise
 */
export function isAdmin(user: User | null): boolean {
  return user?.role?.toLowerCase() === 'admin';
}

/**
 * For backward compatibility with existing code
 * @deprecated Use authenticateUser and generateToken instead
 */
export function generateTokenLegacy(username: string, password: string): string {
  const hash = btoa(`${username}:${password}:${new Date().getDate()}`);
  return hash;
}

/**
 * For backward compatibility with existing code
 * @deprecated Use validateToken instead
 */
export function validateTokenLegacy(token: string): boolean {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    // Check username and password
    if (parts[0] !== 'admin@jsd.bs.ch' || parts[1] !== 'admin123') {
      return false;
    }
    // Check if token is from today (expires daily)
    const tokenDay = parseInt(parts[2]);
    const today = new Date().getDate();
    return tokenDay === today;
  } catch (e) {
    return false;
  }
}

// Check if the user is authenticated with SharePoint
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/_api/web/currentuser', {
      method: 'GET',
      headers: {
        'Accept': 'application/json;odata=verbose'
      },
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

// Check if the user has admin access
export async function hasAdminAccess(): Promise<boolean> {
  try {
    const { clientDataService } = await import('./clientDataService');
    return await clientDataService.isCurrentUserAdmin();
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

// Redirect to SharePoint login page if not authenticated
export function redirectToLogin(): void {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `/_layouts/15/authenticate.aspx?Source=${currentUrl}`;
}