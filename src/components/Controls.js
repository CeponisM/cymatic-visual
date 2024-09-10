import React from 'react';
import * as Slider from '@radix-ui/react-slider';

const Controls = ({
  frequency = 20,
  setFrequency,
  amplitude = 1.0,
  setAmplitude,
  fluidDepth = 0.01,
  setFluidDepth,
  damping = 0.1,
  setDamping,
  mode = 0,
  setMode,
  isAnimating = true,
  toggleAnimation,
  handleExport,
  playAudio,
  stopAudio
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 font-medium">Frequency: {frequency.toFixed(1)} Hz</label>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[frequency]}
          onValueChange={([value]) => setFrequency(value)}
          max={50}
          min={1}
          step={0.1}
        >
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Frequency"
          />
        </Slider.Root>
      </div>
      <div>
        <label className="block mb-2 font-medium">Amplitude: {amplitude.toFixed(2)}</label>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[amplitude]}
          onValueChange={([value]) => setAmplitude(value)}
          max={2}
          min={0.1}
          step={0.01}
        >
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Amplitude"
          />
        </Slider.Root>
      </div>
      <div>
        <label className="block mb-2 font-medium">Fluid Depth: {fluidDepth.toFixed(3)} m</label>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[fluidDepth]}
          onValueChange={([value]) => setFluidDepth(value)}
          max={0.1}
          min={0.001}
          step={0.001}
        >
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Fluid Depth"
          />
        </Slider.Root>
      </div>
      <div>
        <label className="block mb-2 font-medium">Damping: {damping.toFixed(3)}</label>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[damping]}
          onValueChange={([value]) => setDamping(value)}
          max={1}
          min={0}
          step={0.001}
        >
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Damping"
          />
        </Slider.Root>
      </div>
      <div>
        <label className="block mb-2 font-medium">Pattern Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={0}>Circular</option>
          <option value={1}>Square</option>
          <option value={2}>Star</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={toggleAnimation} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200">
          {isAnimating ? 'Stop Animation' : 'Start Animation'}
        </button>
        <button onClick={handleExport} className="flex-1 bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200">
          Export Image
        </button>
        <button
          onMouseDown={playAudio}
          onMouseUp={stopAudio}
          onMouseLeave={stopAudio}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Play Tone
        </button>
      </div>
    </div>
  );
};

export default Controls;
