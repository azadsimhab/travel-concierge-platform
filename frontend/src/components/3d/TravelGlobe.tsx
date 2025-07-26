'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import { Mesh } from 'three'

interface Destination {
  id: string
  name: string
  position: [number, number, number]
  description: string
}

const destinations: Destination[] = [
  { id: '1', name: 'Tokyo', position: [1.2, 0.5, 0], description: 'Modern metropolis' },
  { id: '2', name: 'Paris', position: [-0.8, 0.6, 0.5], description: 'City of lights' },
  { id: '3', name: 'New York', position: [-1, 0.3, -0.8], description: 'The big apple' },
  { id: '4', name: 'London', position: [-0.5, 0.8, 0.3], description: 'Historic charm' },
]

export function TravelGlobe() {
  const globeRef = useRef<Mesh>(null)
  const [hoveredDest, setHoveredDest] = useState<string | null>(null)

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.005
    }
  })

  return (
    <group>
      {/* Main Globe */}
      <Sphere ref={globeRef} args={[2, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1a365d"
          transparent
          opacity={0.8}
          wireframe={false}
        />
      </Sphere>

      {/* Wireframe Overlay */}
      <Sphere args={[2.01, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.3}
          wireframe
        />
      </Sphere>

      {/* Destination Markers */}
      {destinations.map((dest) => (
        <group key={dest.id}>
          {/* Marker Sphere */}
          <Sphere
            args={[0.05, 8, 8]}
            position={dest.position}
            onPointerEnter={() => setHoveredDest(dest.id)}
            onPointerLeave={() => setHoveredDest(null)}
          >
            <meshStandardMaterial
              color={hoveredDest === dest.id ? "#ffd700" : "#00ffff"}
              emissive={hoveredDest === dest.id ? "#ffd700" : "#00ffff"}
              emissiveIntensity={0.5}
            />
          </Sphere>

          {/* Destination Label */}
          {hoveredDest === dest.id && (
            <Html position={dest.position} center>
              <div className="bg-glass-bg backdrop-blur-md border border-glass-border rounded-lg p-3 shadow-glass">
                <h3 className="text-white font-semibold">{dest.name}</h3>
                <p className="text-white/80 text-sm">{dest.description}</p>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
} 