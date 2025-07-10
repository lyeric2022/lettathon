import { LettaClient } from '@letta-ai/letta-client';
import winston from 'winston';
import { transcribeAudio, checkVoiceHealth } from './voice';
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
    hasImage?: boolean; // Add this line
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
      logger.info('Processing assistant request via Letta Cloud with image streaming', {
        hasScreenshot: !!data.screenshot,
        hasAudio: !!data.audio,
        hasClipboard: !!data.clipboard,
        timestamp: data.timestamp
      });

      // Validate input data
      const validatedData = validateRequestData(data);

      // Prepare multi-modal content for Letta
      const content: any[] = [];
      
      // Add image if screenshot is provided
      if (validatedData.screenshot) {
        const base64Data = validatedData.screenshot.replace(/^data:image\/[a-z]+;base64,/, '');
        
        content.push({
          type: "image",
          source: {
            type: "base64",
            mediaType: "image/png", // Change from media_type to mediaType
            data: base64Data,
          },
        });
      }
      
      // Add text content
      const textParts = [];
      
      // Add audio transcript if provided
      if (validatedData.audio) {
        try {
          const transcriptionResult = await transcribeAudio(validatedData.audio, {
            model: 'distil-whisper-large-v3-en',
            language: 'en',
            prompt: 'This is audio from a screen capture session. The user might be speaking about what they see on screen or asking for help.'
          });
          textParts.push(`User's voice command: ${transcriptionResult.text}`);
          logger.info(`Audio transcribed: ${transcriptionResult.text.length} characters, confidence: ${transcriptionResult.confidence}%`);
        } catch (audioError) {
          logger.warn('Audio transcription failed', { error: audioError });
          textParts.push('[Audio provided but transcription failed]');
        }
      }
      
      // Add clipboard content if provided
      if (validatedData.clipboard) {
        textParts.push(`Clipboard content: ${validatedData.clipboard}`);
      }
      
      // Add default prompt if no other text content
      if (textParts.length === 0) {
        textParts.push('Please analyze this screenshot and provide helpful assistance.');
      }
      
      // Add text content to the message
      content.push({
        type: "text",
        text: textParts.join('\n\n')
      });

      // Send multi-modal message to Letta agent
      const response = await this.client.agents.messages.create(this.agentId, {
        messages: [{
          role: 'user',
          content: content
        }]
      });

      // Extract assistant response from Letta
      let assistantAnswer = '';
      let toolCalls = [];
      
      for (const msg of response.messages) {
        if (msg.messageType === 'assistant_message') {
          assistantAnswer = (msg.content as any) || '';
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
      
      logger.info('Assistant request completed via Letta Cloud with image streaming', {
        processingTime,
        responseLength: assistantAnswer.length,
        toolCallsCount: toolCalls.length,
        hasImage: !!validatedData.screenshot
      });

      return {
        success: true,
        answer: assistantAnswer || 'I processed your request but couldn\'t generate a response.',
        metadata: {
          processingTime,
          screenTextLength: 0, // Add this line
          hasImage: !!validatedData.screenshot,
          transcriptLength: textParts.join('').length,
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

      // Check voice service health
      const voiceHealth = await checkVoiceHealth();

      if (!ourAgent) {
        return {
          status: 'unhealthy',
          details: {
            letta: 'connected',
            agent: 'not found',
            voice: voiceHealth.details,
            error: `Agent ${this.agentId} not found`
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          letta: 'connected',
          agent: 'ready',
          voice: voiceHealth.details,
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
          voice: 'unknown',
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