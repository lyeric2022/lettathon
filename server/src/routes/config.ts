import { Router } from 'express';

const router = Router();

// Get server configuration
router.get('/', (req, res) => {
  const lettaApiKey = process.env.LETTA_API_KEY;
  const lettaAgentId = process.env.LETTA_AGENT_ID;
  
  res.json({
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    lettaProject: process.env.LETTA_PROJECT || 'default-project',
    version: process.env.npm_package_version || '0.1.0',
    configuration: {
      lettaApiKey: lettaApiKey ? '✅ Configured' : '❌ Missing',
      lettaAgentId: lettaAgentId ? '✅ Configured' : '❌ Missing',
      lettaProject: process.env.LETTA_PROJECT || 'default'
    }
  });
});

// Update server configuration
router.put('/', (req, res) => {
  const { port, lettaProject } = req.body;
  
  // In a real application, you'd validate and update configuration
  // For now, just return success
  res.json({
    success: true,
    message: 'Configuration updated (not persisted in development)',
    config: {
      port: port || process.env.PORT || 3001,
      lettaProject: lettaProject || process.env.LETTA_PROJECT || 'default-project'
    }
  });
});

export { router as configRoutes }; 