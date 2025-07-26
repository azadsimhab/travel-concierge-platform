// Temporarily simplified version for debugging
export function TravelGlobeDemo() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px] overflow-hidden rounded-lg border bg-white px-8 py-8 shadow-xl">
      <div className="text-center">
        <span className="block text-6xl md:text-8xl font-semibold leading-none text-blue-600 mb-4">
          Explore
        </span>
        <div className="w-64 h-64 mx-auto bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          🌍 Interactive Globe
        </div>
        <p className="mt-4 text-gray-600">
          Discover amazing destinations worldwide
        </p>
      </div>
    </div>
  )
}