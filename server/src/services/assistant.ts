import { LettaClient } from '@letta-ai/letta-client';
import winston from 'winston';
import { performOCR } from './ocr';
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

      // Pre-process screenshot locally for privacy (OCR)
      let screenText = '';
      if (validatedData.screenshot) {
        try {
          const ocrResult = await performOCR(validatedData.screenshot);
          screenText = ocrResult.text;
          logger.info(`Local OCR extracted ${screenText.length} characters`);
        } catch (ocrError) {
          logger.warn('Local OCR failed', { error: ocrError });
        }
      }

      // Transcribe audio if provided
      let audioTranscript = '';
      if (validatedData.audio) {
        try {
          const transcriptionResult = await transcribeAudio(validatedData.audio, {
            model: 'distil-whisper-large-v3-en', // Fastest English-only model
            language: 'en', // English only
            prompt: 'This is audio from a screen capture session. The user might be speaking about what they see on screen or asking for help.'
          });
          audioTranscript = transcriptionResult.text;
          logger.info(`Audio transcribed: ${audioTranscript.length} characters, confidence: ${transcriptionResult.confidence}%`);
        } catch (audioError) {
          logger.warn('Audio transcription failed', { error: audioError });
          audioTranscript = '[Audio provided but transcription failed]';
        }
      }

      // Prepare context for Letta agent
      const contextParts = [];
      
      // Put audio transcript first (highest priority)
      if (audioTranscript) {
        contextParts.push(`User's message to you: ${audioTranscript}`);
      }
      
      if (screenText) {
        contextParts.push(`Screen Content (OCR): "${screenText}"`);
      }
      
      if (validatedData.clipboard) {
        contextParts.push(`Clipboard Content: "${validatedData.clipboard}"`);
      }

      const userMessage = contextParts.length > 0 
        ? `I need help with the following content:\n\n${contextParts.join('\n\n')}`
        : 'I need assistance with my current screen.';

      // Send message to Letta agent (stateful - only send new message)
      const response = await this.client.agents.messages.create(this.agentId, {
        messages: [{
          role: 'user',
          content: userMessage
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
          screenTextLength: screenText.length,
          transcriptLength: audioTranscript.length,
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