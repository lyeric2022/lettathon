export interface ValidatedRequestData {
  screenshot?: string;
  audio?: string;
  clipboard?: string;
  timestamp: number;
}

export function validateRequestData(data: any): ValidatedRequestData {
  const validated: ValidatedRequestData = {
    timestamp: Date.now()
  };

  // Validate screenshot (base64 image data)
  if (data.screenshot) {
    if (typeof data.screenshot !== 'string') {
      throw new Error('Screenshot must be a string');
    }
    
    // Check if it's a valid base64 image
    if (!data.screenshot.match(/^data:image\/[a-z]+;base64,/)) {
      throw new Error('Screenshot must be a valid base64 image data URL');
    }
    
    validated.screenshot = data.screenshot;
  }

  // Validate audio (base64 audio data)
  if (data.audio) {
    if (typeof data.audio !== 'string') {
      throw new Error('Audio must be a string');
    }
    
    // Check if it's a valid base64 audio
    if (!data.audio.match(/^data:audio\/[a-z]+;base64,/)) {
      throw new Error('Audio must be a valid base64 audio data URL');
    }
    
    validated.audio = data.audio;
  }

  // Validate clipboard (plain text)
  if (data.clipboard) {
    if (typeof data.clipboard !== 'string') {
      throw new Error('Clipboard must be a string');
    }
    
    validated.clipboard = data.clipboard;
  }

  // Validate timestamp
  if (data.timestamp) {
    const timestamp = Number(data.timestamp);
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error('Timestamp must be a valid positive number');
    }
    validated.timestamp = timestamp;
  }

  return validated;
} 