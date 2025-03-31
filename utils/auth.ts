// A simple token generator (not production-ready, but better than nothing)
export function generateToken(username: string, password: string): string {
  const hash = btoa(`${username}:${password}:${new Date().getDate()}`);
  return hash;
}

export function validateToken(token: string): boolean {
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