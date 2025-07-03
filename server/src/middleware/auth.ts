import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Bearer token required' });
      return;
    }

    // For local development, we just validate that a token is present
    // In production, you might want to validate against a known set of keys
    if (token.length < 10) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    // Add the token to the request for downstream use
    (req as any).authToken = token;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
} 