import { app, BrowserWindow, globalShortcut, screen, desktopCapturer, ipcMain, shell, clipboard } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import keytar from 'keytar';
import Store from 'electron-store';
import recorder from 'node-record-lpcm16';
import { Readable } from 'stream';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize store - explicitly cast to bypass TypeScript issues
const store = new Store() as any;

// Import types
import type { BrowserWindow as BrowserWindowType, IpcMainInvokeEvent, WebContents } from 'electron';

class CatfishApp {
  private mainWindow: BrowserWindowType | null = null;
  private overlayWindow: BrowserWindowType | null = null;
  private overlayBounds: { x: number; y: number; width: number; height: number } | null = null;
  private isRecording: boolean = false;
  private recordingStream: any = null;
  private recordingBuffer: Buffer[] = [];

  constructor() {
    this.setupApp();
  }

  private async setupApp(): Promise<void> {
    // Handle app ready
    app.whenReady().then(async () => {
      // Create main window for setup and main app
      this.createMainWindow();
      
      // Create overlay window on startup
      this.overlayWindow = this.createOverlayWindow();
      
      // Show overlay with intro message after it's ready
      this.overlayWindow.once('ready-to-show', () => {
        console.log('🐟 Overlay ready-to-show event fired');
        this.overlayWindow?.show();
        
        this.overlayWindow?.webContents.once('did-finish-load', () => {
          console.log('🐟 Overlay webContents finished loading');
          // Add a longer delay to ensure React component is fully mounted
          setTimeout(() => {
            const introMessage = `# Welcome to Catfish

Your AI assistant is ready to help!

**Quick Start:**
• Press **⌘⇧A** (Mac) or **Ctrl⇧A** (Windows/Linux) to activate
• Start recording to ask questions with voice
• I can analyze your screen and help with any task

**Features:**
• Voice commands
• Screen analysis  
• Clipboard integration
• Instant assistance

Press **⌘⇧A** to get started!`;
            
            console.log('🐟 Sending intro message to overlay...');
            this.overlayWindow?.webContents.send('display-content', introMessage);
            console.log('🐟 Intro message sent');
          }, 500); // Increased delay from 200ms to 500ms
        });
      });
      
      await this.registerShortcuts();
      await this.setupIPC();
      autoUpdater.checkForUpdatesAndNotify();
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // Create main window on activate if none exists
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_event: any, contents: WebContents) => {
      contents.setWindowOpenHandler(({ url }: { url: string }) => {
        // Prevent opening new windows
        return { action: 'deny' as const };
      });
    });
  }

