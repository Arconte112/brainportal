'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChatSession, ChatMessage } from '@/types';

interface ChatSessionsContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  currentMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Session management
  createSession: (title?: string, maxTokens?: number) => Promise<ChatSession>;
  selectSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message management
  sendMessage: (message: string, settings?: any) => Promise<ChatMessage>;
  refreshSessions: () => Promise<void>;
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/chat/sessions');
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);

      // Auto-select most recent session if none selected
      if (!currentSession && data.sessions?.length > 0) {
        await selectSession(data.sessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (title?: string, maxTokens?: number): Promise<ChatSession> => {
    try {
      setError(null);

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, maxTokens }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const newSession = data.session;

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setCurrentMessages([]);

      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating session:', err);
      throw err;
    }
  };

  const selectSession = async (sessionId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();
      setCurrentSession(data.session);
      setCurrentMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error selecting session:', err);
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<ChatSession>) => {
    try {
      setError(null);

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const data = await response.json();
      const updatedSession = data.session;

      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId ? updatedSession : session
        )
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating session:', err);
      throw err;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(prev => prev.filter(session => session.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCurrentMessages([]);
        
        // Auto-select another session if available
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          await selectSession(remainingSessions[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  const sendMessage = async (message: string, settings?: any): Promise<ChatMessage> => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    try {
      setError(null);

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: currentSession.id,
        role: 'user',
        content: message,
        token_count: 0,
        created_at: new Date().toISOString(),
      };

      setCurrentMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      // Replace optimistic message and add assistant response
      setCurrentMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [...filtered, assistantMessage];
      });

      // Update session token count
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          token_count: data.tokenCount,
          updated_at: new Date().toISOString(),
        } : null);
      }

      return assistantMessage;
    } catch (err) {
      // Remove optimistic message on error
      setCurrentMessages(prev => prev.filter(m => m.id !== `temp-${Date.now()}`));
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  return (
    <ChatSessionsContext.Provider
      value={{
        sessions,
        currentSession,
        currentMessages,
        isLoading,
        error,
        createSession,
        selectSession,
        updateSession,
        deleteSession,
        sendMessage,
        refreshSessions,
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatSessionsContext);
  if (context === undefined) {
    throw new Error('useChatSessions must be used within a ChatSessionsProvider');
  }
  return context;
}