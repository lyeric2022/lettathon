declare module 'node-record-lpcm16' {
  interface RecordingOptions {
    sampleRate?: number;
    channels?: number;
    compress?: boolean;
    threshold?: number;
    thresholdStart?: number;
    thresholdEnd?: number;
    silence?: string;
    verbose?: boolean;
    recordProgram?: string;
  }

  interface RecordingInstance {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    stream(): NodeJS.ReadableStream;
  }

  interface RecorderModule {
    record(options?: RecordingOptions): RecordingInstance;
  }

  const recorder: RecorderModule;
  export = recorder;
} 