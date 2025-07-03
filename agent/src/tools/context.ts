// Context analysis tool for building enhanced prompts

interface ContextInput {
  screenText: string;
  transcript: string;
  clipboard: string;
  metadata?: {
    timestamp: number;
    hasVisualContent: boolean;
    hasAudioContent: boolean;
  };
}

interface ContextOutput {
  enhancedPrompt: string;
  analysis: {
    contentType: string;
    primaryContext: string;
    suggestedActions: string[];
    confidence: number;
  };
}

export class ContextTool {
  name = 'context';
  description = 'Analyze screen content, audio transcript, and clipboard to build comprehensive context for AI responses';
  
  async run({ 
    screenText, 
    transcript, 
    clipboard, 
    metadata = { 
      timestamp: Date.now(), 
      hasVisualContent: false, 
      hasAudioContent: false 
    } 
  }: ContextInput): Promise<ContextOutput> {
    try {
      console.log('Analyzing context with inputs:', {
        screenTextLength: screenText.length,
        transcriptLength: transcript.length,
        clipboardLength: clipboard.length,
        hasVisualContent: metadata.hasVisualContent,
        hasAudioContent: metadata.hasAudioContent
      });

      // Analyze content type and primary context
      const analysis = this.analyzeContent(screenText, transcript, clipboard);
      
      // Build enhanced prompt based on analysis
      const enhancedPrompt = this.buildEnhancedPrompt(screenText, transcript, clipboard, analysis);

      console.log('Context analysis completed:', {
        contentType: analysis.contentType,
        primaryContext: analysis.primaryContext,
        confidence: analysis.confidence
      });

      return {
        enhancedPrompt,
        analysis
      };

    } catch (error) {
      console.error('Context analysis failed:', error);
      
      // Return basic fallback context
      return {
        enhancedPrompt: this.buildBasicPrompt(screenText, transcript, clipboard),
        analysis: {
          contentType: 'unknown',
          primaryContext: 'general',
          suggestedActions: ['provide general assistance'],
          confidence: 0.1
        }
      };
    }
  }

  private analyzeContent(screenText: string, transcript: string, clipboard: string) {
    let contentType = 'general';
    let primaryContext = 'general assistance';
    let suggestedActions: string[] = [];
    let confidence = 0.5;

    // Analyze screen content
    if (screenText.length > 0) {
      // Check for code patterns
      if (this.isCode(screenText)) {
        contentType = 'code';
        primaryContext = 'code analysis and debugging';
        suggestedActions = ['explain code', 'find bugs', 'suggest improvements', 'add comments'];
        confidence = 0.8;
      }
      // Check for documentation/text
      else if (this.isDocument(screenText)) {
        contentType = 'document';
        primaryContext = 'document editing and analysis';
        suggestedActions = ['improve writing', 'check grammar', 'summarize content', 'suggest edits'];
        confidence = 0.7;
      }
      // Check for data/tables
      else if (this.isData(screenText)) {
        contentType = 'data';
        primaryContext = 'data analysis and interpretation';
        suggestedActions = ['analyze data', 'find patterns', 'suggest visualizations', 'explain trends'];
        confidence = 0.7;
      }
      // Check for error messages
      else if (this.isError(screenText)) {
        contentType = 'error';
        primaryContext = 'error diagnosis and troubleshooting';
        suggestedActions = ['diagnose error', 'suggest fixes', 'explain cause', 'provide solutions'];
        confidence = 0.9;
      }
    }

    // Enhance with audio context
    if (transcript.length > 0) {
      if (this.isQuestion(transcript)) {
        suggestedActions.unshift('answer question');
        confidence = Math.min(confidence + 0.2, 1.0);
      }
      if (this.isCommand(transcript)) {
        suggestedActions.unshift('execute command');
        confidence = Math.min(confidence + 0.1, 1.0);
      }
    }

    // Enhance with clipboard context
    if (clipboard.length > 0) {
      if (this.isUrl(clipboard)) {
        suggestedActions.push('analyze URL');
      }
      if (this.isCode(clipboard)) {
        suggestedActions.push('analyze copied code');
      }
    }

    return {
      contentType,
      primaryContext,
      suggestedActions: [...new Set(suggestedActions)], // Remove duplicates
      confidence
    };
  }

