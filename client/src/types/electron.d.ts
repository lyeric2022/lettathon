export interface ElectronAPI {
  // Screen capture
  captureScreen: () => Promise<string>;
  
  // API key management
  storeApiKey: (apiKey: string) => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  
  // Overlay management
  showOverlay: (content: string) => Promise<void>;
  toggleOverlay: () => Promise<void>;
  resizeWindow: (width: number, height: number) => Promise<void>;
  
  // Settings management
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<boolean>;
  
  // External links
  openExternal: (url: string) => Promise<void>;
  
  // Assistant request handling
  processAssistantRequest: (data: any) => Promise<any>;
  
  // Audio recording
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string | null>; // Returns base64 audio data
  isRecording: () => Promise<boolean>;
  
  // Event listeners (optional methods)
  onProcessAssistantRequest?: (callback: (data: any) => void) => void;
  onDisplayContent?: (callback: (content: string) => void) => void;
  onShowLoading?: (callback: () => void) => void;
  onToggleOverlay?: (callback: () => void) => void;
  onRecordingStatusChanged?: (callback: (isRecording: boolean) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 