import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, MapPin, Users, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Conflict } from '../types/conflict';
import { Separator } from './ui/separator';

export function ConflictReviewPanel() {
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [curatedConflicts, setCuratedConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [selectedCuratedTarget, setSelectedCuratedTarget] = useState<string>('');

  // Fetch pending and curated conflicts
  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      const response = await fetch('/api/conflicts');
      const allConflicts: Conflict[] = await response.json();

      const pending = allConflicts.filter(c => c.isAutoIngested);
      const curated = allConflicts.filter(c => !c.isAutoIngested);

      setPendingConflicts(pending);
      setCuratedConflicts(curated);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteToCurated = async (conflictId: string) => {
    if (!confirm('Promote this conflict to curated? It will appear on the map.')) return;

    try {
      const response = await fetch(`/api/admin/conflicts/${conflictId}/promote`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Conflict promoted to curated!');
        loadConflicts();
        setSelectedConflict(null);
      } else {
        alert('Failed to promote conflict');
      }
    } catch (error) {
      console.error('Error promoting conflict:', error);
      alert('Error promoting conflict');
    }
  };

  const matchToExisting = async (autoConflictId: string, curatedConflictId: string) => {
    if (!curatedConflictId) {
      alert('Please select a conflict to match to');
      return;
    }

    try {
      const response = await fetch(`/api/admin/conflicts/${autoConflictId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetConflictId: curatedConflictId }),
      });

      if (response.ok) {
        alert('Articles matched successfully!');
        loadConflicts();
        setSelectedConflict(null);
        setSelectedCuratedTarget('');
      } else {
        alert('Failed to match articles');
      }
    } catch (error) {
      console.error('Error matching articles:', error);
      alert('Error matching articles');
    }
  };

  const dismissConflict = async (conflictId: string) => {
    if (!confirm('Delete this conflict? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/conflicts/${conflictId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Conflict dismissed');
        loadConflicts();
        setSelectedConflict(null);
      } else {
        alert('Failed to dismiss conflict');
      }
    } catch (error) {
      console.error('Error dismissing conflict:', error);
      alert('Error dismissing conflict');
    }
  };

  if (loading) {
    return (
      <div className="fixed top-20 right-6 w-96 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-lg p-4 text-white">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (pendingConflicts.length === 0) {
    return (
      <div className="fixed top-20 right-6 w-96 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-lg p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold">All Clear!</h3>
        </div>
        <p className="text-sm text-gray-400">No pending conflicts to review.</p>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-6 w-[500px] max-h-[80vh] bg-gray-900/95 backdrop-blur-lg border border-yellow-500/30 rounded-lg shadow-2xl text-white overflow-hidden">
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h2 className="font-bold text-lg">Pending Review</h2>
          <Badge className="bg-yellow-500/20 text-yellow-300 ml-auto">
            {pendingConflicts.length} conflict{pendingConflicts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Auto-ingested conflicts that didn't match existing entries
        </p>
      </div>

      <ScrollArea className="h-[calc(80vh-80px)]">
        <div className="p-4 space-y-3">
          {pendingConflicts.map((conflict) => (
            <Card
              key={conflict.id}
              className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => setSelectedConflict(conflict)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{conflict.name}</h3>
                <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                  {conflict.severity}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{conflict.region}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{conflict.countries.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>{conflict.mediaLinks.length} article(s)</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    promoteToCurated(conflict.id);
                  }}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Promote
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConflict(conflict);
                  }}
                >
                  <LinkIcon className="h-3 w-3 mr-1" />
                  Match
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissConflict(conflict.id);
                  }}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Matching Modal */}
      {selectedConflict && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-white/20 p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Match Articles</h3>
            <p className="text-sm text-gray-400 mb-4">
              Match articles from "{selectedConflict.name}" to an existing curated conflict:
            </p>

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Select Curated Conflict:</label>
              <select
                className="w-full bg-gray-700 border border-white/20 rounded p-2 text-sm"
                value={selectedCuratedTarget}
                onChange={(e) => setSelectedCuratedTarget(e.target.value)}
              >
                <option value="">-- Select conflict --</option>
                {curatedConflicts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>

            <Separator className="bg-white/10 my-4" />

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={() => matchToExisting(selectedConflict.id, selectedCuratedTarget)}
              >
                Match Articles
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedConflict(null);
                  setSelectedCuratedTarget('');
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
