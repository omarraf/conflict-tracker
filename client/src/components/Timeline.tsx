import { useEffect, useRef, useState } from 'react';
import { Calendar, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import gsap from 'gsap';

interface TimelineProps {
  onTimeRangeChange: (startYear: number, endYear: number) => void;
  minYear: number;
  maxYear: number;
}

export function Timeline({ onTimeRangeChange, minYear, maxYear }: TimelineProps) {
  const [range, setRange] = useState<[number, number]>([minYear, maxYear]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  const handleRangeChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setRange(newRange);
    onTimeRangeChange(newRange[0], newRange[1]);
  };

  const playTimeline = () => {
    setIsPlaying(true);
    
    const duration = (maxYear - range[0]) * 0.3;
    animationRef.current = gsap.to(
      {},
      {
        duration,
        ease: 'none',
        onUpdate: function() {
          const progress = this.progress();
          const currentEnd = range[0] + (maxYear - range[0]) * progress;
          const newRange: [number, number] = [range[0], Math.floor(currentEnd)];
          setRange(newRange);
          onTimeRangeChange(newRange[0], newRange[1]);
        },
        onComplete: () => {
          setIsPlaying(false);
        }
      }
    );
  };

  const pauseTimeline = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      animationRef.current.kill();
    }
  };

  const resetTimeline = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      animationRef.current.kill();
    }
    setRange([minYear, maxYear]);
    onTimeRangeChange(minYear, maxYear);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="bg-gray-900/95 backdrop-blur-lg border-white/10 text-white p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Timeline</h3>
            <span className="text-xs text-gray-400">
              ({range[0]} - {range[1]})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <Button
                size="sm"
                variant="outline"
                onClick={playTimeline}
                className="h-7 px-2 text-white border-white/30 hover:bg-white/10"
              >
                <Play className="h-3 w-3 mr-1" />
                Play
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={pauseTimeline}
                className="h-7 px-2 text-white border-white/30 hover:bg-white/10"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={resetTimeline}
              className="h-7 px-2 text-white border-white/30 hover:bg-white/10"
            >
              Reset
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white hover:bg-white/10"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{range[0]}</span>
              <span className="font-medium text-white">
                {range[1] - range[0] + 1} year{range[1] - range[0] !== 0 ? 's' : ''}
              </span>
              <span>{range[1]}</span>
            </div>
            <Slider
              min={minYear}
              max={maxYear}
              step={1}
              value={range}
              onValueChange={handleRangeChange}
              className="w-full"
              disabled={isPlaying}
            />
          </div>

          <div className="text-xs text-gray-400 text-center">
            Showing conflicts from {range[0]} to {range[1]}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
