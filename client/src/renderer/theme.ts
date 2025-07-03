export const theme = {
  colors: {
    background: 'rgba(255, 255, 255, 0.95)',
    backgroundDark: 'rgba(0, 0, 0, 0.95)',
    surface: 'rgba(255, 255, 255, 0.8)',
    surfaceDark: 'rgba(28, 28, 30, 0.8)',
    primary: '#007AFF',
    primaryHover: '#0056CC',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: '#000000',
    textSecondary: '#666666',
    textLight: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  typography: {
    h1: {
      fontSize: '28px',
      fontWeight: '700',
      lineHeight: '1.2'
    },
    h2: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.3'
    },
    h3: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.4'
    },
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5'
    },
    caption: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.4'
    },
    small: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '1.3'
    }
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%'
  },
  
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
    md: '0 4px 16px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.2)',
    xl: '0 16px 64px rgba(0, 0, 0, 0.25)'
  },
  
  transitions: {
    fast: '0.15s ease-in-out',
    normal: '0.3s ease-in-out',
    slow: '0.5s ease-in-out'
  },
  
  zIndex: {
    modal: 1000,
    overlay: 1100,
    tooltip: 1200,
    notification: 1300
  }
};

export type Theme = typeof theme; 