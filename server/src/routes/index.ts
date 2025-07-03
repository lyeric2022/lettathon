import { Application } from 'express';
import { authRoutes } from './auth';
import { configRoutes } from './config';
import { healthRoutes } from './health';

export function setupRoutes(app: Application): void {
  // Mount route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/health', healthRoutes);
  
  // API version
  app.get('/api/version', (req, res) => {
    res.json({
      version: process.env.npm_package_version || '0.1.0',
      name: 'Catfish Server',
      environment: process.env.NODE_ENV || 'development'
    });
  });
} 