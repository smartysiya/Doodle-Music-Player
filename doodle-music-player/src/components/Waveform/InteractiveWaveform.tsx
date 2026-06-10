import React, { useRef, useEffect, useState } from 'react';
import { useAudioStore } from '../../stores/audioStore';

interface WaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const InteractiveWaveform: React.FC<WaveformProps> = ({ audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { currentTrack, currentTime, duration, isPlaying, frequencyData } = useAudioStore();
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [isLoadingPeaks, setIsLoadingPeaks] = useState(false);

  const BAR_COUNT = 75;

  // Generate fallback peaks if decoding fails or is loading
  const generateFallbackPeaks = () => {
    const fallback: number[] = [];
    // Generate a nice symmetric pseudo-random shape representing a song waveform
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = i / BAR_COUNT;
      // Combine multiple sine waves for a natural song envelope
      const base = Math.sin(x * Math.PI) * 0.7;
      const noise = Math.sin(x * Math.PI * 8) * 0.15 + Math.sin(x * Math.PI * 20) * 0.08;
      const peak = Math.max(0.1, base + noise + Math.random() * 0.05);
      fallback.push(peak);
    }
    return fallback;
  };

  // Decode audio file to extract actual peaks
  useEffect(() => {
    if (!currentTrack) {
      setPeaks([]);
      return;
    }

    setIsLoadingPeaks(true);

    const loadPeaks = async () => {
      try {
        // If it's a blob object URL or local server file, try to fetch it
        const response = await fetch(currentTrack.fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const tempContext = new AudioContextClass();
        
        tempContext.decodeAudioData(
          arrayBuffer,
          (audioBuffer) => {
            const rawData = audioBuffer.getChannelData(0); // Channel 1 peaks
            const step = Math.floor(rawData.length / BAR_COUNT);
            const decodedPeaks: number[] = [];
            
            for (let i = 0; i < BAR_COUNT; i++) {
              let max = 0;
              const start = i * step;
              for (let j = 0; j < step; j++) {
                const val = Math.abs(rawData[start + j]);
                if (val > max) max = val;
              }
              // Add minor compression for visualization spacing
              decodedPeaks.push(Math.pow(max, 0.75));
            }
            
            // Normalize peaks
            const maxPeak = Math.max(...decodedPeaks, 0.01);
            const normalized = decodedPeaks.map((p) => Math.max(0.08, p / maxPeak));
            setPeaks(normalized);
            setIsLoadingPeaks(false);
            tempContext.close();
          },
          (err) => {
            console.error('Audio decoding error, falling back to procedural peaks:', err);
            setPeaks(generateFallbackPeaks());
            setIsLoadingPeaks(false);
            tempContext.close();
          }
        );
      } catch (err) {
        console.warn('Could not fetch/decode audio. CORS might prevent arrayBuffer read. Falling back to envelope:', err);
        setPeaks(generateFallbackPeaks());
        setIsLoadingPeaks(false);
      }
    };

    loadPeaks();
  }, [currentTrack]);

  // Handle canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activePeaks = peaks.length > 0 ? peaks : generateFallbackPeaks();
    const progress = duration > 0 ? currentTime / duration : 0;
    
    // Draw background sketchbook page card
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / BAR_COUNT;
    const gap = 3; // spacing between bars

    // Draw bars
    for (let i = 0; i < BAR_COUNT; i++) {
      const peak = activePeaks[i];
      const barHeight = peak * (canvas.height - 25);
      const x = i * barWidth + gap / 2;
      const y = (canvas.height - barHeight) / 2;
      const w = barWidth - gap;

      // Determine bar colors (Active progress is pink/purple gradient, unplayed is light gray)
      const isActive = i / BAR_COUNT <= progress;

      if (isActive) {
        // Active bar: hand-drawn neon pink/purple gradient
        const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        barGradient.addColorStop(0, '#f472b6'); // pink-400
        barGradient.addColorStop(0.5, '#a855f7'); // purple-500
        barGradient.addColorStop(1, '#6366f1'); // indigo-500
        ctx.fillStyle = barGradient;
      } else {
        // Unplayed bar: sketchbook light ink line
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'; // slate-400/40
      }

      // Draw sketchy vertical bar (slightly rounded cap)
      ctx.beginPath();
      ctx.roundRect(x, y, w, barHeight, 2);
      ctx.fill();

      // Add a double line for hand-drawn sketch feel on the active bars
      if (isActive && isPlaying && i === Math.floor(progress * BAR_COUNT)) {
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, w + 1, barHeight + 1);
      }
    }

    // Draw Real-time frequency FFT overlay centered on playhead position
    if (isPlaying && frequencyData && frequencyData.length > 0) {
      const playheadX = progress * canvas.width;
      const fftCount = Math.min(10, frequencyData.length / 4);
      
      ctx.save();
      ctx.lineWidth = 1.5;
      
      for (let j = 0; j < fftCount; j++) {
        // Map FFT amplitude to height
        const amp = (frequencyData[j * 2] / 255) * 15;
        const offsetX = j * 4;
        
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)'; // translucent pink
        
        // Draw bouncing lines around the playhead
        if (playheadX + offsetX < canvas.width) {
          ctx.beginPath();
          ctx.moveTo(playheadX + offsetX, (canvas.height / 2) - amp - 10);
          ctx.lineTo(playheadX + offsetX, (canvas.height / 2) + amp + 10);
          ctx.stroke();
        }
        
        if (playheadX - offsetX > 0 && offsetX > 0) {
          ctx.beginPath();
          ctx.moveTo(playheadX - offsetX, (canvas.height / 2) - amp - 10);
          ctx.lineTo(playheadX - offsetX, (canvas.height / 2) + amp + 10);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Draw playhead vertical line and hand-drawn circular handle
    const playheadX = progress * canvas.width;
    ctx.strokeStyle = 'var(--ink)';
    ctx.lineWidth = 2.5;

    // Draw sketchy playhead vertical line
    ctx.beginPath();
    ctx.moveTo(playheadX, 5);
    ctx.lineTo(playheadX, canvas.height - 5);
    ctx.stroke();

    // Playhead knob (circle)
    ctx.fillStyle = 'var(--bg-paper)';
    ctx.strokeStyle = 'var(--ink)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(playheadX, canvas.height / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small interior dot
    ctx.fillStyle = 'var(--accent)';
    ctx.beginPath();
    ctx.arc(playheadX, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [peaks, currentTime, duration, isPlaying, frequencyData]);

  // Handle click/drag seek calculations
  const calculateSeekTime = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * duration;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const seekTime = calculateSeekTime(e.clientX);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    
    const time = calculateSeekTime(e.clientX);
    setHoverTime(time);

    if (isDragging && audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTime(null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full">
      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={130}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full h-[130px] bg-transparent cursor-pointer rounded-xl"
        style={{ touchAction: 'none' }}
      />

      {/* Waveform loading state overlay */}
      {isLoadingPeaks && (
        <div className="absolute top-2 right-4 flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-950 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-full text-slate-800 dark:text-slate-100">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          Decoding Song Wave...
        </div>
      )}

      {/* Floating Hand-Drawn Tooltip on Hover */}
      {hoverTime !== null && duration > 0 && (
        <div
          className="absolute -top-9 pointer-events-none transform -translate-x-1/2 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border-2 border-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm z-30 font-mono sketch-card-static"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};
export default InteractiveWaveform;
