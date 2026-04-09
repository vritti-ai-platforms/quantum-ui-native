import { useEffect, useState } from 'react';

export interface TimerHandle {
  timer: number;
  startTimer: (seconds?: number) => void;
}

// Generic countdown timer — decrements every second until 0
export function useTimer(initial = 0): TimerHandle {
  const [timer, setTimer] = useState(initial);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  return { timer, startTimer: (seconds = 45) => setTimer(seconds) };
}
