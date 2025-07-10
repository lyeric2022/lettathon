import React from 'react';
import styled from 'styled-components';

export const MainScreen: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>🐟 Catfish</Title>
        <Subtitle>AI Assistant</Subtitle>
      </Header>
      
      <Content>
        <AgentCard>
          <AgentAvatar>
            <AgentImage src="/roylee.png" alt="Roy Lee" />
          </AgentAvatar>
          <AgentInfo>
            <AgentName>Roy Lee</AgentName>
            <AgentDescription>
              Your personal AI agent with infinite memory. At 6 ft tall, Roy watches every pixel on your screen, listens to your every word, and discreetly whispers your next best move. Fabulous at LeetCode, poker, and sales. Now yours to control.
            </AgentDescription>
            <AgentStatus>🟢 Online</AgentStatus>
          </AgentInfo>
        </AgentCard>
        
        <Actions>
          <Button onClick={() => console.log('Activate agent')}>
            🎯 Activate Agent
          </Button>
          <Button onClick={() => console.log('View history')}>
            📚 View History
          </Button>
        </Actions>
      </Content>
      
      <Footer>
        Powered by Letta Cloud
      </Footer>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  padding: 40px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 48px;
  margin: 0;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 18px;
  margin: 10px 0 0 0;
  opacity: 0.8;
`;

const Content = styled.div`
  padding: 0 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const AgentCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  display: flex;
  gap: 30px;
  align-items: center;
`;

const AgentAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`;

const AgentImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const AgentInfo = styled.div`
  flex: 1;
`;

const AgentName = styled.h2`
  font-size: 32px;
  margin: 0 0 15px 0;
  font-weight: 600;
`;

const AgentDescription = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 20px 0;
  opacity: 0.9;
`;

const AgentStatus = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
`;

const Button = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  padding: 15px 30px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const Footer = styled.div`
  padding: 40px;
  text-align: center;
  opacity: 0.7;
  font-size: 14px;
`; 