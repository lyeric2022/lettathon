import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import winston from 'winston';
import { processAssistantRequest } from './services/assistant';
import { setupRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers';
import { authMiddleware } from './middleware/auth';

// Load environment variables
config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Add configuration validation and logging function
function logConfigurationStatus(): void {
  logger.info('🔧 Configuration Status:');
  
  // Environment
  logger.info(`📍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🚀 PORT: ${process.env.PORT || '3001'}`);
  logger.info(`📝 LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
  
  // Letta Configuration
  const lettaApiKey = process.env.LETTA_API_KEY;
  const lettaAgentId = process.env.LETTA_AGENT_ID;
  const lettaProject = process.env.LETTA_PROJECT;
  
  if (lettaApiKey) {
    logger.info(`🤖 LETTA_API_KEY: ✅ Found (${lettaApiKey.substring(0, 10)}...)`);
  } else {
    logger.error('🤖 LETTA_API_KEY: ❌ Missing - Server will fail to start');
  }
  
  if (lettaAgentId) {
    logger.info(`🧠 LETTA_AGENT_ID: ✅ Found (${lettaAgentId})`);
  } else {
    logger.error('🧠 LETTA_AGENT_ID: ❌ Missing - Agent requests will fail');
  }
  
  logger.info(`📂 LETTA_PROJECT: ${lettaProject || 'default'}`);
  
  // Environment file check
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    logger.info('📄 .env file: ✅ Found');
  } else {
    logger.warn('📄 .env file: ⚠️  Not found - using system environment variables');
  }
  
  logger.info('🔧 Configuration check complete\n');
}

class CatfishServer {
  private app: express.Application;
  private server: any;
  private wss!: WebSocketServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security and performance
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['app://catfish-assistant'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0'
      });
    });

    // Detailed health check with Letta status
    this.app.get('/health/detailed', async (req, res) => {
      try {
        const { checkAssistantHealth } = await import('./services/assistant');
        const health = await checkAssistantHealth();
        
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '0.1.0',
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || '3001',
            logLevel: process.env.LOG_LEVEL || 'info'
          },
          letta: {
            apiKey: process.env.LETTA_API_KEY ? 'configured' : 'missing',
            agentId: process.env.LETTA_AGENT_ID ? 'configured' : 'missing',
            project: process.env.LETTA_PROJECT || 'default',
            connection: health
          }
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // API routes
    setupRoutes(this.app);

    // Main assistant endpoint
    this.app.post('/api/assistant', authMiddleware, async (req, res) => {
      const startTime = Date.now();
      logger.info('Assistant request received', {
        hasScreenshot: !!req.body.screenshot,
        hasAudio: !!req.body.audio,
        hasClipboard: !!req.body.clipboard,
        timestamp: req.body.timestamp
      });
      
      try {
        const { screenshot, audio, clipboard } = req.body;
        
        if (!screenshot) {
          logger.warn('Assistant request rejected: missing screenshot');
          return res.status(400).json({ 
            error: 'Screenshot is required',
            message: 'Please provide a screenshot for analysis'
          });
        }

        logger.info('Processing assistant request...');
        const result = await processAssistantRequest({
          screenshot,
          audio,
          clipboard,
          timestamp: Date.now()
        });

        const processingTime = Date.now() - startTime;
        logger.info('Assistant request completed', {
          processingTime,
          success: result.success,
          responseLength: result.answer?.length || 0
        });

        res.json({ success: true, result });
      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error('Assistant request failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime
        });
      }
    });
  }

  private setupWebSocket(): void {
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      logger.info('WebSocket connection established');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'assistant-request') {
            const result = await processAssistantRequest(message.data);
            ws.send(JSON.stringify({
              type: 'assistant-response',
              data: result
            }));
          }
        } catch (error) {
          logger.error('WebSocket message processing failed:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process request'
          }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  public start(): void {
    // Log configuration before starting
    logConfigurationStatus();
    
    this.server.listen(this.port, () => {
      logger.info(`Catfish server listening on port ${this.port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Test Letta connection on startup
      this.testLettaConnection();
    });
  }

  private async testLettaConnection(): Promise<void> {
    try {
      logger.info('🔍 Testing Letta Cloud connection...');
      const { checkAssistantHealth } = await import('./services/assistant');
      const health = await checkAssistantHealth();
      
      if (health.status === 'healthy') {
        logger.info('🤖 Letta Cloud: ✅ Connected successfully');
        logger.info(`🧠 Agent: ${health.details.agentName} (${health.details.agentId})`);
      } else {
        logger.error('🤖 Letta Cloud: ❌ Connection failed');
        logger.error(`🔴 Error: ${health.details.error}`);
      }
    } catch (error) {
      logger.error('🤖 Letta Cloud: ❌ Connection test failed');
      logger.error(`🔴 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    logger.info(''); // Empty line for readability
  }

  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.info('Server stopped');
      });
    }
  }
}

// Start the server
const server = new CatfishServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.stop();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.stop();
});

export default server; 