'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AISettings } from '@/types';
import { DEFAULT_AI_SETTINGS } from '@/lib/ai-config';

interface AISettingsContextType {
  settings: AISettings;
  updateSettings: (newSettings: Partial<AISettings>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading AI settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AISettings>) => {
    try {
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error saving AI settings:', err);
      throw err;
    }
  };

  return (
    <AISettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading,
        error,
      }}
    >
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  const context = useContext(AISettingsContext);
  if (context === undefined) {
    throw new Error('useAISettings must be used within an AISettingsProvider');
  }
  return context;
}