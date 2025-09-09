import React from 'react';

export function CityCatalystTab() {
  return (
    <div className="fixed bottom-0 left-0 z-50">
      <div 
        className="rounded-tr-2xl px-6 py-4 shadow-lg"
        style={{ 
          backgroundColor: '#3B63C4',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <div className="flex items-center gap-3">
          {/* CityCatalyst Icon */}
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center p-1">
            <svg 
              className="w-6 h-6 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          
          <div className="text-white">
            <div className="text-sm font-medium">
              <a 
                href="https://citycatalyst.openearth.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline font-semibold"
              >
                Go back to CityCatalyst
              </a>
            </div>
            <div className="text-xs opacity-90">
              Exit module and return to the main platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}