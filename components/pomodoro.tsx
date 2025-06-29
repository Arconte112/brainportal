"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { POMODORO } from '@/lib/constants';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(POMODORO.WORK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case 'work':
        return POMODORO.WORK_DURATION;
      case 'shortBreak':
        return POMODORO.SHORT_BREAK;
      case 'longBreak':
        return POMODORO.LONG_BREAK;
      default:
        return POMODORO.WORK_DURATION;
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      
      // Play alarm sound with proper cleanup
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/sounds/alarm.mp3');
        }
        audioRef.current.play().catch(error => {
          logger.error('Error playing sound', error, 'Pomodoro');
        });
      } catch (error) {
        logger.error('Error creating audio', error, 'Pomodoro');
      }
      
      const sessionName = sessionType === 'work' ? 'Sesión de trabajo' : 'Descanso';
      toast({
        title: `${sessionName} completado`,
        description: sessionType === 'work' 
          ? 'Es hora de tomar un descanso' 
          : 'Es hora de volver al trabajo',
      });

      if (sessionType === 'work') {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);
        if (newCompletedSessions % POMODORO.CYCLES_BEFORE_LONG_BREAK === 0) {
          setSessionType('longBreak');
          setTimeLeft(POMODORO.LONG_BREAK);
        } else {
          setSessionType('shortBreak');
          setTimeLeft(POMODORO.SHORT_BREAK);
        }
      } else {
        setSessionType('work');
        setTimeLeft(POMODORO.WORK_DURATION);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, sessionType, completedSessions, getDuration, toast]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSessionType('work');
    setTimeLeft(POMODORO.WORK_DURATION);
    setCompletedSessions(0);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentDuration = getDuration(sessionType);
  const progressPercentage = ((currentDuration - timeLeft) / currentDuration) * 100;

  const sessionLabel = sessionType === 'work' ? 'Enfoque' : sessionType === 'shortBreak' ? 'Descanso Corto' : 'Descanso Largo';

  return (
    <div className="w-full p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex flex-col items-center sm:items-start">
        <div className="text-sm font-medium text-muted-foreground">{sessionLabel}</div>
        <div className="text-4xl font-bold tabular-nums">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="w-full sm:w-auto flex-grow sm:max-w-xs">
        <Progress value={progressPercentage} className="h-2 w-full" />
        <p className="text-xs text-muted-foreground text-center mt-1">
          Sesiones: {completedSessions}
        </p>
      </div>

      <div className="flex space-x-2">
        <Button onClick={toggleTimer} variant={isActive ? "outline" : "default"} size="icon" aria-label={isActive ? 'Pause timer' : 'Start timer'}>
          {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button onClick={resetTimer} variant="outline" size="icon" aria-label="Reset timer">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}