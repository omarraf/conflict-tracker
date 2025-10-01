import { Download, Share2, FileJson, FileText, Copy, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Conflict } from '../types/conflict';

interface ExportPanelProps {
  conflicts: Conflict[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPanel({ conflicts, isOpen, onClose }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!isOpen) return null;

  const exportJSON = () => {
    const dataStr = JSON.stringify(conflicts, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `conflicts-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Region', 'Severity', 'Status', 'Start Date', 'Casualties', 'Countries', 'Latitude', 'Longitude', 'Description'];
    
    const csvRows = [
      headers.join(','),
      ...conflicts.map((c) =>
        [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          c.region,
          c.severity,
          c.status,
          c.startDate,
          c.casualties,
          `"${c.countries.join('; ')}"`,
          c.latitude,
          c.longitude,
          `"${c.description.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    
    const csvContent = csvRows.join('\n');
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const exportFileDefaultName = `conflicts-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareURL = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCopyError(true);
      setCopied(false);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Export & Share</h2>
          <p className="text-sm text-gray-400 mt-1">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Export Data</h3>
            <div className="space-y-2">
              <button
                onClick={exportJSON}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-colors text-left"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileJson className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Export as JSON</div>
                  <div className="text-xs text-gray-400">
                    Download filtered conflicts in JSON format
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-colors text-left"
              >
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Export as CSV</div>
                  <div className="text-xs text-gray-400">
                    Download in spreadsheet-compatible format
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Share URL */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Share Current View</h3>
            <button
              onClick={shareURL}
              className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-colors text-left"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Share2 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">Copy Shareable Link</div>
                <div className="text-xs text-gray-400">
                  {copyError ? 'Failed to copy - please try again' : 'Share current filters and timeline'}
                </div>
              </div>
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : copyError ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