  private createMainWindow(): void {
    // This method is no longer used, but keeping it in case needed later
    console.log('🐟 Creating main window...');
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      vibrancy: 'under-window',
      transparent: true,
      show: false,
    });

    console.log('🐟 Main window created, loading content...');

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      console.log('🐟 Loading development URL: http://localhost:3000');
      this.mainWindow!.loadURL('http://localhost:3000');
      // Don't auto-open DevTools - let user open manually if needed
      
      // Add navigation tracking
      this.mainWindow!.webContents.on('will-navigate', (event, navigationUrl) => {
        console.log('🐟 Window will navigate to:', navigationUrl);
      });
      
      this.mainWindow!.webContents.on('did-navigate', (event, navigationUrl) => {
        console.log('🐟 Window did navigate to:', navigationUrl);
      });
      
      this.mainWindow!.webContents.on('did-navigate-in-page', (event, navigationUrl) => {
        console.log('🐟 Window did navigate in page to:', navigationUrl);
      });
    } else {
      console.log('🐟 Loading production file:', join(__dirname, '../renderer/index.html'));
      this.mainWindow!.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Add more detailed event logging
    this.mainWindow!.webContents.on('did-start-loading', () => {
      console.log('🐟 WebContents: Started loading');
    });

    this.mainWindow!.webContents.on('did-stop-loading', () => {
      console.log('🐟 WebContents: Stopped loading');
    });

    this.mainWindow!.webContents.on('did-finish-load', () => {
      console.log('🐟 WebContents: Finished loading');
    });

    this.mainWindow!.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('🐟 WebContents: Failed to load:', errorCode, errorDescription);
    });

    this.mainWindow!.webContents.on('dom-ready', () => {
      console.log('🐟 WebContents: DOM ready');
      console.log('🐟 Current URL:', this.mainWindow!.webContents.getURL());
      
      // If we accidentally loaded the overlay, reload the main app
      const currentURL = this.mainWindow!.webContents.getURL();
      if (currentURL.includes('/overlay') || currentURL.includes('overlay.html')) {
        console.log('🐟 ERROR: Main window loaded overlay! Redirecting to main app...');
        this.mainWindow!.loadURL('http://localhost:3000');
      }
    });

    this.mainWindow!.once('ready-to-show', () => {
      console.log('🐟 Window ready to show - displaying now');
      this.mainWindow?.show();
    });

    this.mainWindow!.on('closed', () => {
      console.log('🐟 Main window closed');
      this.mainWindow = null;
    });
  }

  private createOverlayWindow(): BrowserWindowType {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    console.log('🐟 Primary display work area:', { width, height });
    
    // Use saved bounds if available, otherwise use default dimensions
    let overlayWidth: number;
    let overlayHeight: number;
    let overlayX: number;
    let overlayY: number;
    
    if (this.overlayBounds) {
      // Use saved position and size
      overlayWidth = this.overlayBounds.width;
      overlayHeight = this.overlayBounds.height;
      overlayX = this.overlayBounds.x;
      overlayY = this.overlayBounds.y;
      console.log('🐟 Using saved overlay bounds:', this.overlayBounds);
    } else {
      // Calculate default overlay dimensions: 75% width, 1/3 height
      overlayWidth = Math.floor(width * 0.75);
      overlayHeight = Math.floor(height * 0.5);
      
      // Position at center top with some margin
      overlayX = Math.floor((width - overlayWidth) / 2);
      overlayY = 20; // 20px from top
      console.log('🐟 Using default overlay bounds:', { overlayWidth, overlayHeight, overlayX, overlayY });
    }
    
    const overlay = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x: overlayX,
      y: overlayY,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: true,
      movable: true,
      minimizable: false,
      maximizable: false,
      skipTaskbar: true,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
      },
    });

    // Set overlay to be visible on all workspaces (macOS specific)
    if (process.platform === 'darwin') {
      overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      console.log('🐟 Set overlay visible on all workspaces (macOS)');
    }

    if (process.env.NODE_ENV === 'development') {
      overlay.loadURL('http://localhost:3000/overlay.html');
    } else {
      overlay.loadFile(join(__dirname, '../renderer/overlay.html'));
    }

    console.log('🐟 Overlay window created with bounds:', overlay.getBounds());

    // Save bounds when window is moved or resized
    overlay.on('moved', () => {
      const bounds = overlay.getBounds();
      this.overlayBounds = bounds;
      console.log('🐟 Overlay moved, saved bounds:', bounds);
    });

    overlay.on('resized', () => {
      const bounds = overlay.getBounds();
      this.overlayBounds = bounds;
      console.log('🐟 Overlay resized, saved bounds:', bounds);
    });

    // Save bounds when window is closed
    overlay.on('closed', () => {
      if (!overlay.isDestroyed()) {
        const bounds = overlay.getBounds();
        this.overlayBounds = bounds;
        console.log('🐟 Overlay closed, saved bounds:', bounds);
      }
    });

    // Show overlay on startup
    overlay.once('ready-to-show', () => {
      overlay.show();
    });

    return overlay;
  }

  private async registerShortcuts(): Promise<void> {
    const shortcut = store.get('hotkey', 'CommandOrControl+Shift+A') as string;
    
    globalShortcut.register(shortcut, () => {
      this.activateAssistant();
    });
    
    // Microphone toggle shortcut
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      this.toggleMicrophone();
    });
    
    // Toggle overlay visibility
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      this.toggleOverlay();
    });
    
    // Debug shortcut to reload main app
    globalShortcut.register('CommandOrControl+Shift+R', () => {
      console.log('🐟 Force reloading main app...');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.loadURL('http://localhost:3000');
      }
    });
  }

  private async setupIPC(): Promise<void> {
    // Capture screenshot
    ipcMain.handle('capture-screen', () => {
      return this.captureScreen();
    });

    // Store API key securely
    ipcMain.handle('store-api-key', async (_event: IpcMainInvokeEvent, apiKey: string) => {
      try {
        await keytar.setPassword('catfish-assistant', 'letta-api-key', apiKey);
        return true;
      } catch (error) {
        console.error('Failed to store API key:', error);
        throw error;
      }
    });

    // Retrieve API key
    ipcMain.handle('get-api-key', async (_event: IpcMainInvokeEvent) => {
      try {
        return await keytar.getPassword('catfish-assistant', 'letta-api-key');
      } catch (error) {
        console.error('Failed to retrieve API key:', error);
        return null;
      }
    });

    // Show/hide overlay
    ipcMain.handle('show-overlay', (_event: IpcMainInvokeEvent, content: string) => {
      console.log('🐟 show-overlay called with content length:', content.length);
      console.log('🐟 Overlay window exists:', !!this.overlayWindow);
      console.log('🐟 Overlay window destroyed:', this.overlayWindow?.isDestroyed());
      
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        console.log('🐟 Sending content to existing overlay...');
        console.log('🐟 Overlay window visible before show():', this.overlayWindow.isVisible());
        console.log('🐟 Overlay window bounds:', this.overlayWindow.getBounds());
        
        // Ensure the webContents is ready
        if (this.overlayWindow.webContents.isLoading()) {
          console.log('🐟 Overlay webContents is still loading, waiting...');
          this.overlayWindow.webContents.once('did-finish-load', () => {
            console.log('🐟 Overlay webContents finished loading, sending content after delay...');
            // Add small delay to ensure React component is mounted
            setTimeout(() => {
              this.overlayWindow?.webContents.send('display-content', content);
              console.log('🐟 Content sent to overlay');
            }, 100);
          });
        } else {
          console.log('🐟 Overlay webContents is ready, sending content after delay...');
          // Add small delay to ensure React component is mounted
          setTimeout(() => {
            this.overlayWindow?.webContents.send('display-content', content);
            console.log('🐟 Content sent to overlay');
          }, 100);
        }
        
        this.overlayWindow.show();
        console.log('🐟 Overlay window visible after show():', this.overlayWindow.isVisible());
        console.log('🐟 Overlay window focused:', this.overlayWindow.isFocused());
      } else {
        console.log('🐟 Creating new overlay window...');
        this.overlayWindow = this.createOverlayWindow();
        this.overlayWindow.once('ready-to-show', () => {
          console.log('🐟 New overlay ready - sending content and showing...');
          console.log('🐟 New overlay bounds:', this.overlayWindow?.getBounds());
          
          // Wait for webContents to be ready
          this.overlayWindow?.webContents.once('did-finish-load', () => {
            console.log('🐟 New overlay webContents finished loading, sending content after delay...');
            // Add small delay to ensure React component is mounted
            setTimeout(() => {
              this.overlayWindow?.webContents.send('display-content', content);
              console.log('🐟 Content sent to new overlay');
              this.overlayWindow?.show();
              console.log('🐟 New overlay visible after show():', this.overlayWindow?.isVisible());
            }, 100);
          });
        });
      }
      // No auto-hide - overlay stays visible until manually toggled
    });

    // Toggle overlay visibility
    ipcMain.handle('toggle-overlay', () => {
      this.toggleOverlay();
    });

    // Window resize handlers
    ipcMain.handle('resize-window', (_event: IpcMainInvokeEvent, width: number, height: number) => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setSize(width, height);
        // Save the new bounds
        const bounds = this.overlayWindow.getBounds();
        this.overlayBounds = bounds;
        console.log('🐟 Overlay resized via IPC, saved bounds:', bounds);
      }
    });

    // Get app settings
    ipcMain.handle('get-settings', (_event: IpcMainInvokeEvent) => {
      return store.store;
    });

    // Update app settings
    ipcMain.handle('update-settings', (_event: IpcMainInvokeEvent, settings: any) => {
      for (const [key, value] of Object.entries(settings)) {
        store.set(key, value);
      }
      return true;
    });

    // Open external URLs
    ipcMain.handle('open-external', async (_event: IpcMainInvokeEvent, url: string) => {
      await shell.openExternal(url);
    });

    // Audio recording handlers
    ipcMain.handle('start-recording', async () => {
      return this.startRecording();
    });

    ipcMain.handle('stop-recording', async () => {
      return this.stopRecording();
    });

    ipcMain.handle('is-recording', async () => {
      return this.isRecording;
    });

    // Toggle microphone (start/stop based on current state)
    ipcMain.handle('toggle-microphone', async () => {
      await this.toggleMicrophone();
      return this.isRecording;
    });

    // Process assistant request
    ipcMain.handle('process-assistant-request', async (_event: IpcMainInvokeEvent, data: any) => {
      try {
        console.log('🐟 Main process handling assistant request...');
        
        const response = await fetch('http://localhost:3001/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-token-for-local-development'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🐟 Assistant request completed successfully');
        console.log('🐟 Result structure:', {
          success: result.success,
          hasResult: !!result.result,
          resultType: typeof result.result,
          hasAnswer: !!result.result?.answer,
          answerLength: result.result?.answer?.length || 0
        });
        return result;
      } catch (error) {
        console.error('🐟 Assistant request failed in main process:', error);
        throw error;
      }
    });
  }

  private toggleOverlay(): void {
    console.log('🐟 Toggle overlay called...');
    
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      if (this.overlayWindow.isVisible()) {
        console.log('🐟 Hiding overlay...');
        this.overlayWindow.hide();
      } else {
        console.log('🐟 Showing overlay...');
        this.overlayWindow.show();
      }
    } else {
      console.log('🐟 No overlay window exists, creating one...');
      this.overlayWindow = this.createOverlayWindow();
      this.overlayWindow.once('ready-to-show', () => {
        console.log('🐟 New overlay ready - showing...');
        this.overlayWindow?.show();
      });
    }
  }

  private async toggleMicrophone(): Promise<void> {
    console.log('🎤 Microphone toggle called...');
    
    // Check if audio is enabled in settings
    const settings = store.store;
    const audioEnabled = settings.enableAudio !== false; // Default to true if not set
    
    if (!audioEnabled) {
      console.log('🎤 Audio recording is disabled in settings');
      // Show a brief message in overlay
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.webContents.send('display-content', 'Audio recording is disabled. Enable it in settings to use microphone features.');
        this.overlayWindow.show();
      } else {
        this.overlayWindow = this.createOverlayWindow();
        this.overlayWindow.once('ready-to-show', () => {
          this.overlayWindow?.webContents.send('display-content', 'Audio recording is disabled. Enable it in settings to use microphone features.');
          this.overlayWindow?.show();
        });
      }
      return;
    }
    
    if (this.isRecording) {
      // Stop recording
      console.log('🎤 Stopping recording via microphone toggle...');
      const audioData = await this.stopRecording();
      
      if (audioData) {
        // Show recording stopped message
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.webContents.send('display-content', 'Recording stopped. Press Cmd+Shift+A to process with screen capture.');
          this.overlayWindow.show();
        }
      } else {
        // Show error message
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.webContents.send('display-content', 'Recording stopped but no audio data captured.');
          this.overlayWindow.show();
        }
      }
    } else {
      // Start recording
      console.log('🎤 Starting recording via microphone toggle...');
      const recordingStarted = await this.startRecording();
      
      if (recordingStarted) {
        // Show recording indicator in existing overlay or create new one
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.webContents.send('display-content', 'Recording... Press Ctrl+Shift+M to stop or Cmd+Shift+A to process');
          this.overlayWindow.show();
        } else {
          this.overlayWindow = this.createOverlayWindow();
          this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow?.webContents.send('display-content', 'Recording... Press Ctrl+Shift+M to stop or Cmd+Shift+A to process');
            this.overlayWindow?.show();
          });
        }
      } else {
        // Show error message
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.webContents.send('display-content', 'Error: Failed to start audio recording. Please check your microphone permissions.');
          this.overlayWindow.show();
        } else {
          this.overlayWindow = this.createOverlayWindow();
          this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow?.webContents.send('display-content', 'Error: Failed to start audio recording. Please check your microphone permissions.');
            this.overlayWindow?.show();
          });
        }
      }
    }
  }

  private async activateAssistant(): Promise<void> {
    console.log('🐟 Assistant activation started...');
    
    // If currently recording, stop recording and process
    if (this.isRecording) {
      console.log('🐟 Recording in progress, stopping and processing...');
      
      try {
        // Show loading overlay (keep existing overlay if present)
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          console.log('🐟 Using existing overlay for loading...');
          if (this.overlayWindow.webContents.isLoading()) {
            console.log('🐟 Overlay is loading, waiting to send show-loading...');
            this.overlayWindow.webContents.once('did-finish-load', () => {
              setTimeout(() => {
                this.overlayWindow?.webContents.send('show-loading');
                console.log('🐟 show-loading sent to overlay');
              }, 100);
            });
          } else {
            setTimeout(() => {
              this.overlayWindow?.webContents.send('show-loading');
              console.log('🐟 show-loading sent to overlay');
            }, 100);
          }
          this.overlayWindow.show();
        } else {
          console.log('🐟 Creating new overlay window for loading...');
          this.overlayWindow = this.createOverlayWindow();
          this.overlayWindow.once('ready-to-show', () => {
            console.log('🐟 New overlay ready - sending show-loading and displaying...');
            this.overlayWindow?.webContents.once('did-finish-load', () => {
              setTimeout(() => {
                this.overlayWindow?.webContents.send('show-loading');
                console.log('🐟 show-loading sent to new overlay');
                this.overlayWindow?.show();
              }, 100);
            });
          });
        }

        // Stop recording and get audio data
        const audioData = await this.stopRecording();
        console.log('🐟 Audio recording stopped, data available:', !!audioData);

        // Capture screenshot
        console.log('🐟 Starting screen capture...');
        let screenshot = '';
        try {
          screenshot = await this.captureScreen();
          console.log('🐟 Screen capture completed, size:', screenshot.length, 'characters');
        } catch (error) {
          console.error('🐟 Screen capture failed:', error);
          // Continue without screenshot - we still have audio and clipboard
          screenshot = '';
          console.log('🐟 Continuing without screenshot due to capture failure');
        }
        
        // Get clipboard content
        console.log('🐟 Reading clipboard content...');
        const clipboardContent = clipboard.readText();
        console.log('🐟 Clipboard content length:', clipboardContent.length, 'characters');

        // Process the request directly here instead of sending to main window
        console.log('🐟 Processing assistant request directly...');
        
        try {
          const response = await fetch('http://localhost:3001/api/assistant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer dev-token-for-local-development'
            },
            body: JSON.stringify({
              screenshot,
              clipboard: clipboardContent,
              audio: audioData,
              timestamp: Date.now()
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          console.log('🐟 Assistant request completed successfully');
          console.log('🐟 Result structure:', {
            success: result.success,
            hasResult: !!result.result,
            resultType: typeof result.result,
            hasAnswer: !!result.result?.answer,
            answerLength: result.result?.answer?.length || 0
          });
          
          // Show the response in overlay
          let responseText = '';
          if (result.success && result.result && result.result.answer) {
            responseText = result.result.answer;
          } else if (result.result && typeof result.result === 'string') {
            responseText = result.result;
          } else if (result.answer) {
            responseText = result.answer;
          } else {
            responseText = 'Processing completed but no response text found.';
          }
          
          console.log('🐟 Extracted response text:', responseText.substring(0, 100) + '...');
          
          // Display the response
          if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            console.log('🐟 Showing response in overlay...');
            if (this.overlayWindow.webContents.isLoading()) {
              this.overlayWindow.webContents.once('did-finish-load', () => {
                setTimeout(() => {
                  this.overlayWindow?.webContents.send('display-content', responseText);
                  console.log('🐟 Response sent to overlay');
                }, 100);
              });
            } else {
              setTimeout(() => {
                this.overlayWindow?.webContents.send('display-content', responseText);
                console.log('🐟 Response sent to overlay');
              }, 100);
            }
          }
          
        } catch (error) {
          console.error('🐟 Assistant request failed:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.send('display-content', `Error: ${errorMessage}`);
          }
        }

      } catch (error) {
        console.error('🐟 Assistant activation failed:', error);
        console.error('🐟 Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.overlayWindow.webContents.send('display-content', `Error: Failed to activate assistant - ${errorMessage}`);
        }
      }
    } else {
      // Start recording
      console.log('🐟 Starting recording mode...');
      
      const recordingStarted = await this.startRecording();
      
      if (recordingStarted) {
        // Show recording indicator overlay (keep existing overlay if present)
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          console.log('🐟 Using existing overlay for recording indicator...');
          this.overlayWindow.webContents.send('display-content', 'Recording... Press ⌘⇧A again to stop and process');
          this.overlayWindow.show();
        } else {
          console.log('🐟 Creating recording indicator overlay...');
          this.overlayWindow = this.createOverlayWindow();
          this.overlayWindow.once('ready-to-show', () => {
            console.log('🐟 Recording overlay ready - showing recording indicator...');
            this.overlayWindow?.webContents.send('display-content', 'Recording... Press ⌘⇧A again to stop and process');
            this.overlayWindow?.show();
          });
        }
      } else {
        console.error('🐟 Failed to start recording');
        // Show error overlay
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.webContents.send('display-content', 'Error: Failed to start audio recording. Please check your microphone permissions.');
          this.overlayWindow.show();
        } else {
          this.overlayWindow = this.createOverlayWindow();
          this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow?.webContents.send('display-content', 'Error: Failed to start audio recording. Please check your microphone permissions.');
            this.overlayWindow?.show();
          });
        }
      }
    }
  }

  private async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      console.log('🎤 Already recording, ignoring start request');
      return false;
    }

    try {
      console.log('🎤 Starting audio recording...');
      
      // Clear previous recording buffer
      this.recordingBuffer = [];
      
      // Create recording instance
      this.recordingStream = recorder.record({
        sampleRate: 16000,
        channels: 1,
        compress: false,
        threshold: 0.5,
        thresholdStart: undefined,
        thresholdEnd: undefined,
        silence: '1.0',
        verbose: false,
        recordProgram: 'sox', // or 'rec' on some systems
      });

      // Set up data collection
      this.recordingStream.stream().on('data', (chunk: Buffer) => {
        this.recordingBuffer.push(chunk);
      });

      this.recordingStream.stream().on('error', (err: Error) => {
        console.error('🎤 Recording stream error:', err);
        this.isRecording = false;
        this.notifyRecordingStatusChanged();
      });

      // Start recording
      this.recordingStream.start();
      this.isRecording = true;
      
      console.log('🎤 Recording started successfully');
      this.notifyRecordingStatusChanged();
      
      return true;
    } catch (error) {
      console.error('🎤 Failed to start recording:', error);
      this.isRecording = false;
      this.notifyRecordingStatusChanged();
      return false;
    }
  }

  private async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      console.log('🎤 Not recording, ignoring stop request');
      return null;
    }

    try {
      console.log('🎤 Stopping audio recording...');
      
      // Stop the recording
      if (this.recordingStream) {
        this.recordingStream.stop();
        this.recordingStream = null;
      }
      
      this.isRecording = false;
      this.notifyRecordingStatusChanged();
      
      // Combine all audio chunks
      if (this.recordingBuffer.length === 0) {
        console.log('🎤 No audio data recorded');
        return null;
      }
      
      const audioBuffer = Buffer.concat(this.recordingBuffer);
      
      // Convert raw PCM to WAV format
      const wavBuffer = this.convertPCMToWAV(audioBuffer, 16000, 1);
      const audioBase64 = wavBuffer.toString('base64');
      
      // Format as data URL for server validation
      const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;
      
      console.log('🎤 Recording stopped, audio data size:', audioBuffer.length, 'bytes');
      
      // Clear buffer
      this.recordingBuffer = [];
      
      return audioDataUrl;
    } catch (error) {
      console.error('🎤 Failed to stop recording:', error);
      this.isRecording = false;
      this.notifyRecordingStatusChanged();
      return null;
    }
  }

  private notifyRecordingStatusChanged(): void {
    // Notify all windows about recording status change
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('recording-status-changed', this.isRecording);
    }
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('recording-status-changed', this.isRecording);
    }
  }

  private convertPCMToWAV(pcmBuffer: Buffer, sampleRate: number, channels: number): Buffer {
    // WAV file header structure
    const dataLength = pcmBuffer.length;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const buffer = Buffer.alloc(totalLength);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(totalLength - 8, 4);
    buffer.write('WAVE', 8);
    
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
    buffer.writeUInt16LE(channels * 2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample
    
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    
    // Copy PCM data
    pcmBuffer.copy(buffer, headerLength);
    
    return buffer;
  }

  private async captureScreen(): Promise<string> {
    try {
      console.log('🐟 Capturing all screens...');
      
      // Get all displays
      const displays = screen.getAllDisplays();
      console.log('🐟 Found', displays.length, 'display(s)');
      console.log('🐟 Display details:', displays.map(d => ({ id: d.id, bounds: d.bounds, scaleFactor: d.scaleFactor })));
      
      // Capture all screens
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 2560, height: 1440 } // Higher resolution for better OCR
      });
      
      console.log('🐟 Found', sources.length, 'screen source(s)');
      console.log('🐟 Source details:', sources.map(s => ({ name: s.name, id: s.id })));
      
      if (sources.length === 0) {
        throw new Error('No screen sources found');
      }
      
      let selectedSource;
      
      // If only one screen, return it directly
      if (sources.length === 1) {
        console.log('🐟 Single screen captured');
        selectedSource = sources[0];
      } else {
        // For multiple screens, we'll use the primary display for now
        // TODO: In the future, we could composite all screens or let user choose
        selectedSource = sources.find(source => source.name.includes('Entire Screen')) || sources[0];
        console.log('🐟 Using primary screen:', selectedSource.name);
      }
      
      // Validate the thumbnail
      if (!selectedSource.thumbnail || selectedSource.thumbnail.isEmpty()) {
        throw new Error('Screen capture returned empty thumbnail');
      }
      
      const dataUrl = selectedSource.thumbnail.toDataURL();
      console.log('🐟 Screenshot data URL length:', dataUrl.length);
      console.log('🐟 Screenshot data URL prefix:', dataUrl.substring(0, 100));
      
      // Validate the data URL
      if (!dataUrl.startsWith('data:image/')) {
        throw new Error('Invalid screenshot data format');
      }
      
      if (dataUrl.length < 1000) {
        throw new Error('Screenshot data too small, likely corrupted');
      }
      
      return dataUrl;
    } catch (error) {
      console.error('🐟 Screen capture failed:', error);
      throw error;
    }
  }
}

// Initialize the app
new CatfishApp(); 