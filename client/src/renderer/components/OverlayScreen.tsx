import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface OverlayScreenProps {
  content?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const OverlayScreen: React.FC<OverlayScreenProps> = ({ 
  content, 
  isVisible, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayContent, setDisplayContent] = useState('');

  useEffect(() => {
    if (content) {
      setIsLoading(false);
      setDisplayContent(content);
    }
  }, [content]);

  useEffect(() => {
    // Listen for overlay content updates
    const handleDisplayContent = (newContent: string) => {
      setIsLoading(false);
      setDisplayContent(newContent);
    };

    const handleShowLoading = () => {
      setIsLoading(true);
      setDisplayContent('');
    };

    // Only set up listeners if Electron APIs are available
    if (window.electronAPI?.onDisplayContent) {
      window.electronAPI.onDisplayContent(handleDisplayContent);
    }
    
    if (window.electronAPI?.onShowLoading) {
      window.electronAPI.onShowLoading(handleShowLoading);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <Overlay
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Header>
            <Title>🐟 Catfish Assistant</Title>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          <Content>
            {isLoading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Analyzing your screen...</LoadingText>
              </LoadingContainer>
            ) : displayContent ? (
              <ResponseContainer>
                <ResponseText>{displayContent}</ResponseText>
              </ResponseContainer>
            ) : (
              <EmptyState>
                <EmptyIcon>🎯</EmptyIcon>
                <EmptyText>Ready to assist you!</EmptyText>
              </EmptyState>
            )}
          </Content>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 380px;
  max-height: 300px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  backdrop-filter: blur(20px);
  z-index: ${({ theme }) => theme.zIndex.overlay};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  max-height: 240px;
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const ResponseContainer = styled.div`
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ResponseText = styled.p`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  white-space: pre-wrap;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`; 