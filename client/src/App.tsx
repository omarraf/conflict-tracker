import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import { GitCompare } from 'lucide-react';
import '@fontsource/inter';

import { Globe } from './components/Globe';
import { ConflictMarker } from './components/ConflictMarker';
import { ConflictSidebar } from './components/ConflictSidebar';
import { FilterPanel } from './components/FilterPanel';
import { Timeline } from './components/Timeline';
import { CameraController } from './components/CameraController';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ComparisonView } from './components/ComparisonView';
import { Conflict, FilterState } from './types/conflict';
import conflictsData from './data/conflicts.json';

function App() {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [timelineRange, setTimelineRange] = useState<[number, number]>([1989, 2025]);
  const [comparisonConflicts, setComparisonConflicts] = useState<Conflict[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    region: 'All Regions',
    severity: 'All Severities',
    timeline: 'All Time',
    searchQuery: '',
  });

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl', { 
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true 
      }) || canvas.getContext('experimental-webgl', {
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true
      });
      
      if (!gl) {
        console.warn('WebGL not available, using fallback UI');
        setWebglSupported(false);
      } else if ('isContextLost' in gl && (gl as WebGLRenderingContext).isContextLost()) {
        console.warn('WebGL context lost, using fallback UI');
        setWebglSupported(false);
      }
      
      canvas.addEventListener('webglcontextlost', () => {
        console.warn('WebGL context lost');
        setWebglSupported(false);
      });
    } catch (error) {
      console.error('Error checking WebGL support:', error);
      setWebglSupported(false);
    }
  }, []);

  // Filter conflicts based on current filter state
  const filteredConflicts = useMemo(() => {
    let filtered = conflictsData as Conflict[];

    // Filter by timeline year range
    filtered = filtered.filter((c) => {
      const startYear = new Date(c.startDate).getFullYear();
      return startYear >= timelineRange[0] && startYear <= timelineRange[1];
    });

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
  }, [filters, timelineRange]);

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
      {/* Filter Panel - Fixed Top Left */}
      <div className="fixed top-6 left-6 z-40 w-80">
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          conflictCount={filteredConflicts.length}
        />
      </div>

      {/* App Title - Fixed Top Center */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-gray-900/95 backdrop-blur-lg px-6 py-3 rounded-lg border border-white/10 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center">
            Global Conflict Tracker
          </h1>
          <p className="text-sm text-gray-400 text-center mt-1">
            Interactive 3D Globe Visualization
          </p>
        </div>
      </div>

      {/* Conflict Sidebar */}
      <ConflictSidebar
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onCompare={toggleComparison}
        isInComparison={selectedConflict ? comparisonConflicts.some((c) => c.id === selectedConflict.id) : false}
      />

      {/* Comparison Button - Fixed Top Right */}
      {comparisonConflicts.length > 0 && (
        <div className="fixed top-6 right-6 z-40">
          <button
            onClick={() => setShowComparison(true)}
            className="bg-blue-500/90 hover:bg-blue-500 backdrop-blur-lg px-4 py-3 rounded-lg border border-blue-400/30 shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                Compare ({comparisonConflicts.length})
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Comparison View Modal */}
      {showComparison && (
        <ComparisonView
          conflicts={comparisonConflicts}
          onRemove={removeFromComparison}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Timeline - Fixed Bottom Center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-[500px]">
        <Timeline
          onTimeRangeChange={(start, end) => {
            setTimelineRange([start, end]);
            setFilters(prev => ({ ...prev, timeline: 'All Time' }));
          }}
          minYear={1989}
          maxYear={2025}
        />
      </div>

      {/* Instructions - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="bg-gray-900/90 backdrop-blur-lg px-4 py-2 rounded-lg border border-white/10 shadow-xl">
          <p className="text-xs text-gray-300 text-center">
            Click and drag to rotate • Scroll to zoom • Click markers for details
          </p>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      {webglSupported ? (
        <ErrorBoundary>
          <Canvas
            camera={{
              position: [0, 0, 5],
              fov: 45,
              near: 0.1,
              far: 1000,
            }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: true,
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#000000', 1);
            }}
          >
            {/* Background */}
            <color attach="background" args={['#000000']} />
            
            {/* Stars */}
            <Stars
              radius={300}
              depth={60}
              count={5000}
              factor={7}
              saturation={0}
              fade
              speed={1}
            />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />

            {/* Globe and Markers */}
            <Suspense fallback={null}>
              <Globe />
              {filteredConflicts.map((conflict) => (
                <ConflictMarker
                  key={conflict.id}
                  conflict={conflict}
                  onSelect={setSelectedConflict}
                  isSelected={selectedConflict?.id === conflict.id}
                  globeRadius={2}
                />
              ))}
            </Suspense>

            {/* Camera Controller for animated transitions */}
            <CameraController 
              conflictCount={filteredConflicts.length}
              timelineRange={timelineRange}
            />

            {/* Camera Controls */}
            <OrbitControls
              makeDefault
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              rotateSpeed={0.5}
              zoomSpeed={0.8}
              enableDamping
              dampingFactor={0.05}
            />
          </Canvas>
        </ErrorBoundary>
      ) : (
        <div className="flex items-center justify-center h-screen bg-gray-950">
          <div className="text-center text-white p-8 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">WebGL Not Supported</h2>
            <p className="text-gray-400 mb-6">
              This application requires WebGL to render the 3D globe. Please try using a modern browser
              or check that WebGL is enabled in your browser settings.
            </p>
            <div className="bg-gray-900 rounded-lg p-6 border border-white/10">
              <h3 className="font-semibold mb-2">Available Conflicts ({filteredConflicts.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredConflicts.map((conflict) => (
                  <button
                    key={conflict.id}
                    onClick={() => setSelectedConflict(conflict)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    <div className="font-medium">{conflict.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{conflict.region}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
