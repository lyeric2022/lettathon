import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { SetupScreen } from './components/SetupScreen';
import { MainScreen } from './components/MainScreen';
import { OverlayScreen } from './components/OverlayScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { theme } from './theme';
import type { ElectronAPI } from '../types/electron';

type AppState = 'setup' | 'main' | 'settings';

export default function App() {
  console.log('🐟 React App component initializing...');
  
  const [appState, setAppState] = useState<AppState>('setup');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [overlayContent, setOverlayContent] = useState('');

  // Check for existing API key on startup
  useEffect(() => {
    console.log('🐟 React App useEffect triggered - checking setup...');
    checkExistingSetup();
    
    // Set up IPC listeners
    if (window.electronAPI?.onProcessAssistantRequest) {
      console.log('🐟 Setting up onProcessAssistantRequest listener...');
      window.electronAPI.onProcessAssistantRequest((data) => {
        console.log('🐟 Received process-assistant-request:', {
          screenshotLength: data.screenshot?.length || 0,
          clipboardLength: data.clipboard?.length || 0,
          timestamp: data.timestamp
        });
        handleAssistantRequest(data);
      });
    } else {
      console.warn('🐟 electronAPI.onProcessAssistantRequest not available');
    }
  }, []);

  const checkExistingSetup = async () => {
    console.log('🐟 checkExistingSetup starting...');
    try {
      console.log('🐟 Checking if window.electronAPI exists:', !!window.electronAPI);
      console.log('🐟 Checking if window.electronAPI.getApiKey exists:', !!window.electronAPI?.getApiKey);
      
      if (!window.electronAPI?.getApiKey) {
        console.warn('🐟 Electron API not available - running in browser mode');
        console.log('🐟 Setting app state to setup mode');
        setAppState('setup');
        return;
      }
      
      console.log('🐟 Calling window.electronAPI.getApiKey()...');
      const existingApiKey = await window.electronAPI.getApiKey();
      console.log('🐟 API key result:', existingApiKey ? 'Found existing key' : 'No existing key');
      
      if (existingApiKey) {
        console.log('🐟 Setting API key and switching to main state');
        setApiKey(existingApiKey);
        setAppState('main');
      } else {
        console.log('🐟 No API key found, staying in setup state');
        setAppState('setup');
      }
    } catch (error) {
      console.error('🐟 Failed to check existing setup:', error);
      console.log('🐟 Error occurred, setting to setup state');
      setAppState('setup');
    }
  };

  const handleSetupComplete = (newApiKey: string) => {
    setApiKey(newApiKey);
    setAppState('main');
  };

  const handleShowSettings = () => {
    setAppState('settings');
  };

  const handleBackToMain = () => {
    setAppState('main');
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
    setOverlayContent('');
  };

  const handleAssistantRequest = async (data: any) => {
    console.log('🐟 Processing assistant request...');
    console.log('🐟 Request data:', {
      screenshotLength: data.screenshot?.length || 0,
      clipboardLength: data.clipboard?.length || 0,
      timestamp: data.timestamp
    });
    
    try {
      console.log('🐟 Using IPC to process assistant request...');
      
      if (!window.electronAPI?.processAssistantRequest) {
        throw new Error('processAssistantRequest not available in electronAPI');
      }

      console.log('🐟 About to call processAssistantRequest...');
      const result = await window.electronAPI.processAssistantRequest(data);
      console.log('🐟 IPC request completed, got result:', result);
      console.log('🐟 Result type:', typeof result);
      console.log('🐟 Result keys:', Object.keys(result || {}));
      
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
      
      if (window.electronAPI?.showOverlay) {
        console.log('🐟 Showing response in overlay...');
        await window.electronAPI.showOverlay(responseText);
        console.log('🐟 Overlay shown successfully');
      } else {
        console.error('🐟 electronAPI.showOverlay not available');
      }

    } catch (error) {
      console.error('🐟 Assistant request failed:', error);
      console.error('🐟 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (window.electronAPI?.showOverlay) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await window.electronAPI.showOverlay(`Error: ${errorMessage}`);
      }
    }
  };

  // Global hotkey (handled by main process, but we can also add here for completeness)
  useHotkeys('cmd+shift+a, ctrl+shift+a', () => {
    // This will be primarily handled by the main process
    console.log('Hotkey activated from renderer');
  });

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <AnimatePresence mode="wait">
          {appState === 'setup' && (
            <SetupScreen 
              key="setup"
              onSetupComplete={handleSetupComplete}
            />
          )}
          
          {appState === 'main' && (
            <MainScreen 
              key="main"
              onShowSettings={handleShowSettings}
            />
          )}
          
          {appState === 'settings' && (
            <SettingsScreen 
              key="settings"
              onBack={handleBackToMain}
            />
          )}
        </AnimatePresence>

        {/* Overlay component for responses */}
        <OverlayScreen
          content={overlayContent}
          isVisible={isOverlayVisible}
          onClose={handleCloseOverlay}
        />
      </AppContainer>
    </ThemeProvider>
  );
}

const AppContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
               'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
               'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`; 