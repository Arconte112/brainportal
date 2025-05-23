"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reminder } from "@/types";

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  badge?: string;
  image?: string;
}

interface UseNotificationsProps {
  onReminderTriggered?: (reminderId: string) => void;
}

export function useNotifications(props?: UseNotificationsProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return "denied";
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context and generate a notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a more complex and pleasant notification sound
      const playBell = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.7, startTime + duration);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a sequence of bell tones for a more attention-grabbing sound
      const now = audioContext.currentTime;
      playBell(800, now, 0.6);          // First bell
      playBell(1000, now + 0.3, 0.6);   // Second bell (higher)
      playBell(800, now + 0.6, 0.8);    // Third bell (longer)
      
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, []);

  const showNotification = useCallback((options: NotificationOptions, playSound = true) => {
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    if (playSound) {
      playNotificationSound();
    }

    // Create notification following app's minimalist style
    const notification = new Notification(options.title, {
      body: options.body ? `${options.body}\n\nHaz clic para marcar como completado` : `Recordatorio programado\n\nHaz clic para marcar como completado`,
      icon: options.icon || "/placeholder-logo.png",
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? true,
      silent: false,
      timestamp: Date.now(),
    });

    // Add click handler to mark as completed
    notification.onclick = () => {
      notification.close();
      // This will be handled by the specific implementation
    };

    return notification;
  }, [permission, playNotificationSound]);

  const scheduleReminder = useCallback((reminder: Reminder) => {
    const now = new Date();
    const reminderTime = new Date(reminder.dateTime);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder <= 0) {
      // Reminder time has already passed
      return;
    }

    const timeoutId = setTimeout(() => {
      if (reminder.status === "pending") {
        const notification = showNotification(
          {
            title: reminder.title,
            body: reminder.description,
            tag: `reminder-${reminder.id}`,
            requireInteraction: true,
          },
          reminder.soundEnabled ?? true
        );

        // Add vibration if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Add click handler to complete the reminder
        if (notification) {
          notification.onclick = () => {
            notification.close();
            props?.onReminderTriggered?.(reminder.id);
          };
        }

        // Call the trigger callback
        props?.onReminderTriggered?.(reminder.id);

        // Remove from active reminders after showing
        setActiveReminders(prev => prev.filter(r => r.id !== reminder.id));
      }
    }, timeUntilReminder);

    // Store the reminder with its timeout ID for potential cancellation
    setActiveReminders(prev => [...prev.filter(r => r.id !== reminder.id), reminder]);

    return timeoutId;
  }, [showNotification]);

  const cancelReminder = useCallback((reminderId: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
  }, []);

  const scheduleMultipleReminders = useCallback((reminders: Reminder[]) => {
    reminders.forEach(reminder => {
      if (reminder.status === "pending") {
        scheduleReminder(reminder);
      }
    });
  }, [scheduleReminder]);

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleReminder,
    cancelReminder,
    scheduleMultipleReminders,
    activeReminders,
    playNotificationSound,
  };
}