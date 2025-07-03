import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface SetupScreenProps {
  onSetupComplete: (apiKey: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your Letta API key');
      return;
    }

    if (!window.electronAPI?.storeApiKey) {
      setError('Electron API not available - please run in Electron');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Store API key securely
      await window.electronAPI.storeApiKey(apiKey);
      onSetupComplete(apiKey);
    } catch (err) {
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Logo>🐟</Logo>
        <Title>Welcome to Catfish</Title>
        <Subtitle>Your AI-powered screen assistant</Subtitle>
      </Header>

      <SetupCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <SetupForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="apiKey">Letta API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Letta API key"
              disabled={isValidating}
            />
            <HelpText>
              Get your API key from{' '}
              <ExternalLink 
                href="#" 
                onClick={() => {
                  if (window.electronAPI?.openExternal) {
                    window.electronAPI.openExternal('https://app.letta.com/api-keys');
                  } else {
                    window.open('https://app.letta.com/api-keys', '_blank');
                  }
                }}
              >
                app.letta.com/api-keys
              </ExternalLink>
            </HelpText>
          </FormGroup>

          {error && (
            <ErrorMessage
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </ErrorMessage>
          )}

          <SubmitButton 
            type="submit" 
            disabled={isValidating || !apiKey.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isValidating ? 'Validating...' : 'Continue'}
          </SubmitButton>
        </SetupForm>
      </SetupCard>

      <Footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <FooterText>
          Press <Kbd>Cmd+Shift+A</Kbd> (macOS) or <Kbd>Ctrl+Shift+A</Kbd> (Windows/Linux) to activate
        </FooterText>
      </Footer>
    </Container>
  );
};

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

const Logo = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
`;

const SetupCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const SetupForm = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 8px 0 0 0;
  line-height: 1.4;
`;

const ExternalLink = styled.a`
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(248, 113, 113, 0.2);
  color: #fecaca;
  padding: 16px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 24px;
  border: 1px solid rgba(248, 113, 113, 0.3);
  backdrop-filter: blur(10px);
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Footer = styled(motion.div)`
  margin-top: 48px;
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
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