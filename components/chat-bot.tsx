"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Settings, MessageSquare, Trash2, Edit2 } from "lucide-react";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useAISettings } from "@/hooks/use-ai-settings";
import { ChatMessage, ChatSession } from "@/types";
import { AI_PROVIDERS } from "@/lib/ai-config";

export function ChatBot({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    currentSession,
    currentMessages,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    error: sessionError,
  } = useChatSessions();

  const {
    settings,
    updateSettings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useAISettings();

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentSession) return;

    try {
      setIsLoading(true);
      await sendMessage(input, settings);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      await createSession();
      setShowSessions(false);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const formatTokenCount = (tokens: number, maxTokens: number) => {
    const percentage = (tokens / maxTokens) * 100;
    const color = percentage > 90 ? 'text-red-500' : percentage > 70 ? 'text-yellow-500' : 'text-green-500';
    return (
      <span className={`text-xs ${color}`}>
        {tokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens ({percentage.toFixed(1)}%)
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-2/5 bg-card border-l border-border z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Cerebro</h2>
          {currentSession && (
            <Badge variant="outline" className="text-xs">
              {formatTokenCount(currentSession.token_count, currentSession.max_tokens)}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Session Selector */}
          <Popover open={showSessions} onOpenChange={setShowSessions}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Conversaciones</h3>
                  <Button variant="ghost" size="sm" onClick={handleCreateSession}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva
                  </Button>
                </div>
                <div className="max-h-60 overflow-auto space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent/50 ${
                        currentSession?.id === session.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div
                        className="flex-1 truncate"
                        onClick={() => {
                          selectSession(session.id);
                          setShowSessions(false);
                        }}
                      >
                        <div className="text-sm font-medium truncate">{session.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.updated_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configuración de IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedor</label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => updateSettings({ provider: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                        <SelectItem key={key} value={key}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo</label>
                  <Select
                    value={settings.model}
                    onValueChange={(value) => updateSettings({ model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS[settings.provider]?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tokens de contexto</label>
                  <Select
                    value={settings.max_context_tokens.toString()}
                    onValueChange={(value) => updateSettings({ max_context_tokens: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10,000</SelectItem>
                      <SelectItem value="20000">20,000</SelectItem>
                      <SelectItem value="50000">50,000</SelectItem>
                      <SelectItem value="100000">100,000</SelectItem>
                      <SelectItem value="200000">200,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperatura</label>
                  <Select
                    value={settings.temperature.toString()}
                    onValueChange={(value) => updateSettings({ temperature: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0.0 (Determinístico)</SelectItem>
                      <SelectItem value="0.3">0.3 (Conservador)</SelectItem>
                      <SelectItem value="0.7">0.7 (Balanceado)</SelectItem>
                      <SelectItem value="1">1.0 (Creativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!currentSession ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground">No hay conversación activa</p>
              <Button onClick={handleCreateSession}>
                <Plus className="h-4 w-4 mr-2" />
                Crear nueva conversación
              </Button>
            </div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Inicia una conversación escribiendo un mensaje</p>
          </div>
        ) : (
          currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-accent text-white"
                    : "bg-secondary text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.tool_calls.map((toolCall, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        🔧 {toolCall.function.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {message.role !== "user" && (
                  <div className="text-xs text-muted-foreground mt-1 opacity-70">
                    {new Date(message.created_at).toLocaleTimeString('es-ES')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-white rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Cerebro está pensando...</div>
              </div>
            </div>
          </div>
        )}

        {(sessionError || settingsError) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-destructive text-sm">
              {sessionError || settingsError}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentSession ? "Escribe tu mensaje..." : "Crea una conversación primero"}
            className="flex-1"
            disabled={!currentSession || isLoading}
          />
          <Button type="submit" disabled={!currentSession || isLoading || !input.trim()}>
            {isLoading ? "..." : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}