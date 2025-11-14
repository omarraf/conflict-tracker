import { useState, useMemo, useEffect } from 'react';
import { GitCompare, Download, Filter, Menu } from 'lucide-react';
import '@fontsource/inter';

import { MapboxGlobe } from './components/MapboxGlobe';
import { ConflictSidebar } from './components/ConflictSidebar';
import { FilterPanel } from './components/FilterPanel';
import { ComparisonView } from './components/ComparisonView';
import { ExportPanel } from './components/ExportPanel';
import { Conflict, FilterState } from './types/conflict';
import conflictsData from './data/conflicts.json';
import { useURLState } from './hooks/useURLState';
import { useIsMobile } from './hooks/use-is-mobile';

function App() {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [comparisonConflicts, setComparisonConflicts] = useState<Conflict[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>(conflictsData as Conflict[]);
  const [filters, setFilters] = useState<FilterState>({
    region: 'All Regions',
    severity: 'All Severities',
    timeline: 'All Time',
    searchQuery: '',
  });

  const { parseURLState, updateURL, isInitialized, setIsInitialized } = useURLState();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch('/api/conflicts')
      .then(res => res.json())
      .then(data => setConflicts(data))
      .catch(err => {
        console.error('Failed to fetch conflicts from API, using fallback data:', err);
        setConflicts(conflictsData as Conflict[]);
      });
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      const urlState = parseURLState();
      if (urlState.filters) {
        setFilters(urlState.filters);
      }
      setIsInitialized(true);
    }
  }, [isInitialized, parseURLState, setIsInitialized]);

  useEffect(() => {
    if (isInitialized) {
      updateURL(filters);
    }
  }, [filters, isInitialized, updateURL]);

  // Filter conflicts based on current filter state
  const filteredConflicts = useMemo(() => {
    let filtered = conflicts;

    // Filter by region
    if (filters.region !== 'All Regions') {
      filtered = filtered.filter((c) => c.region === filters.region);
    }

    // Filter by severity
    if (filters.severity !== 'All Severities') {
      filtered = filtered.filter((c) => c.severity === filters.severity);
    }

    // Filter by timeline preset
    if (filters.timeline !== 'All Time') {
      const now = new Date();
      const yearMap: Record<string, number> = {
        'Last Year': 1,
        'Last 5 Years': 5,
        'Last 10 Years': 10,
        'Last 20 Years': 20,
      };
      const years = yearMap[filters.timeline];
      if (years) {
        filtered = filtered.filter((c) => {
          const startDate = new Date(c.startDate);
          const yearsDiff =
            (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          return yearsDiff <= years;
        });
      }
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.countries.some((country) => country.toLowerCase().includes(query)) ||
          c.region.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [filters, conflicts]);

  console.log('Filtered conflicts count:', filteredConflicts.length);

  const toggleComparison = (conflict: Conflict) => {
    setComparisonConflicts((prev) => {
      const exists = prev.find((c) => c.id === conflict.id);
      if (exists) {
        return prev.filter((c) => c.id !== conflict.id);
      } else {
        if (prev.length >= 4) {
          alert('Maximum 4 conflicts can be compared at once. Please remove one before adding another.');
          return prev;
        }
        return [...prev, conflict];
      }
    });
  };

  const removeFromComparison = (id: string) => {
    setComparisonConflicts((prev) => {
      const newList = prev.filter((c) => c.id !== id);
      if (newList.length === 0) {
        setShowComparison(false);
      }
      return newList;
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Filter Panel - Responsive */}
      {isMobile ? (
        <>
          {/* Mobile Filter Button */}
          <div className="fixed top-4 left-4 z-40">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="bg-gray-900/95 hover:bg-gray-800 backdrop-blur-lg p-3 rounded-lg border border-white/20 shadow-xl transition-all"
            >
              <Filter className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Mobile Filters Modal */}
          {showMobileFilters && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl w-full max-w-sm mt-4">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-white hover:bg-white/10 p-2 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <FilterPanel
                    filters={filters}
                    onFilterChange={(newFilters) => {
                      setFilters(newFilters);
                      setShowMobileFilters(false);
                    }}
                    conflictCount={filteredConflicts.length}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="fixed top-6 left-6 z-40 w-80">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            conflictCount={filteredConflicts.length}
          />
        </div>
      )}

      {/* App Title - Responsive */}
      <div className={`fixed ${isMobile ? 'top-4 left-16 right-4' : 'top-6 left-1/2 transform -translate-x-1/2'} z-30 pointer-events-none`}>
        <div className="bg-gray-900/95 backdrop-blur-lg px-4 py-2 md:px-6 md:py-3 rounded-lg border border-white/10 shadow-2xl">
          <h1 className={`${isMobile ? 'text-lg text-left' : 'text-2xl text-center'} font-bold text-white`}>
            Global Conflict Tracker
          </h1>
          {!isMobile && (
            <p className="text-sm text-gray-400 text-center mt-1">
              Interactive 3D Globe Visualization
            </p>
          )}
        </div>
      </div>

      {/* Conflict Sidebar */}
      <ConflictSidebar
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onCompare={toggleComparison}
        isInComparison={selectedConflict ? comparisonConflicts.some((c) => c.id === selectedConflict.id) : false}
      />

      {/* Action Buttons - Responsive */}
      <div className={`fixed ${isMobile ? 'top-4 right-4' : 'top-6 right-6'} z-40 flex gap-2`}>
        {comparisonConflicts.length > 0 && (
          <button
            onClick={() => setShowComparison(true)}
            className="bg-blue-500/90 hover:bg-blue-500 backdrop-blur-lg px-3 py-2 md:px-4 md:py-3 rounded-lg border border-blue-400/30 shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-white" />
              {!isMobile && (
                <span className="text-white font-medium">
                  Compare ({comparisonConflicts.length})
                </span>
              )}
            </div>
          </button>
        )}
        <button
          onClick={() => setShowExport(true)}
          className="bg-gray-800/90 hover:bg-gray-700 backdrop-blur-lg px-3 py-2 md:px-4 md:py-3 rounded-lg border border-white/20 shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-white" />
            {!isMobile && <span className="text-white font-medium">Export</span>}
          </div>
        </button>
      </div>

      {/* Comparison View Modal */}
      {showComparison && (
        <ComparisonView
          conflicts={comparisonConflicts}
          onRemove={removeFromComparison}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Export Panel */}
      <ExportPanel
        conflicts={filteredConflicts}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Instructions - Hide on Mobile */}
      {!isMobile && (
        <div className="fixed bottom-6 right-6 z-30">
          <div className="bg-gray-900/90 backdrop-blur-lg px-4 py-2 rounded-lg border border-white/10 shadow-xl">
            <p className="text-xs text-gray-300 text-center">
              Drag to rotate • Scroll to zoom • Click markers for details
            </p>
          </div>
        </div>
      )}

      {/* Mapbox Globe */}
      <div className="absolute inset-0 w-full h-full">
        <MapboxGlobe
          conflicts={filteredConflicts}
          selectedConflict={selectedConflict}
          onSelectConflict={setSelectedConflict}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

export default App;
