import OpenAI from 'openai';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

interface SttInput {
  audio: string; // base64 encoded audio
  options?: {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
  };
}

interface SttOutput {
  transcript: string;
  language?: string;
  confidence?: number;
  duration?: number;
}

export class SttTool {
  name = 'stt';
  description = 'Transcribe audio to text using OpenAI Whisper API with language detection';
  
  async run({ audio, options = {} }: SttInput): Promise<SttOutput> {
    let tempFilePath: string | null = null;
    
    try {
      // Initialize OpenAI client when needed
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const model = options.model || 'whisper-1';
      
      console.log('Starting speech-to-text transcription with model:', model);

      // Convert base64 audio to temporary file
      let audioBuffer: Buffer;
      if (audio.startsWith('data:audio/')) {
        const base64Data = audio.split(',')[1];
        audioBuffer = Buffer.from(base64Data, 'base64');
      } else {
        audioBuffer = Buffer.from(audio, 'base64');
      }

      // Create temporary file for Whisper API
      tempFilePath = join(tmpdir(), `catfish-audio-${Date.now()}.webm`);
      writeFileSync(tempFilePath, audioBuffer);

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: require('fs').createReadStream(tempFilePath),
        model: model,
        language: options.language || undefined,
        prompt: options.prompt || undefined,
        temperature: options.temperature || 0,
        response_format: 'verbose_json'
      });

      console.log(`STT completed: transcribed "${transcription.text}" in ${transcription.duration}s`);

      return {
        transcript: transcription.text || '',
        language: transcription.language || undefined,
        duration: transcription.duration || undefined
      };

    } catch (error) {
      console.error('Speech-to-text processing failed:', error);
      
      // Return empty result on error rather than throwing
      return {
        transcript: '',
        language: undefined,
        duration: undefined
      };
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Failed to clean up temporary audio file:', cleanupError);
        }
      }
    }
  }
}

// Default export function for use in agent setup
export default async function transcribeAudio(audio: string, options = {}): Promise<SttOutput> {
  const tool = new SttTool();
  return tool.run({ audio, options });
} 