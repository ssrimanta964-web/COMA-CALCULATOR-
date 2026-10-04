import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface FunnyLoadingScreenProps {
  onFinish: () => void;
}

export const FunnyLoadingScreen: React.FC<FunnyLoadingScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef(false);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnd = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setProgress(100);

    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasFinishedRef.current) return;

    video.loop = false;
    video.muted = true;
    video.defaultMuted = true;

    // Start playback once
    video.play().catch(() => {});

    // Tap anywhere on screen to unmute
    const handleUserTap = () => {
      if (video && !hasFinishedRef.current) {
        video.muted = false;
        video.volume = 1.0;
        setIsMuted(false);
      }
    };

    window.addEventListener('touchstart', handleUserTap, { passive: true });
    window.addEventListener('pointerdown', handleUserTap, { passive: true });
    window.addEventListener('click', handleUserTap, { passive: true });

    // Smooth progress bar update synced directly to video playback
    let animId: number;
    const tick = () => {
      if (video && video.duration && !hasFinishedRef.current) {
        const pct = Math.min(100, Math.max(0, (video.currentTime / video.duration) * 100));
        setProgress(pct);

        // When reaching the final frame of the 4.48s clip, finish and transition immediately
        if (video.currentTime >= video.duration - 0.08) {
          handleEnd();
          return;
        }
      }
      if (!hasFinishedRef.current) {
        animId = requestAnimationFrame(tick);
      }
    };
    animId = requestAnimationFrame(tick);

    // Guaranteed single-play duration safety timer:
    // Ensures the loading screen transitions after 4.7s maximum under any network/device condition
    finishTimeoutRef.current = setTimeout(() => {
      handleEnd();
    }, 4700);

    return () => {
      cancelAnimationFrame(animId);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
      window.removeEventListener('touchstart', handleUserTap);
      window.removeEventListener('pointerdown', handleUserTap);
      window.removeEventListener('click', handleUserTap);
    };
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      video.volume = 1.0;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none transition-opacity duration-200 px-0 sm:px-4 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Floating Sound Toggle Pill with Android notch / status bar safe area */}
      {isMuted && !isFadingOut && (
        <button
          onClick={handleToggleSound}
          style={{
            top: 'max(1.25rem, env(safe-area-inset-top, 0px))',
            right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
          }}
          className="absolute z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/25 text-white text-xs font-semibold backdrop-blur-md shadow-xl animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-rose-400" />
          <span>Tap for sound 🔊</span>
        </button>
      )}

      {/* Subtle indicator when unmuted */}
      {!isMuted && !isFadingOut && (
        <div
          style={{
            top: 'max(1.25rem, env(safe-area-inset-top, 0px))',
            right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
          }}
          className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 text-emerald-400 text-xs backdrop-blur-md border border-emerald-500/30"
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-[11px] font-mono font-medium">Sound ON</span>
        </div>
      )}

      {/* Centered Animation Card & Directly Attached Loading Line (Edge-to-Edge on Mobile) */}
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col items-center justify-center">
        {/* Animation Video Frame: Flush edge-to-edge on mobile */}
        <div className="w-full aspect-video max-h-[70vh] flex items-center justify-center rounded-none sm:rounded-2xl overflow-hidden shadow-2xl bg-black relative">
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            playsInline
            muted
            preload="auto"
            loop={false}
            onEnded={handleEnd}
            onError={handleEnd}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Loading Line Exactly Under The Animation */}
        <div className="w-[85%] max-w-xs sm:max-w-md mt-4 sm:mt-5 flex flex-col items-center gap-2">
          {/* Progress Capsule Track */}
          <div className="w-full h-1.5 sm:h-2 bg-slate-900/90 rounded-full border border-white/15 shadow-inner overflow-hidden relative p-[1px]">
            {/* Glowing Filling Bar */}
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.9)] transition-all duration-75 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Glowing Leading Spark Head */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] opacity-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
