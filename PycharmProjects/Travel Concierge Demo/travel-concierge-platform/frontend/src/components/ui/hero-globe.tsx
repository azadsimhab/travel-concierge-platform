import { Globe } from "@/components/ui/globe"
import { COBEOptions } from "cobe"

// Hero-specific globe configuration
const HERO_GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.0,
  baseColor: [0.1, 0.1, 0.1], // Very dark base
  markerColor: [59 / 255, 130 / 255, 246 / 255], // Blue travel theme
  glowColor: [0.6, 0.8, 1],
  markers: [
    // India destinations - larger markers
    { location: [19.076, 72.8777], size: 0.12 }, // Mumbai
    { location: [28.6139, 77.2090], size: 0.12 }, // Delhi  
    { location: [15.2993, 74.1240], size: 0.10 }, // Goa
    { location: [9.9312, 76.2673], size: 0.08 }, // Kerala
    { location: [26.9124, 75.7873], size: 0.08 }, // Jaipur
    { location: [12.9716, 77.5946], size: 0.10 }, // Bangalore
    
    // International popular destinations
    { location: [25.2048, 55.2708], size: 0.10 }, // Dubai
    { location: [1.3521, 103.8198], size: 0.08 }, // Singapore
    { location: [35.6762, 139.6503], size: 0.10 }, // Tokyo
    { location: [40.7128, -74.0060], size: 0.12 }, // New York
    { location: [51.5074, -0.1278], size: 0.10 }, // London
    { location: [48.8566, 2.3522], size: 0.08 }, // Paris
  ],
}

export function HeroGlobe() {
  return (
    <div className="relative flex items-center justify-center w-full h-[400px] overflow-hidden">
      <Globe className="top-0" config={HERO_GLOBE_CONFIG} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),rgba(255,255,255,0))]" />
    </div>
  )
}