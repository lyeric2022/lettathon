import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../theme';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.2);
    }
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
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.45) 0%, 
    rgba(255, 255, 255, 0.35) 100%
  );
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: ${props => props.$isMinimized ? '50%' : '24px'};
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.6),
    inset 0 -2px 4px rgba(0, 0, 0, 0.08);
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
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 40%,
      transparent 60%,
      rgba(255, 255, 255, 0.15) 100%
    );
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.4) 0%,
      transparent 50%
    );
    pointer-events: none;
  }
  
  ${props => props.$isMinimized ? `
    width: 70px;
    height: 70px;
    cursor: pointer;
    flex: none;
    align-self: flex-end;
    margin: 20px;
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.18),
        0 4px 12px rgba(0, 0, 0, 0.12),
        inset 0 2px 4px rgba(255, 255, 255, 0.7),
        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
    }
  ` : `
    margin: 0;
    border-radius: 0;
    
    &:hover {
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.18),
        0 4px 12px rgba(0, 0, 0, 0.12),
        inset 0 2px 4px rgba(255, 255, 255, 0.7),
        inset 0 -2px 4px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 6px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.25) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  cursor: grab;
  -webkit-app-region: drag;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.7) 50%,
      transparent 100%
    );
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag;
`;

const AssistantIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={{ 
      filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5)) drop-shadow(0 0 16px rgba(167, 139, 250, 0.4))'
    }}
  >
    <defs>
      <linearGradient id="assistantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#f472b6" stopOpacity="0.95" />
      </linearGradient>
    </defs>
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#assistantGradient)"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="1"
    />
    <circle
      cx="12"
      cy="12"
      r="6"
      fill="rgba(255, 255, 255, 0.3)"
      stroke="rgba(255, 255, 255, 0.6)"
      strokeWidth="1"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="rgba(255, 255, 255, 0.8)"
    />
  </svg>
);

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
`;

const HeaderTitle = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.95);
  line-height: 1.2;
  -webkit-app-region: drag;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

const HeaderSubtitle = styled.span`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  -webkit-app-region: drag;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
`;

const RecordingIndicator = styled.span`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  -webkit-app-region: drag;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': 
        return `linear-gradient(135deg, 
          #3b82f6 0%, 
          #8b5cf6 100%)`;
      case 'danger': 
        return `linear-gradient(135deg, 
          #ef4444 0%, 
          #dc2626 100%)`;
      default: 
        return `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.8) 0%, 
          rgba(255, 255, 255, 0.6) 100%)`;
    }
  }};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'primary': return 'rgba(59, 130, 246, 0.3)';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.4)';
    }
  }};
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  color: ${props => {
    switch (props.$variant) {
      case 'primary': return '#ffffff';
      case 'danger': return '#ffffff';
      default: return 'rgba(0, 0, 0, 0.6)';
    }
  }};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  -webkit-app-region: no-drag;
  box-shadow: ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          0 2px 8px rgba(59, 130, 246, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.3),
          inset 0 -1px 2px rgba(0, 0, 0, 0.1)`;
      case 'danger':
        return `
          0 2px 8px rgba(239, 68, 68, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.3),
          inset 0 -1px 2px rgba(0, 0, 0, 0.1)`;
      default:
        return `
          0 2px 8px rgba(0, 0, 0, 0.08),
          inset 0 1px 2px rgba(255, 255, 255, 0.6),
          inset 0 -1px 2px rgba(0, 0, 0, 0.05)`;
    }
  }};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${props => {
      switch (props.$variant) {
        case 'primary':
          return `
            0 4px 16px rgba(59, 130, 246, 0.4),
            inset 0 1px 3px rgba(255, 255, 255, 0.4),
            inset 0 -1px 3px rgba(0, 0, 0, 0.15)`;
        case 'danger':
          return `
            0 4px 16px rgba(239, 68, 68, 0.4),
            inset 0 1px 3px rgba(255, 255, 255, 0.4),
            inset 0 -1px 3px rgba(0, 0, 0, 0.15)`;
        default:
          return `
            0 4px 16px rgba(0, 0, 0, 0.12),
            inset 0 1px 3px rgba(255, 255, 255, 0.7),
            inset 0 -1px 3px rgba(0, 0, 0, 0.07)`;
      }
    }};
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0) scale(1);
    box-shadow: ${props => {
      switch (props.$variant) {
        case 'primary':
          return `
            0 1px 4px rgba(59, 130, 246, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.2),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2)`;
        case 'danger':
          return `
            0 1px 4px rgba(239, 68, 68, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.2),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2)`;
        default:
          return `
            0 1px 4px rgba(0, 0, 0, 0.08),
            inset 0 1px 2px rgba(255, 255, 255, 0.5),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1)`;
      }
    }};
  }
`;

