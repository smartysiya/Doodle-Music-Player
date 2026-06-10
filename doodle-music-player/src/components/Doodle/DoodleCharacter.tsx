import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../../stores/audioStore';

// Particle interface for floats (Zzz, Hearts, Stars)
interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'star' | 'note' | 'zzz';
  text?: string;
  color: string;
  size: number;
}

export const DoodleCharacter: React.FC = () => {
  const { doodleState, isBeat, bassEnergy, midEnergy } = useAudioStore();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickReaction, setClickReaction] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);

  // Trigger floating particles on beats or custom states
  useEffect(() => {
    if (doodleState === 'sleeping') {
      // Spawn Zzz particles periodically
      const interval = setInterval(() => {
        const id = Date.now() + Math.random();
        setParticles((prev) => [
          ...prev,
          {
            id,
            x: 95 + Math.random() * 10,
            y: 45,
            type: 'zzz',
            text: Math.random() > 0.5 ? 'Z' : 'z',
            color: '#a855f7',
            size: 14 + Math.random() * 8,
          },
        ]);
      }, 1500);
      return () => clearInterval(interval);
    }
    
    if (isBeat) {
      // Spawn stars or music notes on beats based on energy levels
      const particleCount = bassEnergy > 160 ? 3 : 1;
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const id = Date.now() + i + Math.random();
        const types: Array<'heart' | 'star' | 'note'> = ['heart', 'star', 'note'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const colors = ['#f472b6', '#a855f7', '#fbbf24', '#38bdf8', '#4ade80'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const notes = ['♪', '♫', '♬', '♩'];
        const randomNote = randomType === 'note' ? notes[Math.floor(Math.random() * notes.length)] : undefined;
        
        newParticles.push({
          id,
          x: 20 + Math.random() * 100,
          y: 30 + Math.random() * 40,
          type: randomType === 'zzz' ? 'note' : randomType,
          text: randomNote,
          color: randomColor,
          size: 16 + Math.random() * 12,
        });
      }
      
      setParticles((prev) => [...prev, ...newParticles].slice(-25)); // Cap list length
    }
  }, [isBeat, doodleState, bassEnergy]);

  // Clean up expired particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [particles]);

  const handleCharacterClick = () => {
    setClickReaction(true);
    setClickCount((prev) => prev + 1);
    
    // Spawn a burst of hearts and stars on click
    const clickId = Date.now();
    const burst: Particle[] = Array.from({ length: 6 }).map((_, idx) => ({
      id: clickId + idx,
      x: 70 + (Math.random() - 0.5) * 40,
      y: 50 + (Math.random() - 0.5) * 40,
      type: Math.random() > 0.5 ? 'heart' : 'star',
      color: idx % 2 === 0 ? '#f472b6' : '#fbbf24',
      size: 18 + Math.random() * 10,
    }));
    
    setParticles((prev) => [...prev, ...burst]);
    
    setTimeout(() => {
      setClickReaction(false);
    }, 1200);
  };

  // Determine current face path, eye shapes, and posture parameters
  const getDoodleFace = () => {
    // Return custom paths/elements for eyes and mouth based on state
    if (clickReaction) {
      return {
        leftEye: <path d="M 50 42 L 58 46 L 50 50" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />,
        rightEye: <path d="M 90 42 L 82 46 L 90 50" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />,
        mouth: <path d="M 60 62 Q 70 78 80 62" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
        blush: true,
      };
    }

    switch (doodleState) {
      case 'sleeping':
        return {
          leftEye: <path d="M 52 46 Q 60 50 64 46" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
          rightEye: <path d="M 76 46 Q 80 50 88 46" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
          mouth: <path d="M 68 58 Q 70 60 72 58" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />,
          blush: false,
        };
      case 'calm':
        return {
          leftEye: <path d="M 52 46 Q 58 40 64 46" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
          rightEye: <path d="M 76 46 Q 82 40 88 46" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
          mouth: <path d="M 64 58 Q 70 64 76 58" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />,
          blush: true,
        };
      case 'excited':
        return {
          // Open oval mouth singing/screaming, star eyes
          leftEye: <path d="M 50 46 L 62 46 M 56 40 L 56 52" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />,
          rightEye: <path d="M 78 46 L 90 46 M 84 40 L 84 52" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />,
          mouth: <ellipse cx="70" cy="64" rx="9" ry="12" fill="#f472b6" stroke="var(--ink)" strokeWidth="3" />,
          blush: true,
        };
      case 'dancing':
        return {
          leftEye: <circle cx="58" cy="44" r="5" fill="var(--ink)" />,
          rightEye: <circle cx="82" cy="44" r="5" fill="var(--ink)" />,
          mouth: <path d="M 60 58 Q 70 72 80 58 Z" fill="#fbcfe8" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />,
          blush: true,
        };
      case 'headBob':
        return {
          leftEye: <circle cx="58" cy="44" r="4.5" fill="var(--ink)" />,
          rightEye: <circle cx="82" cy="44" r="4.5" fill="var(--ink)" />,
          mouth: <path d="M 62 58 Q 70 65 78 58" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
          blush: false,
        };
      case 'idle':
      default:
        return {
          leftEye: <circle cx="58" cy="44" r="4.5" fill="var(--ink)" />,
          rightEye: <circle cx="82" cy="44" r="4.5" fill="var(--ink)" />,
          mouth: <path d="M 62 58 Q 70 66 78 58" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />,
          blush: false,
        };
    }
  };

  const face = getDoodleFace();

  // Head and body animation variants based on doodleState
  const headVariants = {
    idle: {
      y: [0, -2, 0],
      rotate: [0, 1, 0, -1, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    },
    headBob: {
      y: [0, -12, 0],
      rotate: [0, 4, 0, -4, 0],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
    },
    dancing: {
      y: [0, -14, 0],
      rotate: [-6, 6, -6],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      y: [0, -22, 0],
      rotate: [-14, 14, -14],
      transition: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' }
    },
    calm: {
      y: [0, -3, 0],
      rotate: [0, 1.5, 0, -1.5, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    },
    sleeping: {
      y: [0, -1, 0],
      rotate: [5, 6, 5],
      transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  const bodyVariants = {
    idle: {
      y: [0, -1, 0],
      scaleY: [1, 1.01, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    },
    headBob: {
      y: [0, -5, 0],
      scaleY: [1, 0.95, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
    },
    dancing: {
      y: [0, -8, 0],
      rotate: [-3, 3, -3],
      scaleY: [1, 0.9, 1.05, 1],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      y: [0, -20, 0],
      scaleY: [1, 0.8, 1.15, 1],
      rotate: [-5, 5, -5],
      transition: { duration: 0.35, repeat: Infinity, ease: 'easeInOut' }
    },
    calm: {
      y: [0, -1.5, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    },
    sleeping: {
      rotate: [75, 75, 75], // lying down
      y: [12, 11, 12],
      x: [-12, -12, -12],
      transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  const leftArmVariants = {
    idle: { rotate: [0, -5, 0], transition: { duration: 3, repeat: Infinity } },
    headBob: { rotate: [-10, 10, -10], transition: { duration: 1, repeat: Infinity } },
    dancing: {
      rotate: [-45, 10, -45],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      rotate: [-140, -160, -140],
      y: [-2, 2, -2],
      transition: { duration: 0.35, repeat: Infinity }
    },
    calm: { rotate: [30, 25, 30], transition: { duration: 4, repeat: Infinity } },
    sleeping: { rotate: [45, 48, 45], transition: { duration: 5, repeat: Infinity } }
  };

  const rightArmVariants = {
    idle: { rotate: [0, 5, 0], transition: { duration: 3, repeat: Infinity } },
    headBob: { rotate: [10, -10, 10], transition: { duration: 1, repeat: Infinity } },
    dancing: {
      rotate: [10, -45, 10],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      rotate: [140, 160, 140],
      y: [-2, 2, -2],
      transition: { duration: 0.35, repeat: Infinity }
    },
    calm: { rotate: [-30, -25, -30], transition: { duration: 4, repeat: Infinity } },
    sleeping: { rotate: [60, 63, 60], transition: { duration: 5, repeat: Infinity } }
  };

  const leftLegVariants = {
    idle: { rotate: [0, -2, 0], transition: { duration: 3, repeat: Infinity } },
    headBob: { scaleY: [1, 0.95, 1.02, 1], transition: { duration: 0.5, repeat: Infinity } },
    dancing: {
      rotate: [-20, 10, -20],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      rotate: [-40, -10, -40],
      y: [0, -3, 0],
      transition: { duration: 0.35, repeat: Infinity }
    },
    calm: { rotate: [60, 58, 60], y: [1, 2, 1], transition: { duration: 4, repeat: Infinity } }, // Cross-legged look
    sleeping: { rotate: [15, 16, 15], transition: { duration: 5, repeat: Infinity } }
  };

  const rightLegVariants = {
    idle: { rotate: [0, 2, 0], transition: { duration: 3, repeat: Infinity } },
    headBob: { scaleY: [1, 0.95, 1.02, 1], transition: { duration: 0.5, repeat: Infinity } },
    dancing: {
      rotate: [10, -20, 10],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    excited: {
      rotate: [10, 40, 10],
      y: [0, -3, 0],
      transition: { duration: 0.35, repeat: Infinity }
    },
    calm: { rotate: [-60, -58, -60], y: [1, 2, 1], transition: { duration: 4, repeat: Infinity } }, // Cross-legged look
    sleeping: { rotate: [10, 9, 10], transition: { duration: 5, repeat: Infinity } }
  };

  // Pulse effect on headphones based on beat detection and intensity
  const headphoneScale = isBeat ? 1.15 : 1 + (midEnergy / 255) * 0.1;

  return (
    <div className="relative flex items-center justify-center w-full max-w-[240px] h-[260px] cursor-pointer" onClick={handleCharacterClick}>
      {/* Floating Sparkles & Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.5, x: p.x - 70, y: p.y - 120 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1.2, 1, 0.8],
              y: p.y - 120 - 75 - (p.type === 'zzz' ? 40 : 20),
              x: p.x - 70 + (p.type === 'zzz' ? 25 : (Math.random() - 0.5) * 45),
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.type === 'zzz' ? 2.5 : 1.5, ease: 'easeOut' }}
            className="absolute pointer-events-none select-none font-bold"
            style={{
              color: p.color,
              fontSize: p.size,
              fontFamily: p.type === 'zzz' ? 'var(--font-doodle)' : 'inherit',
            }}
          >
            {p.type === 'heart' && '❤️'}
            {p.type === 'star' && '⭐'}
            {p.type === 'zzz' && p.text}
            {p.type === 'note' && p.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Cloud (only visible in Calm and Sleeping states) */}
      {(doodleState === 'calm' || doodleState === 'sleeping') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 0.85,
            scale: 1,
            y: doodleState === 'sleeping' ? [10, 15, 10] : [20, 25, 20],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 w-[170px] h-[50px] pointer-events-none"
        >
          <svg viewBox="0 0 170 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 35 C15 35 10 30 10 25 C10 18 18 12 28 15 C32 8 45 4 58 8 C68 2 82 2 92 8 C102 3 115 5 122 12 C132 8 148 10 152 20 C160 22 162 30 155 35 C160 40 150 48 140 45 C130 48 115 45 105 42 C92 48 78 48 65 44 C52 48 38 46 25 43 C20 44 20 35 20 35 Z"
              fill="white"
              stroke="var(--ink)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}

      {/* Main Stick Figure Character */}
      <motion.div
        animate={doodleState}
        className="w-full h-full flex items-center justify-center"
      >
        <svg
          width="180"
          height="220"
          viewBox="0 0 140 170"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Shadows / Under-scribbles */}
          <ellipse cx="70" cy="155" rx="35" ry="5" fill="rgba(30, 41, 59, 0.12)" />

          {/* MAIN BODY CONTAINER */}
          <motion.g variants={bodyVariants}>
            {/* Left Leg */}
            <motion.g
              variants={leftLegVariants}
              style={{ originX: '53px', originY: '115px' }}
            >
              <path
                d="M 53 115 C 45 130 42 145 40 154"
                stroke="var(--ink)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 40 154 C 36 154 30 153 32 157 C 34 160 42 158 44 154"
                stroke="var(--ink)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </motion.g>

            {/* Right Leg */}
            <motion.g
              variants={rightLegVariants}
              style={{ originX: '87px', originY: '115px' }}
            >
              <path
                d="M 87 115 C 95 130 98 145 100 154"
                stroke="var(--ink)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 100 154 C 104 154 110 153 108 157 C 106 160 98 158 96 154"
                stroke="var(--ink)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </motion.g>

            {/* Torso/Spine (hand-drawn scribbly look) */}
            <path
              d="M 70 65 Q 67 90 70 115"
              stroke="var(--ink)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Little cute belly doodle */}
            {doodleState !== 'sleeping' && (
              <path d="M 67 95 Q 70 99 73 95" stroke="var(--ink)" strokeWidth="2.5" />
            )}

            {/* Left Arm */}
            <motion.g
              variants={leftArmVariants}
              style={{ originX: '68px', originY: '72px' }}
            >
              {clickReaction ? (
                // Waving hand
                <path
                  d="M 68 72 Q 40 65 28 40 Q 20 25 32 30"
                  stroke="var(--ink)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M 68 72 C 50 85 35 95 24 88"
                  stroke="var(--ink)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {/* Left Hand circle */}
              <circle cx={clickReaction ? 30 : 22} cy={clickReaction ? 32 : 87} r="3.5" fill="var(--ink)" />
            </motion.g>

            {/* Right Arm */}
            <motion.g
              variants={rightArmVariants}
              style={{ originX: '72px', originY: '72px' }}
            >
              {/* Simple arm path holding guitar or dancing */}
              {doodleState === 'excited' || doodleState === 'dancing' ? (
                <path
                  d="M 72 72 Q 95 60 116 48"
                  stroke="var(--ink)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M 72 72 C 90 85 105 95 116 88"
                  stroke="var(--ink)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {/* Right Hand circle */}
              <circle cx={doodleState === 'excited' || doodleState === 'dancing' ? 116 : 118} cy={doodleState === 'excited' || doodleState === 'dancing' ? 48 : 87} r="3.5" fill="var(--ink)" />
            </motion.g>

            {/* HEAD & FACE */}
            <motion.g
              variants={headVariants}
              style={{ originX: '70px', originY: '60px' }}
            >
              {/* Hand drawn Head Circle */}
              <path
                d="M 70 15 C 88 15 103 26 102 46 C 101 64 85 75 70 75 C 53 75 39 64 38 46 C 37 26 52 15 70 15 Z"
                fill="var(--bg-paper)"
                stroke="var(--ink)"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* Face Features */}
              {face.leftEye}
              {face.rightEye}
              {face.mouth}

              {/* Rosy Cheeks */}
              {face.blush && (
                <>
                  <circle cx="48" cy="52" r="4" fill="#f472b6" opacity="0.65" />
                  <circle cx="92" cy="52" r="4" fill="#f472b6" opacity="0.65" />
                </>
              )}

              {/* Headband / Hair */}
              <path
                d="M 50 19 Q 70 23 90 19"
                stroke="var(--ink)"
                strokeWidth="2.5"
                fill="none"
              />

              {/* Headphones - Arc */}
              <motion.path
                d="M 39 46 C 39 20 101 20 101 46"
                stroke="#a855f7"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                style={{ scale: headphoneScale, originX: '70px', originY: '46px' }}
              />

              {/* Headphones - Left Cup */}
              <motion.rect
                x="32"
                y="36"
                width="10"
                height="20"
                rx="5"
                fill="#ec4899"
                stroke="var(--ink)"
                strokeWidth="2.5"
                style={{ scale: headphoneScale, originX: '37px', originY: '46px' }}
              />
              
              {/* Headphones - Right Cup */}
              <motion.rect
                x="98"
                y="36"
                width="10"
                height="20"
                rx="5"
                fill="#ec4899"
                stroke="var(--ink)"
                strokeWidth="2.5"
                style={{ scale: headphoneScale, originX: '103px', originY: '46px' }}
              />
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
};
export default DoodleCharacter;
