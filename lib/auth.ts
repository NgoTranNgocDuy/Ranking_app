/**
 * Get or create anonymous owner token for client-side session ownership
 */
export function getOwnerToken(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'ranking_app_owner_token';
  let token = localStorage.getItem(key);
  
  if (!token) {
    // Generate a random token
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(key, token);
  }
  
  return token;
}

/**
 * Check if current user can edit this session
 */
export function canEditSession(sessionOwnerId?: string): boolean {
  if (!sessionOwnerId) return true; // No owner set, anyone can edit
  return getOwnerToken() === sessionOwnerId;
}
