import { Settings, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

interface AdminPanelProps {
  isConnected: boolean;
  lastUpdate: { type: string; timestamp: string } | null;
}

export function AdminPanel({ isConnected, lastUpdate }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-6 z-30">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800/90 hover:bg-gray-700 backdrop-blur-lg p-3 rounded-lg border border-white/20 shadow-xl transition-all hover:scale-105"
          title="Admin Settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-30 bg-gray-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Status
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm font-medium text-white">
              Real-time Updates
            </span>
          </div>
          <div className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Last Update</div>
            <div className="text-sm text-white mb-1">
              {lastUpdate.type.replace('conflict:', '').toUpperCase()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(lastUpdate.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
          Real-time conflict updates are enabled. Changes will appear automatically.
        </div>
      </div>
    </div>
  );
}
