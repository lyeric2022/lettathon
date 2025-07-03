import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../theme';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: transparent;
    color: ${props => props.theme.colors.text};
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  #root {
    width: 100vw;
    height: 100vh;
  }
`;

const OverlayContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const ContentBox = styled(motion.div)<{ $isMinimized: boolean }>`
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${props => props.$isMinimized ? `
    width: 60px;
    height: 60px;
    cursor: pointer;
  ` : `
    width: 450px;
    min-height: 200px;
    max-height: 600px;
    resize: both;
    overflow: auto;
  `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return 'rgba(0, 122, 255, 0.8)';
      case 'danger': return 'rgba(255, 59, 48, 0.8)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  
  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'primary': return 'rgba(0, 122, 255, 1)';
        case 'danger': return 'rgba(255, 59, 48, 1)';
        default: return 'rgba(255, 255, 255, 0.2)';
      }
    }};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Content = styled.div`
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.7);
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid rgba(0, 122, 255, 0.8);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ResponseText = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MinimizedIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
`;

const ToggleButton = styled(motion.button)`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(0, 122, 255, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 122, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
  }
`;

interface OverlayState {
  isVisible: boolean;
  isLoading: boolean;
  content: string;
  isMinimized: boolean;
}

export const OverlayApp: React.FC = () => {
  const [state, setState] = useState<OverlayState>({
    isVisible: false,
    isLoading: false,
    content: '',
    isMinimized: false
  });

  const contentBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for display content events
    if (window.electronAPI?.onDisplayContent) {
      window.electronAPI.onDisplayContent((content: string) => {
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: false,
          content,
          isMinimized: false
        }));
      });
    }

    // Listen for loading events
    if (window.electronAPI?.onShowLoading) {
      window.electronAPI.onShowLoading(() => {
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: true,
          content: '',
          isMinimized: false
        }));
      });
    }

    // Auto-hide after 30 seconds (increased from 10)
    let hideTimer: NodeJS.Timeout;
    if (state.isVisible && !state.isLoading && !state.isMinimized) {
      hideTimer = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false }));
      }, 30000);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [state.isVisible, state.isLoading, state.isMinimized]);

  const handleClose = () => {
    setState(prev => ({ ...prev, isVisible: false }));
  };

  const handleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const handleToggle = () => {
    setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'm' || e.key === 'M') {
      handleMinimize();
    }
  };

  const handleMinimizedClick = () => {
    if (state.isMinimized) {
      handleMinimize();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      
      {/* Toggle Button - always visible */}
      <ToggleButton
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Toggle Assistant (Cmd+Shift+A)"
      >
        🤖
      </ToggleButton>

      <AnimatePresence>
        {state.isVisible && (
          <OverlayContainer
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <ContentBox
              ref={contentBoxRef}
              $isMinimized={state.isMinimized}
              onClick={handleMinimizedClick}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {state.isMinimized ? (
                <MinimizedIndicator title="Click to expand">
                  💬
                </MinimizedIndicator>
              ) : (
                <>
                  <Header>
                    <span>Catfish Assistant</span>
                    <Controls>
                      <ControlButton
                        onClick={handleMinimize}
                        title="Minimize (M)"
                      >
                        −
                      </ControlButton>
                      <ControlButton
                        onClick={handleClose}
                        $variant="danger"
                        title="Close (Esc)"
                      >
                        ×
                      </ControlButton>
                    </Controls>
                  </Header>
                  
                  <Content>
                    {state.isLoading ? (
                      <LoadingSpinner>
                        <div className="spinner" />
                        <div>Processing your request...</div>
                      </LoadingSpinner>
                    ) : (
                      <ResponseText>{state.content}</ResponseText>
                    )}
                  </Content>
                </>
              )}
            </ContentBox>
          </OverlayContainer>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}; 