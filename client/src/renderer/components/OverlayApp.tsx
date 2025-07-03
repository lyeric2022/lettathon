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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const ContentBox = styled(motion.div)<{ $isMinimized: boolean; $isDragging: boolean }>`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
  backdrop-filter: blur(24px);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${props => props.$isDragging ? 'grabbing' : 'default'};
  flex: 1;
  display: flex;
  flex-direction: column;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  ${props => props.$isMinimized ? `
    width: 70px;
    height: 70px;
    cursor: pointer;
    border-radius: 50%;
    flex: none;
    align-self: flex-end;
    margin: 20px;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
    }
  ` : `
    margin: 0;
    border-radius: 0;
    
    &:hover {
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
    }
  `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(10px);
  cursor: grab;
  -webkit-app-region: drag;
  
  &:active {
    cursor: grabbing;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: drag;
`;

const AssistantIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  -webkit-app-region: drag;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
`;

const HeaderTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;
  -webkit-app-region: drag;
`;

const HeaderSubtitle = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.2;
  -webkit-app-region: drag;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))';
      case 'danger': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8))';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'primary': return 'rgba(59, 130, 246, 0.3)';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  backdrop-filter: blur(10px);
  -webkit-app-region: no-drag;
  
  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'primary': return 'linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(99, 102, 241, 1))';
        case 'danger': return 'linear-gradient(135deg, rgba(239, 68, 68, 1), rgba(220, 38, 38, 1))';
        default: return 'rgba(255, 255, 255, 0.2)';
      }
    }};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Content = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6));
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8));
  }
  
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.8);
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  .loading-text {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ResponseText = styled.div`
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  white-space: pre-wrap;
  word-wrap: break-word;
  
  p {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: white;
    font-weight: 600;
  }
  
  code {
    background: rgba(59, 130, 246, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 13px;
    color: #93c5fd;
  }
`;

const MinimizedIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.8);
  font-size: 24px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
  border-radius: 50%;
  backdrop-filter: blur(10px);
`;

const ToggleButton = styled(motion.button)`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 
    0 8px 24px rgba(59, 130, 246, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    transform: scale(1.1);
    box-shadow: 
      0 12px 32px rgba(59, 130, 246, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  }
  
  &:active {
    transform: scale(1.05);
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nw-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%);
  border-radius: 0 0 20px 0;
  -webkit-app-region: no-drag;
  
  &:hover {
    background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.3) 50%);
  }
`;

const ResizeHandleRight = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: e-resize;
  -webkit-app-region: no-drag;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ResizeHandleBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  cursor: s-resize;
  -webkit-app-region: no-drag;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ResizeHandleBottomRight = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  -webkit-app-region: no-drag;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
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
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
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

    // Listen for toggle overlay command
    if (window.electronAPI?.onToggleOverlay) {
      window.electronAPI.onToggleOverlay(() => {
        setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
      });
    }

    // No auto-hide timer - overlay stays visible until manually toggled
  }, []);

  const handleClose = () => {
    setState(prev => ({ ...prev, isVisible: false }));
  };

  const handleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
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

  // Resize functionality
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (state.isMinimized) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({ x: e.clientX, y: e.clientY });
    
    // Get current window size
    setStartSize({ width: window.innerWidth, height: window.innerHeight });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || state.isMinimized) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    
    // Calculate new size based on resize direction
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(400, startSize.width + deltaX);
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(300, startSize.height + deltaY);
    }
    
    // Apply resize
    window.electronAPI.resizeWindow(newWidth, newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection('');
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeDirection, startPos, startSize, state.isMinimized]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />

      <AnimatePresence>
        {state.isVisible && (
          <OverlayContainer
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <ContentBox
              ref={contentBoxRef}
              $isMinimized={state.isMinimized}
              $isDragging={false}
              onClick={handleMinimizedClick}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {state.isMinimized ? (
                <MinimizedIndicator title="Click to expand">
                  💬
                </MinimizedIndicator>
              ) : (
                <>
                  <Header>
                    <HeaderContent>
                      <AssistantIcon>🤖</AssistantIcon>
                      <HeaderText>
                        <HeaderTitle>Catfish Assistant</HeaderTitle>
                        <HeaderSubtitle>AI-powered screen analysis</HeaderSubtitle>
                      </HeaderText>
                    </HeaderContent>
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
                        <div className="loading-text">Processing your request...</div>
                      </LoadingSpinner>
                    ) : (
                      <ResponseText>{state.content}</ResponseText>
                    )}
                  </Content>
                  
                  <ResizeHandle onMouseDown={(e) => handleResizeStart(e, 'se')} />
                  <ResizeHandleRight onMouseDown={(e) => handleResizeStart(e, 'e')} />
                  <ResizeHandleBottom onMouseDown={(e) => handleResizeStart(e, 's')} />
                  <ResizeHandleBottomRight onMouseDown={(e) => handleResizeStart(e, 'se')} />
                </>
              )}
            </ContentBox>
          </OverlayContainer>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}; 