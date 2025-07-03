import { Router } from 'express';

const router = Router();

// Simple authentication check
router.get('/status', (req, res) => {
  res.json({
    authenticated: true,
    message: 'Authentication is handled via API key'
  });
});

// API key validation endpoint
router.post('/validate', (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({
      error: 'API key is required'
    });
  }
  
  // For now, just check if it's a valid Letta API key format
  if (apiKey.startsWith('sk-let-')) {
    res.json({
      valid: true,
      message: 'API key format is valid'
    });
  } else {
    res.status(401).json({
      valid: false,
      error: 'Invalid API key format'
    });
  }
});

export { router as authRoutes }; 