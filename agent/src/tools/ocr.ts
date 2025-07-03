import Tesseract from 'tesseract.js';
import sharp from 'sharp';

interface OcrInput {
  image: string; // base64 encoded image
  options?: {
    lang?: string;
    preserve_interword_spaces?: string;
    psm?: string;
  };
}

interface OcrOutput {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox?: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export class OcrTool {
  name = 'ocr';
  description = 'Extract text from base64-encoded screenshots using Tesseract OCR with image preprocessing';
  
  async run({ image, options = {} }: OcrInput): Promise<OcrOutput> {
    try {
      // Default OCR options
      const ocrOptions = {
        logger: (m: any) => console.log(m),
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,-:;!?@#$%^&*()_+-=[]{}|\\<>/"\''
      };

      console.log('Starting OCR with options:', ocrOptions);

      // Convert base64 to buffer
      let imageBuffer: Buffer;
      if (image.startsWith('data:image/')) {
        const base64Data = image.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = Buffer.from(image, 'base64');
      }

      // Preprocess image for better OCR accuracy
      const processedImage = await sharp(imageBuffer)
        .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
        .grayscale()
        .normalize()
        .modulate({ brightness: 1.1 })
        .png()
        .toBuffer();

      // Perform OCR
      const worker = await Tesseract.createWorker('eng');
      
      // Set OCR parameters
      await worker.setParameters({
        preserve_interword_spaces: options.preserve_interword_spaces || '1',
      });

      const { data } = await worker.recognize(processedImage);

      await worker.terminate();

      // Extract word-level details
      const words = data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox ? {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        } : undefined
      })) || [];

      // Clean up the extracted text
      const cleanText = data.text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s.,!?;:()-]/g, '') // Remove unusual characters
        .trim();

      console.log(`OCR completed: extracted ${cleanText.length} characters with ${data.confidence}% confidence`);

      return {
        text: cleanText,
        confidence: data.confidence,
        words: words.filter(word => word.confidence > 30) // Filter low-confidence words
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      // Return empty result on error rather than throwing
      return {
        text: '',
        confidence: 0,
        words: []
      };
    }
  }
}

// Default export function for use in agent setup
export default async function performOCR(image: string, options = {}): Promise<OcrOutput> {
  const tool = new OcrTool();
  return tool.run({ image, options });
} 