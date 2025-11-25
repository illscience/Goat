"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      
      return { hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (num: number) => num.toString().padStart(2, "0");

  if (!mounted) {
    return (
      <div className="countdown-digit">
        --:--:--
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="countdown-digit">{pad(timeLeft.hours)}</span>
      <span className="countdown-digit animate-blink">:</span>
      <span className="countdown-digit">{pad(timeLeft.minutes)}</span>
      <span className="countdown-digit animate-blink">:</span>
      <span className="countdown-digit">{pad(timeLeft.seconds)}</span>
    </div>
  );
}
