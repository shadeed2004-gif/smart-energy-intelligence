import { useState, useEffect } from 'react';
import api from '../services/api';
import type { SystemHealth } from '../types';

interface SystemStatus {
  haConnected: boolean;
  isDemo: boolean;
  health: SystemHealth | null;
}

export function useSystemStatus(): SystemStatus {
  const [haConnected, setHaConnected] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get<SystemHealth>('/health');
        setHealth(res.data);
        setIsDemo(res.data.demo_mode);
        const haService = res.data.services.find((s) => s.name === 'home_assistant');
        setHaConnected(haService?.status === 'ok');
      } catch {
        // Backend unreachable - stay with defaults
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { haConnected, isDemo, health };
}
