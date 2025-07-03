import { Router } from 'express';
import { checkAssistantHealth } from '../services/assistant';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// Detailed health check including Letta Cloud
router.get('/detailed', async (req, res) => {
  try {
    const assistantHealth = await checkAssistantHealth();
    
    res.json({
      status: assistantHealth.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '0.1.0',
      assistant: assistantHealth.details
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      assistant: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export { router as healthRoutes }; 