import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface MainScreenProps {
  onShowSettings: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onShowSettings }) => {
  const [status, setStatus] = useState<'ready' | 'processing' | 'error'>('ready');
  const [lastActivation, setLastActivation] = useState<Date | null>(null);

  useEffect(() => {
    // Listen for assistant requests
    const handleAssistantRequest = (data: any) => {
      setStatus('processing');
      // This will be handled by the main process
    };

    // Only set up listeners if Electron APIs are available
    if (window.electronAPI?.onProcessAssistantRequest) {
      window.electronAPI.onProcessAssistantRequest(handleAssistantRequest);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleTestActivation = async () => {
    setStatus('processing');
    setLastActivation(new Date());
    
    // Simulate processing
    setTimeout(() => {
      setStatus('ready');
    }, 2000);
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <LogoSection>
          <Logo>🐟</Logo>
          <Title>Catfish</Title>
        </LogoSection>
        <StatusIndicator status={status}>
          <StatusDot status={status} />
          {status === 'ready' && 'Ready'}
          {status === 'processing' && 'Processing...'}
          {status === 'error' && 'Error'}
        </StatusIndicator>
      </Header>

      <MainContent>
        <HeroSection>
          <HeroTitle>Your AI Assistant is Ready!</HeroTitle>
          <HeroDescription>
            Press <Kbd>Cmd+Shift+A</Kbd> (macOS) or <Kbd>Ctrl+Shift+A</Kbd> (Windows/Linux) 
            to capture your screen and get AI assistance.
          </HeroDescription>
          <HeroSubtitle>
            Catfish analyzes your screen content and provides intelligent insights, 
            helping you work more efficiently with AI-powered assistance.
          </HeroSubtitle>
        </HeroSection>

        <ActionGrid>
          <ActionCard 
            onClick={handleTestActivation} 
            disabled={status === 'processing'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ActionIcon>🖥️</ActionIcon>
            <ActionTitle>Test Screen Capture</ActionTitle>
            <ActionDescription>Test the screen capture functionality</ActionDescription>
            <ActionArrow>→</ActionArrow>
          </ActionCard>

          <ActionCard 
            onClick={onShowSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ActionIcon>⚙️</ActionIcon>
            <ActionTitle>Settings</ActionTitle>
            <ActionDescription>Configure hotkeys and preferences</ActionDescription>
            <ActionArrow>→</ActionArrow>
          </ActionCard>
        </ActionGrid>

        {lastActivation && (
          <LastActivation
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LastActivationText>
              Last activated: {lastActivation.toLocaleTimeString()}
            </LastActivationText>
          </LastActivation>
        )}
      </MainContent>

      <Footer>
        <FooterContent>
          <FooterText>Powered by Letta Cloud</FooterText>
          <FooterLink href="https://docs.letta.com" target="_blank">
            Documentation
          </FooterLink>
        </FooterContent>
      </Footer>
    </Container>
  );
};

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.div`
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusIndicator = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const StatusDot = styled.div<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status }) => 
    status === 'ready' ? '#4ade80' :
    status === 'processing' ? '#fbbf24' :
    '#f87171'
  };
  box-shadow: 0 0 8px ${({ status }) => 
    status === 'ready' ? 'rgba(74, 222, 128, 0.5)' :
    status === 'processing' ? 'rgba(251, 191, 36, 0.5)' :
    'rgba(248, 113, 113, 0.5)'
  };
`;

const MainContent = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeroSection = styled.div`
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const HeroTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`;

const HeroDescription = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 16px 0;
  line-height: 1.6;
`;

const HeroSubtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
`;

const Kbd = styled.kbd`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const ActionCard = styled(motion.button)<{ disabled?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-align: left;
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover:not(:disabled)::before {
    opacity: 1;
  }
  
  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
`;

const ActionIcon = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const ActionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
`;

const ActionDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
`;

const ActionArrow = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  
  ${ActionCard}:hover & {
    color: rgba(255, 255, 255, 0.9);
    transform: translateX(4px);
  }
`;

const LastActivation = styled(motion.div)`
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const LastActivationText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;

const Footer = styled.div`
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const FooterText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`;

const FooterLink = styled.a`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: white;
  }
`; 