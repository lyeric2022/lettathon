import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface SettingsScreenProps {
  onBack: () => void;
}

interface Settings {
  hotkey: string;
  autoHideDelay: number;
  theme: 'light' | 'dark' | 'auto';
  enableAudio: boolean;
  enableClipboard: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<Settings>({
    hotkey: 'CommandOrControl+Shift+A',
    autoHideDelay: 10,
    theme: 'auto',
    enableAudio: false,
    enableClipboard: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (!window.electronAPI?.getSettings) {
        console.warn('Electron API not available - using defaults');
        return;
      }
      
      const savedSettings = await window.electronAPI.getSettings();
      if (savedSettings) {
        setSettings({ ...settings, ...savedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!window.electronAPI?.updateSettings) {
      setSaveMessage('Electron API not available');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      await window.electronAPI.updateSettings(settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Container
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <BackButton 
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </BackButton>
        <Title>Settings</Title>
      </Header>

      <Content>
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionTitle>Hotkey Configuration</SectionTitle>
          <SettingRow>
            <SettingLabel>Activation Hotkey</SettingLabel>
            <Select
              value={settings.hotkey}
              onChange={(e) => updateSetting('hotkey', e.target.value)}
            >
              <option value="CommandOrControl+Shift+A">Cmd/Ctrl + Shift + A</option>
              <option value="CommandOrControl+Shift+S">Cmd/Ctrl + Shift + S</option>
              <option value="CommandOrControl+Shift+C">Cmd/Ctrl + Shift + C</option>
              <option value="CommandOrControl+Alt+A">Cmd/Ctrl + Alt + A</option>
            </Select>
          </SettingRow>
        </Section>

        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionTitle>Display Settings</SectionTitle>
          <SettingRow>
            <SettingLabel>Auto-hide delay (seconds)</SettingLabel>
            <NumberInput
              type="number"
              min={5}
              max={30}
              value={settings.autoHideDelay}
              onChange={(e) => updateSetting('autoHideDelay', parseInt(e.target.value))}
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>Theme</SettingLabel>
            <Select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as Settings['theme'])}
            >
              <option value="auto">Auto (System)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </SettingRow>
        </Section>

        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle>Privacy & Features</SectionTitle>
          <SettingRow>
            <SettingLabel>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  checked={settings.enableClipboard}
                  onChange={(e) => updateSetting('enableClipboard', e.target.checked)}
                />
                <CheckboxLabel>Enable clipboard analysis</CheckboxLabel>
              </CheckboxContainer>
            </SettingLabel>
            <SettingDescription>
              Include clipboard content in AI analysis for better context
            </SettingDescription>
          </SettingRow>
          <SettingRow>
            <SettingLabel>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  checked={settings.enableAudio}
                  onChange={(e) => updateSetting('enableAudio', e.target.checked)}
                />
                <CheckboxLabel>Enable audio transcription</CheckboxLabel>
              </CheckboxContainer>
            </SettingLabel>
            <SettingDescription>
              Capture and transcribe audio for enhanced context (experimental)
            </SettingDescription>
          </SettingRow>
        </Section>

        <SaveSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SaveButton 
            onClick={saveSettings} 
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </SaveButton>
          {saveMessage && (
            <SaveMessage 
              success={saveMessage.includes('success')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {saveMessage}
            </SaveMessage>
          )}
        </SaveSection>
      </Content>
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
  align-items: center;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const BackButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 16px;
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  margin-right: 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Content = styled.div`
  flex: 1;
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const Section = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
`;

const SettingDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 8px 0 0 0;
  line-height: 1.4;
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: white;
  cursor: pointer;
  backdrop-filter: blur(10px);
  min-width: 200px;
  
  option {
    background: #2d3748;
    color: white;
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
`;

const NumberInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: white;
  backdrop-filter: blur(10px);
  width: 120px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
`;

const CheckboxLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
`;

const SaveSection = styled(motion.div)`
  text-align: center;
  margin-top: 32px;
`;

const SaveButton = styled(motion.button)`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
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

const SaveMessage = styled(motion.div)<{ success: boolean }>`
  margin-top: 16px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ success }) => 
    success 
      ? 'rgba(74, 222, 128, 0.2)' 
      : 'rgba(248, 113, 113, 0.2)'
  };
  color: ${({ success }) => 
    success 
      ? '#bbf7d0' 
      : '#fecaca'
  };
  border: 1px solid ${({ success }) => 
    success 
      ? 'rgba(74, 222, 128, 0.3)' 
      : 'rgba(248, 113, 113, 0.3)'
  };
  backdrop-filter: blur(10px);
`; 