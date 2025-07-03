import { app, BrowserWindow, globalShortcut, screen, desktopCapturer, ipcMain, shell, clipboard } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import keytar from 'keytar';
import Store from 'electron-store';

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

  constructor() {
    this.setupApp();
  }

  private async setupApp(): Promise<void> {
    // Handle app ready
    app.whenReady().then(async () => {
      this.createMainWindow();
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
      this.mainWindow!.webContents.openDevTools();
      
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
    
    const overlay = new BrowserWindow({
      width: 980,
      height: 600,
      x: width - 1000,
      y: 20,
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

    if (process.env.NODE_ENV === 'development') {
      overlay.loadURL('http://localhost:3000/overlay.html');
    } else {
      overlay.loadFile(join(__dirname, '../renderer/overlay.html'));
    }

    return overlay;
  }

  private async registerShortcuts(): Promise<void> {
    const shortcut = store.get('hotkey', 'CommandOrControl+Shift+A') as string;
    
    globalShortcut.register(shortcut, () => {
      this.activateAssistant();
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
    ipcMain.handle('capture-screen', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        });
        
        if (sources.length > 0) {
          return sources[0].thumbnail.toDataURL();
        }
        throw new Error('No screen sources found');
      } catch (error) {
        console.error('Screen capture failed:', error);
        throw error;
      }
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
      
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        console.log('🐟 Sending content to existing overlay...');
        this.overlayWindow.webContents.send('display-content', content);
      } else {
        console.log('🐟 Creating new overlay window...');
        this.overlayWindow = this.createOverlayWindow();
        this.overlayWindow.once('ready-to-show', () => {
          console.log('🐟 New overlay ready - sending content and showing...');
          this.overlayWindow?.webContents.send('display-content', content);
          this.overlayWindow?.show();
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

  private async activateAssistant(): Promise<void> {
    console.log('🐟 Assistant activation started...');
    try {
      // Show loading overlay
      console.log('🐟 Closing existing overlay if present...');
      if (this.overlayWindow) {
        this.overlayWindow.close();
      }
      
      console.log('🐟 Creating new overlay window...');
      this.overlayWindow = this.createOverlayWindow();
      this.overlayWindow.once('ready-to-show', () => {
        console.log('🐟 Overlay ready - sending show-loading and displaying...');
        this.overlayWindow?.webContents.send('show-loading');
        this.overlayWindow?.show();
      });

      // Capture screenshot
      console.log('🐟 Starting screen capture...');
      const screenshot = await this.captureScreen();
      console.log('🐟 Screen capture completed, size:', screenshot.length, 'characters');
      
      // Get clipboard content
      console.log('🐟 Reading clipboard content...');
      const clipboardContent = clipboard.readText();
      console.log('🐟 Clipboard content length:', clipboardContent.length, 'characters');

      // Check if main window is available and ready
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        console.error('🐟 Main window is not available or destroyed');
        this.overlayWindow?.webContents.send('display-content', 'Error: Main window not available');
        return;
      }

      // Check if webContents is ready
      if (!this.mainWindow.webContents.isLoading() && this.mainWindow.webContents.getURL()) {
        console.log('🐟 Main window is ready, sending data to renderer...');
        console.log('🐟 Current URL:', this.mainWindow.webContents.getURL());
        
        // Send to renderer for processing
        this.mainWindow.webContents.send('process-assistant-request', {
          screenshot,
          clipboard: clipboardContent,
          timestamp: Date.now()
        });
        console.log('🐟 Data sent to renderer successfully');
      } else {
        console.error('🐟 Main window is not ready for communication');
        console.log('🐟 Window loading state:', this.mainWindow.webContents.isLoading());
        console.log('🐟 Window URL:', this.mainWindow.webContents.getURL());
        this.overlayWindow?.webContents.send('display-content', 'Error: Main window not ready. Please try again.');
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
  }

  private async captureScreen(): Promise<string> {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL();
    }
    throw new Error('No screen sources found');
  }
}

// Initialize the app
new CatfishApp(); 