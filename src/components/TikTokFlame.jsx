import React from 'react';

/**
 * TikTok-style vibrant glowing Flame component for Study Streak
 */
export default function TikTokFlame({ streak = 0, size = 'md', className = '' }) {
  const isActive = streak > 0;

  // Size configurations
  const sizeMap = {
    sm: { width: 20, height: 24, spark: true },
    md: { width: 28, height: 32, spark: true },
    lg: { width: 40, height: 46, spark: true },
    xl: { width: 56, height: 64, spark: true },
  };

  const { width, height } = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width, height }}
      title={isActive ? `Chuỗi học tập: ${streak} ngày liên tục 🔥` : 'Chưa có chuỗi ngày học'}
    >
      {/* Ambient background glow aura when active */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-600/35 via-amber-500/25 to-yellow-300/20 blur-md pointer-events-none scale-125"
          aria-hidden="true"
        />
      )}

      {/* Layered TikTok Flame SVG */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 36 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isActive ? 'tiktok-flame-active' : 'opacity-60 grayscale-[40%]'}
      >
        <defs>
          {/* Outer Fire Gradient (Deep Red-Orange -> Amber) */}
          <linearGradient id="ttOuterFire" x1="18" y1="42" x2="18" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="25%" stopColor="#FF3815" />
            <stop offset="65%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#FFAE00" />
          </linearGradient>

          {/* Mid Fire Gradient (Vibrant Orange -> Warm Golden Yellow) */}
          <linearGradient id="ttMidFire" x1="18" y1="38" x2="18" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="40%" stopColor="#FF9100" />
            <stop offset="100%" stopColor="#FFD000" />
          </linearGradient>

          {/* Inner Core Flame (Bright Yellow -> White Glow Heart) */}
          <linearGradient id="ttCoreFire" x1="18" y1="36" x2="18" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA600" />
            <stop offset="50%" stopColor="#FFF066" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* 1. Outer Flame Silhouette */}
        <path
          d="M17.8 2C17.8 2 13.5 8.2 13.5 13.5C13.5 14.7 13.8 15.8 14.3 16.8C12.5 15.2 11.2 12.8 11.2 10.2C7.2 13.8 4 19.3 4 25.5C4 33.5 10.2 40 18 40C25.8 40 32 33.5 32 25.5C32 17.5 25.5 10.8 22.8 7.5C22.2 10.2 20.2 12.2 18.8 12.8C19.5 9.5 19.2 5.5 17.8 2Z"
          fill="url(#ttOuterFire)"
        />

        {/* 2. Middle Radiant Flame */}
        <path
          d="M18 10C18 10 14.5 14.5 14.5 19C14.5 20.2 14.8 21.2 15.4 22C13.8 20.5 12.8 18.2 12.8 16C10 19 8.5 23 8.5 27.2C8.5 33 12.8 37.5 18 37.5C23.2 37.5 27.5 33 27.5 27.2C27.5 21 23 16 21.2 13.8C20.8 15.8 19.5 17.2 18.5 17.8C19 15 18.8 12 18 10Z"
          fill="url(#ttMidFire)"
        />

        {/* 3. Inner White-Hot Core */}
        <path
          d="M18 20C18 20 15.5 23.5 15.5 26.5C15.5 28 16.2 29 17 29.8C16.2 28.8 15.8 27.5 15.8 26.2C14.8 27.5 14.2 29 14.2 30.5C14.2 33.2 15.9 35 18 35C20.1 35 21.8 33.2 21.8 30.5C21.8 27.8 19.8 24.5 19 22.8C18.8 23.8 18.2 24.8 17.8 25C18.2 23.5 18.2 21.5 18 20Z"
          fill="url(#ttCoreFire)"
        />
      </svg>

      {/* Tiny Spark Particles floating up when active */}
      {isActive && (
        <>
          <span
            className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping opacity-80 pointer-events-none"
            style={{ animationDuration: '1.2s' }}
          />
          <span
            className="absolute top-1 -left-0.5 w-1 h-1 rounded-full bg-orange-400 animate-pulse pointer-events-none"
            style={{ animationDuration: '0.9s' }}
          />
        </>
      )}
    </div>
  );
}
