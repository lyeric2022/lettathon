import { LettaClient } from '@letta-ai/letta-client';
import winston from 'winston';
import { performOCR } from './ocr';
import { validateRequestData } from '../utils/validation';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'assistant.log' })
  ]
});

interface AssistantRequest {
  screenshot?: string;
  audio?: string;
  clipboard?: string;
  timestamp: number;
}

interface AssistantResponse {
  success: boolean;
  answer: string;
  metadata?: {
    processingTime: number;
    screenTextLength: number;
    transcriptLength: number;
    clipboardLength: number;
    timestamp: number;
  };
  error?: string;
}

class CatfishAssistant {
  private client: LettaClient;
  private agentId: string;

  constructor() {
    const token = process.env.LETTA_API_KEY;
    const agentId = process.env.LETTA_AGENT_ID;

    if (!token) {
      throw new Error('LETTA_API_KEY environment variable is required');
    }

    if (!agentId) {
      throw new Error('LETTA_AGENT_ID environment variable is required. Run agent setup first.');
    }

    this.client = new LettaClient({ 
      token,
      project: process.env.LETTA_PROJECT || 'default'
    });
    this.agentId = agentId;
    
    logger.info('Catfish Assistant initialized with Letta Cloud', { agentId });
  }

  async processRequest(data: AssistantRequest): Promise<AssistantResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Processing assistant request via Letta Cloud', {
        hasScreenshot: !!data.screenshot,
        hasAudio: !!data.audio,
        hasClipboard: !!data.clipboard,
        timestamp: data.timestamp
      });

      // Validate input data
      const validatedData = validateRequestData(data);

      // Build multi-modal content array
      const content: any[] = [];
      
      // Add screenshot as image if available
      if (validatedData.screenshot) {
        // Extract base64 data from data URL
        const base64Data = validatedData.screenshot.replace(/^data:image\/[a-z]+;base64,/, '');
        
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png", // Screenshots are typically PNG
            data: base64Data,
          },
        });
        
        logger.info('Added screenshot as image to message');
      }

      // Add text content
      let textMessage = "Please analyze this screenshot and help me understand what you see.";
      
      if (validatedData.clipboard) {
        textMessage = `Please analyze this screenshot. Also, here's the clipboard content: "${validatedData.clipboard}"`;
      }
      
      content.push({
        type: "text",
        text: textMessage
      });

      // Send multi-modal message to Letta agent
      const response = await this.client.agents.messages.create(this.agentId, {
        messages: [{
          role: "user",
          content: content as any // Type assertion for multi-modal content
        }]
      } as any);

      // Extract assistant response from Letta
      let assistantAnswer = '';
      let toolCalls = [];
      
      for (const msg of response.messages) {
        if (msg.messageType === 'assistant_message') {
          // Handle both string and array content types
          if (typeof msg.content === 'string') {
            assistantAnswer = msg.content;
          } else if (Array.isArray(msg.content)) {
            // Extract text from content array
            const textContent = msg.content.find((c: any) => c.type === 'text');
            assistantAnswer = textContent?.text || '';
          }
        } else if (msg.messageType === 'tool_call_message') {
          toolCalls.push({
            name: msg.toolCall?.name,
            arguments: msg.toolCall?.arguments
          });
        } else if (msg.messageType === 'reasoning_message') {
          logger.info('Agent reasoning', { reasoning: msg.reasoning });
        }
      }

      const processingTime = Date.now() - startTime;
      
      logger.info('Assistant request completed via Letta Cloud', {
        processingTime,
        responseLength: assistantAnswer.length,
        toolCallsCount: toolCalls.length
      });

      return {
        success: true,
        answer: assistantAnswer || 'I processed your request but couldn\'t generate a response.',
        metadata: {
          processingTime,
          screenTextLength: 0, // Using image directly, no OCR
          transcriptLength: 0, // No audio transcription yet
          clipboardLength: (validatedData.clipboard || '').length,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Assistant request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        answer: 'I apologize, but I encountered an error while processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          processingTime,
          screenTextLength: 0,
          transcriptLength: 0,
          clipboardLength: 0,
          timestamp: Date.now()
        }
      };
    }
  }

  async checkHealth(): Promise<{ status: string; details: any }> {
    try {
      // Test connection to Letta Cloud by listing agents
      const agents = await this.client.agents.list();
      const ourAgent = agents.find(agent => agent.id === this.agentId);

      if (!ourAgent) {
        return {
          status: 'unhealthy',
          details: {
            letta: 'connected',
            agent: 'not found',
            error: `Agent ${this.agentId} not found`
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          letta: 'connected',
          agent: 'ready',
          agentName: ourAgent.name,
          agentId: this.agentId
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          letta: 'disconnected',
          agent: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Create singleton instance
let assistantInstance: CatfishAssistant | null = null;

function getAssistant(): CatfishAssistant {
  if (!assistantInstance) {
    assistantInstance = new CatfishAssistant();
  }
  return assistantInstance;
}

// Export functions for backward compatibility
export async function processAssistantRequest(data: AssistantRequest): Promise<AssistantResponse> {
  const assistant = getAssistant();
  return assistant.processRequest(data);
}

export async function checkAssistantHealth(): Promise<{ status: string; details: any }> {
  try {
    const assistant = getAssistant();
    return assistant.checkHealth();
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        letta: 'initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 