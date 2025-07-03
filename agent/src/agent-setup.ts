import { LettaClient } from '@letta-ai/letta-client';
import performOCR from './tools/ocr.js';
import transcribeAudio from './tools/stt.js';
import dotenv from 'dotenv';
import winston from 'winston';
import { join } from 'path';

// Load .env from the root directory (one level up from agent/)
dotenv.config({ path: join(process.cwd(), '../.env') });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'agent-setup.log' })
  ]
});

interface CatfishAgentConfig {
  name: string;
  description: string;
  memoryBlocks: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  tools: string[];
  model: string;
  embedding: string;
}

class CatfishAgent {
  private client: LettaClient;
  private agentId: string | null = null;

  constructor() {
    const token = process.env.LETTA_API_KEY;
    if (!token) {
      throw new Error('LETTA_API_KEY environment variable is required');
    }

    this.client = new LettaClient({ 
      token,
      project: process.env.LETTA_PROJECT || 'default-project'
    });
    logger.info('Letta client initialized for Catfish Agent');
  }

  async setupAgent(): Promise<string> {
    try {
      // First, create our custom OCR tool
      // await this.createCustomTools(); // Temporarily disabled

      const config: CatfishAgentConfig = {
        name: 'Catfish Screen Assistant',
        description: 'AI assistant specialized in analyzing screen content, audio, and clipboard data',
        memoryBlocks: [
          {
            label: 'human',
            value: 'The user is using Catfish, a screen analysis tool. They capture screenshots, audio, and clipboard content for AI assistance.'
          },
          {
            label: 'persona',
            value: 'I am Catfish, an AI assistant that specializes in analyzing screen content, transcribing audio, and helping with digital workflows. I am helpful, concise, and privacy-focused.'
          },
          {
            label: 'context',
            value: 'Current session context and screen analysis history.',
            description: 'Stores context about recent screen captures and user interactions for better assistance'
          }
        ],
        tools: ['web_search', 'run_code'],
        model: 'openai/gpt-4.1',
        embedding: 'openai/text-embedding-3-small'
      };

      logger.info('Creating Catfish agent with Letta Cloud...');

      const agent = await this.client.agents.create({
        name: config.name,
        description: config.description,
        memoryBlocks: config.memoryBlocks,
        tools: config.tools,
        model: config.model,
        embedding: config.embedding
      });

      this.agentId = agent.id;
      
      logger.info('Catfish agent created successfully', {
        agentId: agent.id,
        name: agent.name
      });

      // Save agent ID to environment file for server usage
      await this.saveAgentId(agent.id);

      return agent.id;

    } catch (error) {
      logger.error('Failed to setup Catfish agent', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async createCustomTools(): Promise<void> {
    try {
      // Create OCR tool using upsert (creates or updates)
      const ocrTool = await this.client.tools.upsert({
        description: 'Extract text from screen images using OCR',
        sourceCode: `
async function catfish_ocr(image_data) {
  // This would normally call the OCR processing function
  // For now, return a placeholder
  return "OCR processing not yet implemented in agent context";
}
        `.trim(),
        jsonSchema: {
          type: "function",
          function: {
            name: "catfish_ocr",
            description: "Extract text from screen images using OCR",
            parameters: {
              type: "object",
              properties: {
                image_data: {
                  type: "string",
                  description: "Base64 encoded image data"
                }
              },
              required: ["image_data"]
            }
          }
        }
      });

      // Create STT tool using upsert (creates or updates)
      const sttTool = await this.client.tools.upsert({
        description: 'Transcribe audio to text using speech-to-text',
        sourceCode: `
async function catfish_stt(audio_data) {
  // This would normally call the STT processing function
  // For now, return a placeholder
  return "Audio transcription not yet implemented in agent context";
}
        `.trim(),
        jsonSchema: {
          type: "function",
          function: {
            name: "catfish_stt",
            description: "Transcribe audio to text using speech-to-text",
            parameters: {
              type: "object",
              properties: {
                audio_data: {
                  type: "string",
                  description: "Base64 encoded audio data"
                }
              },
              required: ["audio_data"]
            }
          }
        }
      });

      logger.info('Custom tools created successfully', {
        ocrTool: ocrTool.id,
        sttTool: sttTool.id
      });

    } catch (error) {
      // Tools might already exist, which is fine
      if (error instanceof Error && error.message.includes('already exists')) {
        logger.info('Custom tools already exist, skipping creation');
      } else {
        logger.warn('Failed to create custom tools', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async saveAgentId(agentId: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const envPath = path.join(process.cwd(), '../.env');
    
    try {
      let envContent = '';
      try {
        envContent = await fs.readFile(envPath, 'utf-8');
      } catch {
        // File doesn't exist, will create new one
      }

      // Update or add LETTA_AGENT_ID
      const lines = envContent.split('\n');
      let updated = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('LETTA_AGENT_ID=')) {
          lines[i] = `LETTA_AGENT_ID=${agentId}`;
          updated = true;
          break;
        }
      }

      if (!updated) {
        lines.push(`LETTA_AGENT_ID=${agentId}`);
      }

      await fs.writeFile(envPath, lines.join('\n'));
      logger.info('Agent ID saved to .env file', { agentId });

    } catch (error) {
      logger.warn('Could not save agent ID to .env file', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testAgent(): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not set up. Run setupAgent() first.');
    }

    try {
      logger.info('Testing Catfish agent...');

      const response = await this.client.agents.messages.create(this.agentId, {
        messages: [{
          role: 'user',
          content: 'Hello! I\'m testing the Catfish screen assistant. Can you tell me about your capabilities?'
        }]
      });

      // Extract assistant response
      for (const msg of response.messages) {
        if (msg.messageType === 'assistant_message') {
          logger.info('Agent test successful', {
            response: msg.content
          });
          console.log('\n🐟 Catfish Agent Response:');
          console.log(msg.content);
          return;
        }
      }

      logger.warn('No assistant message found in response');

    } catch (error) {
      logger.error('Agent test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async listAgents(): Promise<void> {
    try {
      const agents = await this.client.agents.list();
      
      console.log('\n📋 Available Letta Agents:');
      agents.forEach(agent => {
        console.log(`- ${agent.name} (${agent.id})`);
        if (agent.id === this.agentId) {
          console.log('  ⭐ This is your Catfish agent');
        }
      });

    } catch (error) {
      logger.error('Failed to list agents', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Main execution
async function main() {
  try {
    const catfish = new CatfishAgent();
    
    console.log('🐟 Setting up Catfish AI Assistant with Letta Cloud...\n');
    
    const agentId = await catfish.setupAgent();
    
    console.log(`✅ Catfish agent created successfully!`);
    console.log(`📝 Agent ID: ${agentId}`);
    console.log(`🔧 Agent ID saved to root .env file\n`);
    
    // Test the agent
    await catfish.testAgent();
    
    // List all agents
    await catfish.listAgents();
    
    console.log('\n🚀 Your Catfish agent is ready to use!');
    console.log('💡 Make sure to set LETTA_API_KEY in your .env file');
    console.log('🔄 The server will now use Letta Cloud instead of local agent');

  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Handle tool execution (this would be called by Letta when tools are invoked)
export async function handleToolExecution(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'catfish_ocr':
      return await performOCR(args.image_data);
    
    case 'catfish_stt':
      return await transcribeAudio(args.audio_data);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CatfishAgent }; 