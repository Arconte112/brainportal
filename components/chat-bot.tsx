"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  actions?: string[];
};

export function ChatBot({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hola, ¿en qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Entendido. Puedo ayudarte con eso.",
        sender: "bot",
        actions: ["Crear tarea", "Programar evento", "Añadir nota"],
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-2/5 bg-card border-l border-border z-50 flex flex-col"
      data-oid="-c9ibaj"
    >
      <div
        className="flex items-center justify-between p-4 border-b border-border"
        data-oid="9grta1r"
      >
        <h2 className="text-lg font-medium" data-oid="jc3j7yv">
          Cerebro
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          data-oid="-76tpjb"
        >
          <X className="h-4 w-4" data-oid="gjzdvjd" />
          <span className="sr-only" data-oid="htmbv.s">
            Cerrar
          </span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4" data-oid="na_u82e">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            data-oid="313-wrr"
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-accent text-white"
                  : "bg-secondary text-white"
              }`}
              data-oid="6bw0ggq"
            >
              <p data-oid="ks.itwy">{message.content}</p>
              {message.actions && (
                <div className="flex flex-wrap gap-2 mt-2" data-oid="3mb.62x">
                  {message.actions.map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 bg-transparent border-white/20 hover:bg-white/10"
                      data-oid="gaafbi9"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border"
        data-oid="cqniwfi"
      >
        <div className="flex gap-2" data-oid="55q5pd4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1"
            data-oid="yg_8lc-"
          />

          <Button type="submit" data-oid="j.pl6c9">
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