  private buildEnhancedPrompt(screenText: string, transcript: string, clipboard: string, analysis: any): string {
    let prompt = `Context Analysis:
- Content Type: ${analysis.contentType}
- Primary Context: ${analysis.primaryContext}
- Suggested Actions: ${analysis.suggestedActions.join(', ')}

`;

    // Add screen content with context
    if (screenText.length > 0) {
      prompt += `Screen Content (${analysis.contentType}):\n${screenText}\n\n`;
    }

    // Add audio transcript with context
    if (transcript.length > 0) {
      prompt += `Audio Transcript:\n"${transcript}"\n\n`;
    }

    // Add clipboard content with context
    if (clipboard.length > 0) {
      prompt += `Clipboard Content:\n${clipboard}\n\n`;
    }

    // Add specific instructions based on content type
    prompt += this.getInstructionsForContentType(analysis.contentType);

    return prompt;
  }

  private buildBasicPrompt(screenText: string, transcript: string, clipboard: string): string {
    let prompt = 'Please analyze the following content and provide helpful assistance:\n\n';

    if (screenText.length > 0) {
      prompt += `Screen Content:\n${screenText}\n\n`;
    }

    if (transcript.length > 0) {
      prompt += `Audio Transcript:\n"${transcript}"\n\n`;
    }

    if (clipboard.length > 0) {
      prompt += `Clipboard Content:\n${clipboard}\n\n`;
    }

    prompt += 'Please provide concise, actionable assistance based on this context.';

    return prompt;
  }

  private getInstructionsForContentType(contentType: string): string {
    switch (contentType) {
      case 'code':
        return 'Focus on code analysis, debugging, and improvement suggestions. Be specific about potential issues and provide actionable fixes.';
      case 'document':
        return 'Focus on content improvement, grammar, clarity, and structure. Provide specific editing suggestions.';
      case 'data':
        return 'Focus on data interpretation, patterns, and insights. Suggest ways to analyze or visualize the data.';
      case 'error':
        return 'Focus on error diagnosis and resolution. Provide step-by-step troubleshooting guidance.';
      default:
        return 'Provide helpful, contextual assistance based on the content. Be concise and actionable.';
    }
  }

  // Content type detection helpers
  private isCode(text: string): boolean {
    const codePatterns = [
      /function\s+\w+\(/,
      /class\s+\w+/,
      /import\s+.*from/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /def\s+\w+\(/,
      /public\s+class/,
      /private\s+\w+/,
      /{[\s\S]*}/,
      /\[\s*\w+\s*\]/,
      /console\.log\(/,
      /print\(/,
      /if\s*\(.*\)\s*{/,
      /for\s*\(.*\)\s*{/,
      /while\s*\(.*\)\s*{/
    ];
    return codePatterns.some(pattern => pattern.test(text));
  }

  private isDocument(text: string): boolean {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.split(/\s+/).length;
    return sentences.length >= 2 && words >= 20 && !this.isCode(text);
  }

  private isData(text: string): boolean {
    const dataPatterns = [
      /\d+[\s,]\d+[\s,]\d+/,
      /\|\s*\w+\s*\|\s*\w+\s*\|/,
      /\w+:\s*\d+/,
      /\d+\.\d+%/,
      /\$\d+/,
      /\d{4}-\d{2}-\d{2}/
    ];
    return dataPatterns.some(pattern => pattern.test(text));
  }

  private isError(text: string): boolean {
    const errorPatterns = [
      /error:/i,
      /exception:/i,
      /failed/i,
      /cannot/i,
      /unable to/i,
      /not found/i,
      /permission denied/i,
      /syntax error/i,
      /undefined/i,
      /null pointer/i,
      /stack trace/i
    ];
    return errorPatterns.some(pattern => pattern.test(text));
  }

  private isQuestion(text: string): boolean {
    return text.trim().endsWith('?') || 
           text.toLowerCase().startsWith('what') ||
           text.toLowerCase().startsWith('how') ||
           text.toLowerCase().startsWith('why') ||
           text.toLowerCase().startsWith('when') ||
           text.toLowerCase().startsWith('where') ||
           text.toLowerCase().startsWith('can you');
  }

  private isCommand(text: string): boolean {
    const commandPatterns = [
      /^(show|open|close|create|delete|run|execute|help)/i,
      /^(explain|analyze|debug|fix|improve)/i,
      /^(find|search|look for)/i
    ];
    return commandPatterns.some(pattern => pattern.test(text.trim()));
  }

  private isUrl(text: string): boolean {
    try {
      new URL(text.trim());
      return true;
    } catch {
      return /^https?:\/\//.test(text.trim());
    }
  }
} 