import { MutableRefObject } from 'react';

interface FlightUIProps {
  positionRef: MutableRefObject<{ x: number; y: number; z: number }>;
  flightStatusRef: MutableRefObject<{
    speed: number;
    throttle: number;
    isGearDown: boolean;
    isOnRunway: boolean;
    isStalling: boolean;
  }>;
}

export function FlightUI({ positionRef, flightStatusRef }: FlightUIProps) {
  return (
    <>
      <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">✈️ Realistic Flight Simulator</h2>
        <p className="mb-2">Start on runway, build speed, then take off!</p>
        <div className="text-sm">
          <p><strong>Flight Controls:</strong></p>
          <p>W/↑ - Increase Throttle | S/↓ - Decrease Throttle</p>
          <p>A/← - Roll Left | D/→ - Roll Right</p>
          <p>R - Pitch Up | F - Pitch Down</p>
          <p>Z - Yaw Left | C - Yaw Right</p>
          <p>L - Toggle Landing Gear</p>
          <p className="mt-2"><strong>Camera Controls:</strong></p>
          <p>Click & Drag - Look around</p>
          <p>Mouse Wheel - Zoom in/out</p>
          <p className="mt-2 text-yellow-300">🔊 Engine & wind sounds included!</p>
          <p className="mt-2 text-blue-300">🗺️ Explore mountains, cities, and clouds!</p>
          <p className="mt-2 text-green-300">✈️ Realistic takeoff physics!</p>
          <p className="mt-2 text-red-300">⚠️ Stall mechanics included!</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-4 rounded">
        <h3 className="text-lg font-bold mb-2">📍 Flight Status</h3>
        <div className="text-sm">
          <p>X: {Math.round(positionRef.current.x)}</p>
          <p>Y: {Math.round(positionRef.current.y)}</p>
          <p>Z: {Math.round(positionRef.current.z)}</p>
          <p className="mt-2 text-green-300">Altitude: {Math.round(positionRef.current.y)}m</p>
          <p className="text-blue-300">Speed: {Math.round(flightStatusRef.current.speed * 100)} km/h</p>
          <p className="text-yellow-300">Throttle: {Math.round(flightStatusRef.current.throttle * 100)}%</p>
          <p className="text-purple-300">Gear: {flightStatusRef.current.isGearDown ? 'Down' : 'Up'}</p>
          <p className="text-orange-300">State: {flightStatusRef.current.isOnRunway ? 'On Runway' : 'In Flight'}</p>
          <p className={`${flightStatusRef.current.isStalling ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            Stall: {flightStatusRef.current.isStalling ? 'YES!' : 'No'}
          </p>
        </div>
      </div>
    </>
  );
} 