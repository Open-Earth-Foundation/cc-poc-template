
import React, { useMemo } from 'react';
import { OSMBoundary } from '@/types/boundary';

interface MiniMapProps {
  boundary: OSMBoundary;
  className?: string;
}

export function MiniMap({ boundary, className = '' }: MiniMapProps) {
  const { svgPath, viewBox, isValidBounds } = useMemo(() => {
    // Check if we have valid bounds data
    const bounds = (boundary as any)._bounds;
    if (!bounds || 
        typeof bounds.minlat !== 'number' || 
        typeof bounds.maxlat !== 'number' ||
        typeof bounds.minlon !== 'number' || 
        typeof bounds.maxlon !== 'number') {
      return { 
        svgPath: '', 
        viewBox: '0 0 100 100', 
        isValidBounds: false 
      };
    }

    const { minlat, maxlat, minlon, maxlon } = bounds;
    
    // Validate bounds are reasonable
    if (minlat >= maxlat || minlon >= maxlon) {
      return { 
        svgPath: '', 
        viewBox: '0 0 100 100', 
        isValidBounds: false 
      };
    }

    // Calculate dimensions
    const width = maxlon - minlon;
    const height = maxlat - minlat;
    
    // Ensure minimum dimensions to avoid negative or zero values
    const safeWidth = Math.max(width, 0.001);
    const safeHeight = Math.max(height, 0.001);
    
    // Create a simple rectangle representing the bounding box
    // SVG coordinates: flip Y axis and normalize to 0-based
    const svgWidth = 100;
    const svgHeight = 100;
    
    // Simple rectangle path
    const path = `M 10 10 L 90 10 L 90 90 L 10 90 Z`;
    
    return {
      svgPath: path,
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      isValidBounds: true
    };
  }, [boundary]);

  if (!isValidBounds) {
    return (
      <div className={`w-full h-24 bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <div className="text-xs text-gray-500 text-center">
          <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 rounded"></div>
          No preview available
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-24 bg-gray-50 rounded overflow-hidden ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={viewBox}
        className="border border-gray-200"
      >
        <rect 
          width="100%" 
          height="100%" 
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        
        {svgPath && (
          <path 
            d={svgPath}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        )}
        
        {/* Fallback simple boundary representation */}
        {!svgPath && (
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="2"
            rx="4"
          />
        )}
      </svg>
      
      <div className="p-2">
        <div className="text-xs text-gray-600 truncate">
          {boundary.name}
        </div>
        <div className="text-xs text-gray-400">
          Admin Level: {boundary.adminLevel || 'N/A'}
        </div>
      </div>
    </div>
  );
}
