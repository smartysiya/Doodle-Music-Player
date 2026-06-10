import { useEffect, useRef } from 'react';
import { useAudioStore, DoodleState } from '../stores/audioStore';

export const useAudioAnalyzer = (audioRef: React.RefObject<HTMLAudioElement>) => {
  const { isPlaying, setAudioMetrics, setDoodleState } = useAudioStore();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const bassHistoryRef = useRef<number[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const silenceDurationRef = useRef<number>(0);

  // Maximum frames to keep in bass history for rolling average
  const HISTORY_MAX_LEN = 30;

  // Initialize the audio context and analyzer nodes
  const initAudio = () => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; // 128 bins

      // Connect source
      const source = ctx.createMediaElementAudioSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.error('Failed to initialize Web Audio API context:', e);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      // Resume AudioContext if it was suspended (browser autoplay restrictions)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      } else {
        initAudio();
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef]);

  // Main animation frame processing loop
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      // Start counting silence when paused to put the doodle to sleep
      if (!silenceTimerRef.current) {
        silenceDurationRef.current = 0;
        silenceTimerRef.current = window.setInterval(() => {
          silenceDurationRef.current += 1;
          if (silenceDurationRef.current >= 12) { // 12 seconds
            setDoodleState('sleeping');
          } else if (silenceDurationRef.current >= 1) {
            setDoodleState('idle');
          }
        }, 1000);
      }
      
      return;
    }

    // Clear silence timer if playing
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceDurationRef.current = 0;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!isPlaying) return;

      analyser.getByteFrequencyData(dataArray);

      // Convert frequency data to array for store
      const frequencyData = Array.from(dataArray);

      // Define frequency bands
      // Bass: 0 to ~12 bins (approx 0 - 200 Hz with 128 bins)
      // Mids: 13 to ~60 bins (approx 200 - 1000 Hz)
      // Treble: 61 to 128 bins (> 1000 Hz)
      
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      const bassEnd = 12;
      const midEnd = 60;

      for (let i = 0; i < bufferLength; i++) {
        if (i <= bassEnd) {
          bassSum += dataArray[i];
        } else if (i <= midEnd) {
          midSum += dataArray[i];
        } else {
          trebleSum += dataArray[i];
        }
      }

      const bassEnergy = bassSum / (bassEnd + 1);
      const midEnergy = midSum / (midEnd - bassEnd);
      const trebleEnergy = trebleSum / (bufferLength - midEnd);

      // Beat detection algorithm using rolling history
      let isBeat = false;
      const history = bassHistoryRef.current;
      
      if (history.length > 0) {
        const historySum = history.reduce((acc, val) => acc + val, 0);
        const historyAverage = historySum / history.length;
        
        // Threshold multiplier: higher threshold makes it harder to trigger a beat
        // Dynamic threshold based on average energy to prevent false positives in quiet/loud parts
        const threshold = historyAverage > 150 ? 1.25 : 1.35;
        
        // Check if current bass exceeds the rolling average * threshold
        // Also ensure bass energy is above a baseline to avoid beats in silence
        if (bassEnergy > historyAverage * threshold && bassEnergy > 60) {
          isBeat = true;
        }
      }

      // Add current energy to history and keep size constrained
      history.push(bassEnergy);
      if (history.length > HISTORY_MAX_LEN) {
        history.shift();
      }

      // Determine Doodle state
      let newState: DoodleState = 'idle';
      
      if (isBeat) {
        if (bassEnergy > 165) {
          newState = 'excited';
        } else {
          newState = 'dancing';
        }
      } else {
        // Continue bobbing or dancing based on active energy levels if no immediate beat
        if (bassEnergy > 90) {
          newState = 'dancing';
        } else if (bassEnergy > 45) {
          newState = 'headBob';
        } else {
          newState = 'idle';
        }
      }

      setDoodleState(newState);
      setAudioMetrics({
        bassEnergy,
        midEnergy,
        trebleEnergy,
        isBeat,
        frequencyData,
      });

      animationFrameIdRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, setAudioMetrics, setDoodleState]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
    };
  }, []);
  
  return {
    initAudio,
    analyser: analyserRef.current,
  };
};
