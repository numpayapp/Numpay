import { Request, Response, NextFunction } from 'express';
import { privy } from '../services/privy';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        privyDID: string;
        userId: string;
        email?: string;
        phoneNumber?: string;
      };
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Bearer token is required' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Privy
    const verifiedClaims = await privy.verifyAuthToken(token);
    
    if (!verifiedClaims) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid' 
      });
      return;
    }

    // Extract user information from verified claims
    const user = {
      privyDID: verifiedClaims.userId,
      userId: verifiedClaims.userId,
      email: undefined, // Will be fetched separately if needed
      phoneNumber: undefined // Will be fetched separately if needed
    };

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific Privy errors
    if (error && typeof error === 'object' && 'type' in error && 'status' in error) {
      if (error.type === 'api_error' && (error as any).status === 404) {
        res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid Privy app configuration. Please check your credentials.' 
        });
        return;
      }
    }
    
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token' 
    });
    return;
  }
};

// Middleware for resource-based authorization
export const authorizeUserResource = (resourceUserIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated' 
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdParam];
    
    if (!resourceUserId) {
      res.status(400).json({ 
        error: 'Missing resource identifier',
        message: 'Resource user ID is required' 
      });
      return;
    }

    // Check if the authenticated user is accessing their own resource
    if (req.user.userId !== resourceUserId && req.user.privyDID !== resourceUserId) {
      res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access your own resources' 
      });
      return;
    }

    next();
  };
};

// Optional authentication middleware for routes that can work with or without auth
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    const verifiedClaims = await privy.verifyAuthToken(token);
    
    if (verifiedClaims) {
      req.user = {
        privyDID: verifiedClaims.userId,
        userId: verifiedClaims.userId,
        email: undefined, // Will be fetched separately if needed
        phoneNumber: undefined // Will be fetched separately if needed
      };
    }
    
    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    console.warn('Optional authentication failed:', error);
    next();
  }
}; 