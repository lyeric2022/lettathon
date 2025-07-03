import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LlmInput {
  prompt: string;
  context?: {
    screenText?: string;
    transcript?: string;
    clipboard?: string;
    analysis?: any;
  };
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
  };
}

interface LlmOutput {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LlmTool {
  name = 'llm';
  description = 'Generate intelligent responses using OpenAI GPT models with context awareness';
  
  async run({ prompt, context = {}, options = {} }: LlmInput): Promise<LlmOutput> {
    try {
      const model = options.model || 'gpt-4';
      const temperature = options.temperature || 0.7;
      const max_tokens = options.max_tokens || 300;

      // Enhanced system prompt for overlay assistant
      const systemPrompt = options.system_prompt || `You are Catfish, an intelligent AI overlay assistant that helps users with their screen content, audio, and clipboard data. 

Your responses should be:
- Concise and actionable (under 300 characters when possible)
- Contextually aware of what the user is seeing/doing
- Helpful and friendly
- Focused on practical assistance

If you see code, help debug or explain it. If you see documents, help with content. If you hear speech, respond appropriately. Always be proactive in offering relevant suggestions.`;

      console.log('Calling OpenAI API with model:', model);

      const completion = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const response = completion.choices[0]?.message?.content || '';
      
      console.log(`LLM response generated: ${response.length} characters`);

      return {
        response,
        model,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined
      };

    } catch (error) {
      console.error('LLM processing failed:', error);
      
      // Provide a fallback response
      const fallbackResponse = context.transcript 
        ? `I heard you say "${context.transcript}" but I'm having trouble processing your request right now. Please try again.`
        : "I'm having trouble processing your request right now. Please try again or check your internet connection.";

      return {
        response: fallbackResponse,
        model: options.model || 'fallback'
      };
    }
  }
} 