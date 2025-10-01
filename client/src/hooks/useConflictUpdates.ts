import { useEffect, useRef, useState, useCallback } from 'react';
import { Conflict } from '../types/conflict';

interface ConflictUpdateMessage {
  type: 'connected' | 'conflict:added' | 'conflict:updated' | 'conflict:deleted';
  data?: Conflict | { id: string };
  message?: string;
  timestamp: string;
}

export function useConflictUpdates(onUpdate?: (message: ConflictUpdateMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ConflictUpdateMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('Connected to conflict updates');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: ConflictUpdateMessage = JSON.parse(event.data);
        setLastUpdate(message);
        onUpdateRef.current?.(message);
        
        if (message.type !== 'connected') {
          console.log('Conflict update received:', message.type, message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from conflict updates');
      setIsConnected(false);
      
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 5000);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      connect();
    }

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, lastUpdate };
}
