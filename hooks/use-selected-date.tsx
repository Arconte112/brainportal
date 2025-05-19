"use client";
import React, { createContext, useContext, useState } from "react";

interface SelectedDateContextProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const SelectedDateContext = createContext<SelectedDateContextProps | undefined>(undefined);

export function SelectedDateProvider({ children }: { children: React.ReactNode }) {
  // Inicializar con fecha local en formato YYYY-MM-DD, no UTC
  const getLocalDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
}

export function useSelectedDate() {
  const context = useContext(SelectedDateContext);
  if (!context) {
    throw new Error("useSelectedDate must be used within a SelectedDateProvider");
  }
  return context;
}