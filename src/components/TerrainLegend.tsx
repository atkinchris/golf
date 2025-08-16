'use client'

import React from 'react'

const TERRAIN_INFO = [
  { type: 'rough', color: 'bg-green-800', name: 'Rough', description: 'Default terrain' },
  { type: 'fairway', color: 'bg-green-400', name: 'Fairway', description: '+1 movement' },
  { type: 'sand', color: 'bg-yellow-400', name: 'Sand', description: '-1 movement' },
  { type: 'water', color: 'bg-blue-500', name: 'Water', description: 'Cannot land on' },
  { type: 'trees', color: 'bg-green-900', name: 'Trees', description: 'Blocks movement' },
  { type: 'slope', color: 'bg-orange-300', name: 'Slope', description: 'Ball rolls extra' },
  { type: 'hole', color: 'bg-black', name: 'Hole', description: 'Target destination' },
]

export function TerrainLegend() {
  return (
    <div className="bg-white border border-gray-300 p-4 rounded-lg shadow" data-testid="terrain-legend">
      <h3 className="font-bold mb-3 text-lg">Terrain Legend</h3>
      <div className="space-y-2">
        {TERRAIN_INFO.map(terrain => (
          <div key={terrain.type} className="flex items-center gap-3">
            <div className={`w-4 h-4 ${terrain.color} border border-gray-400`} />
            <div className="flex-1">
              <span className="font-medium">{terrain.name}</span>
              <span className="text-gray-600 text-sm ml-2">{terrain.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
