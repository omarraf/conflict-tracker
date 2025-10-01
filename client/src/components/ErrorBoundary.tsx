import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-screen bg-gray-950">
          <Card className="bg-gray-900 border-red-500/50 p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-2xl font-bold">WebGL Error</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Unable to initialize 3D graphics. This may be because:
            </p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6 list-disc list-inside">
              <li>Your browser doesn't support WebGL</li>
              <li>WebGL is disabled in your browser settings</li>
              <li>Your graphics drivers need updating</li>
            </ul>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
