'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export default function LoadingAnimation() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Remove loading screen after fade out completes
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full animate-ping"></div>
          </div>
          
          {/* Middle rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-t-4 border-blue-400 rounded-full animate-spin"></div>
          </div>
          
          {/* Inner icon */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="bg-blue-600 rounded-full p-6 shadow-2xl shadow-blue-500/50 animate-pulse">
              <Zap className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* App Name with Typing Effect */}
        <div className="space-y-2 flex flex-col items-center justify-center">
          <h1 className="text-5xl font-bold text-white tracking-tight text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
              Ampere.ai
            </span>
          </h1>
          <p className="text-blue-300 text-sm font-medium tracking-widest animate-pulse text-center">
            INTELLIGENT THEFT DETECTION
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
