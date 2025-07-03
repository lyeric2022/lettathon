import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

export async function performOCR(imageData: string): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    console.log('Starting OCR processing...');
    
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log(`OCR completed in ${processingTime}ms`);
    console.log(`Extracted text: "${result.data.text}"`);
    console.log(`Confidence: ${result.data.confidence}%`);
    
    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
      processingTime
    };
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 