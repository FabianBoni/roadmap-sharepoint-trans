import { getSP } from './spConfig';

export async function authenticateWithSharePoint(username: string, password: string) {
  try {
    // In a real SharePoint app, you'd use SharePoint's authentication
    // This is a placeholder - authentication would be handled by SharePoint
    
    // For SharePoint Online, consider using MSAL (Microsoft Authentication Library)
    // or rely on the SharePoint context if deploying as an app/web part
    
    // Check if the user exists in the SharePoint users list
    const sp = getSP();
    const users = await sp.web.lists.getByTitle('RoadmapUsers').items
      .filter(`Email eq '${username}'`)
      .top(1)
      (); // Changed from .get() to just ()
    
    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    // In a real implementation, you'd use SharePoint's built-in auth
    // This is just a placeholder for the demo
    const user = users[0];
    if (user.Role === 'ADMIN') {
      return { 
        success: true, 
        user: { 
          email: user.Email, 
          name: user.Title, 
          role: user.Role 
        } 
      };
    }
    
    return { success: false, message: 'Not authorized' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}