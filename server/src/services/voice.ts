import Groq from 'groq-sdk';
import winston from 'winston';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'voice.log' })
  ]
});

interface VoiceTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
}

class VoiceService {
  private groq: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required for voice transcription');
    }

    this.groq = new Groq({ apiKey });
    logger.info('Voice service initialized with Groq API');
  }

  async transcribeAudio(audioData: string, options: {
    language?: string;
    model?: string;
    prompt?: string;
  } = {}): Promise<VoiceTranscriptionResult> {
    let tempFilePath: string | null = null;

    try {
      // Convert base64 audio to temporary file
      let audioBuffer: Buffer;
      if (audioData.startsWith('data:audio/')) {
        const base64Data = audioData.split(',')[1];
        audioBuffer = Buffer.from(base64Data, 'base64');
      } else {
        audioBuffer = Buffer.from(audioData, 'base64');
      }

      // Create temporary file for Groq API
      // Determine file extension based on audio data format
      let fileExtension = 'wav'; // Default to wav
      if (audioData.startsWith('data:audio/')) {
        const mimeType = audioData.split(';')[0].split(':')[1];
        if (mimeType.includes('webm')) {
          fileExtension = 'webm';
        } else if (mimeType.includes('mp3')) {
          fileExtension = 'mp3';
        } else if (mimeType.includes('m4a')) {
          fileExtension = 'm4a';
        }
        // Default to wav for other formats
      }
      
      tempFilePath = join(tmpdir(), `catfish-audio-${Date.now()}.${fileExtension}`);
      writeFileSync(tempFilePath, audioBuffer);

      logger.info('Starting audio transcription with Groq', {
        model: options.model || 'distil-whisper-large-v3-en',
        language: options.language,
        fileSize: audioBuffer.length
      });

      // Call Groq Whisper API
      const transcription = await this.groq.audio.transcriptions.create({
        file: require('fs').createReadStream(tempFilePath),
        model: options.model || 'distil-whisper-large-v3-en', // Fastest English-only model
        language: options.language || undefined,
        prompt: options.prompt || undefined,
        temperature: 0.0, // Deterministic output
        response_format: 'verbose_json'
      });

      logger.info('Audio transcription completed', {
        text: transcription.text.substring(0, 100) + '...',
        language: (transcription as any).language,
        duration: (transcription as any).duration
      });

      return {
        text: transcription.text || '',
        language: (transcription as any).language || undefined,
        duration: (transcription as any).duration || undefined,
        confidence: this.calculateConfidence(transcription as any)
      };

    } catch (error) {
      logger.error('Audio transcription failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty result on error rather than throwing
      return {
        text: '',
        language: undefined,
        duration: undefined,
        confidence: 0
      };

    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp file', { error: cleanupError });
        }
      }
    }
  }

  private calculateConfidence(transcription: any): number {
    // Calculate confidence based on avg_logprob from segments
    if (transcription.segments && transcription.segments.length > 0) {
      const avgLogProb = transcription.segments.reduce((sum: number, segment: any) => 
        sum + (segment.avg_logprob || -1), 0) / transcription.segments.length;
      
      // Convert log probability to confidence percentage
      // Values closer to 0 are better, -0.1 = ~90%, -0.5 = ~60%, -1.0 = ~37%
      return Math.max(0, Math.min(100, Math.exp(avgLogProb) * 100));
    }
    return 50; // Default confidence if no segments
  }

  async checkHealth(): Promise<{ status: string; details: any }> {
    try {
      // Simple health check - we can't easily test without audio file
      const apiKey = process.env.GROQ_API_KEY;
      return {
        status: 'healthy',
        details: {
          groq: 'configured',
          apiKey: apiKey ? 'present' : 'missing'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          groq: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Create singleton instance
let voiceServiceInstance: VoiceService | null = null;

function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

// Export functions
export async function transcribeAudio(audioData: string, options?: {
  language?: string;
  model?: string;
  prompt?: string;
}): Promise<VoiceTranscriptionResult> {
  const service = getVoiceService();
  return service.transcribeAudio(audioData, options);
}

export async function checkVoiceHealth(): Promise<{ status: string; details: any }> {
  try {
    const service = getVoiceService();
    return service.checkHealth();
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        groq: 'initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 