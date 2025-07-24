'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import { TravelGlobe } from './TravelGlobe'

export function Scene() {
  return (
    <div className="h-screen w-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        className="bg-transparent"
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} />
          
          {/* Environment */}
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* 3D Objects */}
          <TravelGlobe />
          
          {/* Controls */}
          <OrbitControls enableZoom={true} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  )
} 