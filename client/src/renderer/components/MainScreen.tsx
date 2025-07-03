import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

export const MainScreen: React.FC = () => {
  const [status, setStatus] = useState<'ready' | 'processing' | 'error'>('ready');

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

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background orbs */}
      <BackgroundOrb1 />
      <BackgroundOrb2 />
      <BackgroundOrb3 />
      
      <GlassHeader>
        <LogoSection>
          <LogoContainer>
            <CatfishLogo 
              src="/assets/catfish-logo.png" 
              alt="Catfish" 
              onError={(e) => {
                // Fallback to SVG placeholder if PNG not found
                const target = e.target as HTMLImageElement;
                target.src = '/assets/catfish-placeholder.svg';
                target.onerror = () => {
                  // Final fallback to SVG icon
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback-logo');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'block';
                  }
                };
              }}
            />
            <FallbackLogo className="fallback-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="glassmorphism">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                    <feComposite in="blur" in2="SourceGraphic" operator="over" />
                  </filter>
                  <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.4)', stopOpacity: 1 }} />
                  </linearGradient>
                  <radialGradient id="highlight" cx="30%" cy="30%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.8)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0)', stopOpacity: 1 }} />
                  </radialGradient>
                  <filter id="dropShadow">
                    <feDropShadow dx={0} dy={2} stdDeviation={3} floodOpacity={0.1}/>
                  </filter>
                </defs>
                <ellipse cx="24" cy="26" rx="18" ry="8" fill="url(#whiteGradient)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" filter="url(#glassmorphism)" opacity="0.8"/>
                <circle cx="24" cy="20" r="10" fill="url(#whiteGradient)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" filter="url(#dropShadow)" opacity="0.85"/>
                <ellipse cx="22" cy="18" rx="8" ry="6" fill="url(#highlight)" opacity="0.5"/>
                <circle cx="20" cy="17" r="2" fill="rgba(255,255,255,0.9)" filter="url(#dropShadow)"/>
                <circle cx="28" cy="17" r="2" fill="rgba(255,255,255,0.9)" filter="url(#dropShadow)"/>
                <circle cx="20" cy="17" r="1" fill="rgba(100,100,100,0.6)"/>
                <circle cx="28" cy="17" r="1" fill="rgba(100,100,100,0.6)"/>
                <line x1="14" y1="18" x2="8" y2="16" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="22" x2="8" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="34" y1="18" x2="40" y2="16" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="34" y1="22" x2="40" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 28 L12 24 L8 32 Z" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" filter="url(#glassmorphism)"/>
                <path d="M42 28 L36 24 L40 32 Z" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" filter="url(#glassmorphism)"/>
                <path d="M42 26 L48 20 L48 32 Z" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" filter="url(#glassmorphism)"/>
                <path d="M20 24 Q24 26 28 24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </FallbackLogo>
            <LogoGlow />
          </LogoContainer>
        </LogoSection>
      </GlassHeader>

      <MainContent>
        <GlassCard
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <GlassOrb />
        </GlassCard>
      </MainContent>

      <Footer>
        <FooterContent>
          <FooterText>Powered by Letta Cloud</FooterText>
        </FooterContent>
      </Footer>
    </Container>
  );
};

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  color: white;
  position: relative;
  overflow: hidden;
`;

// Animated background orbs for depth
const BackgroundOrb1 = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(88, 101, 242, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  top: -200px;
  right: -100px;
  filter: blur(40px);
  animation: float 20s ease-in-out infinite;
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-30px, 30px) scale(1.1); }
    66% { transform: translate(30px, -30px) scale(0.9); }
  }
`;

const BackgroundOrb2 = styled.div`
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  bottom: -150px;
  left: -100px;
  filter: blur(40px);
  animation: float 25s ease-in-out infinite reverse;
`;

const BackgroundOrb3 = styled.div`
  position: absolute;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(40px);
  animation: pulse 15s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
  }
`;

const GlassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 10;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, 
      rgba(88, 101, 242, 0.1) 0%, 
      rgba(236, 72, 153, 0.1) 50%, 
      rgba(139, 92, 246, 0.1) 100%
    );
    opacity: 0.5;
    pointer-events: none;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
`;

const LogoContainer = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CatfishLogo = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  position: relative;
  z-index: 2;
`;

const FallbackLogo = styled.div`
  display: none;
  font-size: 36px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  position: relative;
  z-index: 2;
`;

const LogoGlow = styled.div`
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(88, 101, 242, 0.6) 0%, transparent 70%);
  filter: blur(12px);
  animation: logoGlow 3s ease-in-out infinite;
  
  @keyframes logoGlow {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.3) 50%, 
      transparent 100%
    );
  }
`;

const GlassOrb = styled.div`
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.3),
      inset 0 0 30px rgba(255, 255, 255, 0.15);
  }
`;

const Footer = styled.div`
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 10;
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FooterText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 500;
`; 