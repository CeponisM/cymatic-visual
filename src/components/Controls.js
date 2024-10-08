import React from 'react';
import * as Slider from '@radix-ui/react-slider';

const Controls = ({
  frequency,
  setFrequency,
  amplitude,
  setAmplitude,
  plateShape,
  setPlateShape,
  fps,
  setFps,
  particleSize,
  setParticleSize,
  isAnimating,
  toggleAnimation,
  handleExport,
  playAudio,
  stopAudio
}) => {
  const formatFrequency = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(2)} kHz`;
    } else {
      return `${freq.toFixed(2)} Hz`;
    }
  };

  const SliderWithButtons = React.memo(({ value, setValue, min, max, step, formatValue, label }) => {
    const decrease = () => setValue(Math.max(min, value - step));
    const increase = () => setValue(Math.min(max, value + step));

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={decrease}
          className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          -
        </button>
        <div className="flex-grow">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[value]}
            onValueChange={([newValue]) => setValue(newValue)}
            max={max}
            min={min}
            step={step}
          >
            <Slider.Track className="bg-gray-600 relative grow rounded-full h-[3px]">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={label}
            />
          </Slider.Root>
        </div>
        <button
          onClick={increase}
          className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          +
        </button>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 font-medium">Frequency: {formatFrequency(frequency)}</label>
        <SliderWithButtons
          value={frequency}
          setValue={setFrequency}
          min={20}
          max={20000}
          step={1}
          formatValue={formatFrequency}
          label="Frequency"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Amplitude: {amplitude.toFixed(2)}</label>
        <SliderWithButtons
          value={amplitude}
          setValue={setAmplitude}
          min={0.1}
          max={2}
          step={0.01}
          formatValue={(v) => v.toFixed(2)}
          label="Amplitude"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Particle Size: {particleSize.toFixed(4)}</label>
        <SliderWithButtons
          value={particleSize}
          setValue={setParticleSize}
          min={0.001}
          max={0.01}
          step={0.0001}
          formatValue={(v) => v.toFixed(4)}
          label="Particle Size"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">FPS: {fps}</label>
        <SliderWithButtons
          value={fps}
          setValue={setFps}
          min={1}
          max={120}
          step={1}
          formatValue={(v) => Math.round(v)}
          label="FPS"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Plate Shape:</label>
        <select
          value={plateShape}
          onChange={(e) => setPlateShape(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={0}>Circle</option>
          <option value={1}>Square</option>
          <option value={2}>Triangle</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={toggleAnimation} 
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          {isAnimating ? 'Pause Simulation' : 'Resume Simulation'}
        </button>
        <button 
          onClick={handleExport} 
          className="flex-1 bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
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

export default React.memo(Controls);