const Content = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Custom scrollbar with glass effect */
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    margin: 5px;
    backdrop-filter: blur(10px);
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.3) 100%
    );
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.08),
      inset 0 1px 2px rgba(255, 255, 255, 0.6);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.4) 100%
    );
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
  color: rgba(0, 0, 0, 0.6);
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid rgba(59, 130, 246, 0.6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.2),
      inset 0 0 12px rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ResponseText = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.95);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  
  /* Enhanced markdown styling for glass theme */
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.95);
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, transparent 100%);
      border-radius: 2px;
    }
  }
  
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.9);
    margin: 20px 0 12px 0;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin: 16px 0 8px 0;
  }
  
  p {
    margin-bottom: 12px;
    color: rgba(0, 0, 0, 0.95);
    font-size: 18px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
    color: rgba(0, 0, 0, 0.85);
  }
  
  li {
    margin-bottom: 6px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.85);
  }
  
  strong {
    color: rgba(0, 0, 0, 0.95);
    font-weight: 700;
  }
  
  em {
    color: rgba(0, 0, 0, 0.8);
    font-style: italic;
  }
  
  code {
    background: rgba(59, 130, 246, 0.15);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    color: #2563eb;
    border: 1px solid rgba(59, 130, 246, 0.3);
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6);
    font-weight: 600;
  }
  
  pre {
    background: rgba(255, 255, 255, 0.5);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    margin: 16px 0;
    overflow-x: auto;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.1),
      inset 0 2px 4px rgba(255, 255, 255, 0.7);
  }
  
  pre code {
    background: none;
    padding: 0;
    color: rgba(0, 0, 0, 0.9);
    border: none;
    box-shadow: none;
    font-weight: normal;
  }
  
  blockquote {
    border-left: 4px solid rgba(59, 130, 246, 0.5);
    padding-left: 16px;
    margin: 16px 0;
    color: rgba(0, 0, 0, 0.75);
    font-style: italic;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
  }
  
  hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(0, 0, 0, 0.15) 20%, 
      rgba(0, 0, 0, 0.15) 80%, 
      transparent 100%
    );
    margin: 24px 0;
  }
  
  /* Links */
  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover {
      color: #2563eb;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
    }
  }
  
  /* Tables with glass effect */
  table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    margin: 16px 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  th, td {
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 10px 14px;
    text-align: left;
  }
  
  th {
    background: rgba(59, 130, 246, 0.15);
    font-weight: 700;
    color: rgba(0, 0, 0, 0.95);
    border-bottom: 2px solid rgba(59, 130, 246, 0.25);
  }
  
  td {
    background: rgba(255, 255, 255, 0.4);
    color: rgba(0, 0, 0, 0.85);
  }
  
  tr:hover td {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const MinimizedIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50%;
  backdrop-filter: blur(20px);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6);
`;

const ToggleButton = styled(motion.button)`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: rgba(0, 0, 0, 0.7);
  font-size: 22px;
  cursor: pointer;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 2px 4px rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(0, 0, 0, 0.05);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 70%
    );
    transform: rotate(45deg);
    transition: all 0.6s ease;
    opacity: 0;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.15),
      0 6px 12px rgba(0, 0, 0, 0.1),
      inset 0 2px 4px rgba(255, 255, 255, 1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.07);
    
    &::before {
      opacity: 1;
      animation: shimmer 0.6s ease;
    }
  }
  
  &:active {
    transform: scale(1.05);
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  cursor: nw-resize;
  -webkit-app-region: no-drag;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }
  
  &::before {
    bottom: 4px;
    right: 10px;
    width: 10px;
    height: 2px;
  }
  
  &::after {
    bottom: 10px;
    right: 4px;
    width: 2px;
    height: 10px;
  }
  
  ${ContentBox}:hover & {
    opacity: 1;
  }
`;

const ResizeHandleRight = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: e-resize;
  -webkit-app-region: no-drag;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
  }
  
  ${ContentBox}:hover & {
    opacity: 1;
  }
`;

const ResizeHandleBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: s-resize;
  -webkit-app-region: no-drag;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.05));
  }
  
  ${ContentBox}:hover & {
    opacity: 1;
  }
`;

const ResizeHandleBottomRight = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  cursor: se-resize;
  -webkit-app-region: no-drag;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }
  
  &::before {
    bottom: 4px;
    right: 10px;
    width: 10px;
    height: 2px;
  }
  
  &::after {
    bottom: 10px;
    right: 4px;
    width: 2px;
    height: 10px;
  }
  
  ${ContentBox}:hover & {
    opacity: 1;
  }
`;

interface OverlayState {
  isVisible: boolean;
  isLoading: boolean;
  content: string;
  isMinimized: boolean;
  isRecording: boolean;
}

export const OverlayApp: React.FC = () => {
  const [state, setState] = useState<OverlayState>({
    isVisible: true,
    isLoading: false,
    content: `# Welcome to Catfish

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

Press **⌘⇧A** to get started!`,
    isMinimized: false,
    isRecording: false
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const contentBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('OverlayApp: Setting up event listeners...');
    
    // Listen for display content events
    if (window.electronAPI?.onDisplayContent) {
      console.log('OverlayApp: onDisplayContent listener available');
      window.electronAPI.onDisplayContent((content: string) => {
        console.log('OverlayApp: Received display-content event');
        console.log('OverlayApp: Content length:', content?.length);
        console.log('OverlayApp: Content preview:', content?.substring(0, 100));
        console.log('OverlayApp: Received display-content event with content:', content?.substring(0, 100) + '...');
        setState(prev => {
          console.log('OverlayApp: Previous state:', prev);
          const newState = {
            ...prev,
            isVisible: true,
            isLoading: false,
            content,
            isMinimized: false
          };
          console.log('OverlayApp: New state:', newState);
          return newState;
        });
      });
    } else {
      console.error('OverlayApp: onDisplayContent not available!');
    }

    // Listen for loading events
    if (window.electronAPI?.onShowLoading) {
      console.log('OverlayApp: onShowLoading listener available');
      window.electronAPI.onShowLoading(() => {
        console.log('OverlayApp: Received show-loading event');
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: true,
          content: '',
          isMinimized: false
        }));
      });
    } else {
      console.error('OverlayApp: onShowLoading not available!');
    }

    // Listen for toggle overlay command
    if (window.electronAPI?.onToggleOverlay) {
      window.electronAPI.onToggleOverlay(() => {
        console.log('OverlayApp: Received toggle-overlay event');
        setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
      });
    }

    // Listen for recording status changes
    if (window.electronAPI?.onRecordingStatusChanged) {
      window.electronAPI.onRecordingStatusChanged((isRecording: boolean) => {
        console.log('OverlayApp: Recording status changed:', isRecording);
        setState(prev => ({ ...prev, isRecording }));
      });
    }

    // Log initial state
    console.log('OverlayApp: Initial state:', state);

    // No auto-hide timer - overlay stays visible until manually toggled
  }, []);

  // Debug log state changes
  useEffect(() => {
    console.log('OverlayApp: State changed:', state);
  }, [state]);

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
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    background: 'rgba(255, 255, 255, 0.3)', 
                    borderRadius: '50%' 
                  }} />
                </MinimizedIndicator>
              ) : (
                <>
                  <Header>
                    <HeaderContent>
                      <AssistantIcon className="logo" size={32} />
                      <HeaderText>
                        <HeaderTitle>Catfish AI</HeaderTitle>
                        {state.isRecording && (
                          <RecordingIndicator>Recording...</RecordingIndicator>
                        )}
                      </HeaderText>
                      {state.isRecording && (
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          borderRadius: '50%',
                          animation: 'pulse 1.5s ease-in-out infinite',
                          boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
                          marginLeft: '8px'
                        }} />
                      )}
                    </HeaderContent>
                    <Controls>
                      <ControlButton
                        onClick={() => window.electronAPI?.toggleMicrophone?.()}
                        $variant={state.isRecording ? 'primary' : undefined}
                        title={state.isRecording ? 'Stop Recording' : 'Start Recording'}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: state.isRecording 
                            ? 'rgba(255, 255, 255, 0.9)' 
                            : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          borderRadius: '50%',
                          boxShadow: state.isRecording 
                            ? '0 0 8px rgba(255, 255, 255, 0.6)' 
                            : 'none'
                        }} />
                      </ControlButton>
                      <ControlButton
                        onClick={handleMinimize}
                        title="Minimize"
                      >
                        <div style={{
                          width: '14px',
                          height: '2px',
                          background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                          borderRadius: '1px'
                        }} />
                      </ControlButton>
                      <ControlButton
                        onClick={handleClose}
                        $variant="danger"
                        title="Close"
                      >
                        <div style={{
                          width: '14px',
                          height: '14px',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '2px',
                            background: '#ffffff',
                            top: '50%',
                            transform: 'translateY(-50%) rotate(45deg)',
                            borderRadius: '1px'
                          }} />
                          <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '2px',
                            background: '#ffffff',
                            top: '50%',
                            transform: 'translateY(-50%) rotate(-45deg)',
                            borderRadius: '1px'
                          }} />
                        </div>
                      </ControlButton>
                    </Controls>
                  </Header>
                  
                  <Content>
                    {state.isLoading ? (
                      <LoadingSpinner>
                        <div className="spinner" />
                      </LoadingSpinner>
                    ) : (
                      <ResponseText>
                        <ReactMarkdown remarkPlugins={[remarkGfm as any]}>{state.content}</ReactMarkdown>
                      </ResponseText>
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