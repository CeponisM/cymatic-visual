import React from 'react';

const InfoPanel = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm">
        This cymatic pattern simulator demonstrates standing wave patterns in fluids, similar to those observed in Faraday wave experiments and Chladni plate demonstrations.
      </p>
      <p className="text-sm font-medium">Controls:</p>
      <ul className="list-disc pl-5 text-sm">
        <li><strong>Frequency:</strong> Adjusts the vibration frequency, directly affecting the wave pattern complexity.</li>
        <li><strong>Amplitude:</strong> Controls the intensity of the waves, affecting pattern visibility.</li>
        <li><strong>Fluid Depth:</strong> Simulates different depths of fluid, influencing wave behavior and pattern formation.</li>
        <li><strong>Damping:</strong> Represents energy loss in the system, affecting how quickly patterns stabilize.</li>
        <li><strong>Pattern Mode:</strong> Choose between circular, square, and star-shaped wave patterns.</li>
      </ul>
      <p className="text-sm font-medium">Pattern Modes:</p>
      <ul className="list-disc pl-5 text-sm">
        <li><strong>Circular:</strong> Simulates waves in a circular container, similar to dropping a pebble in water.</li>
        <li><strong>Square:</strong> Represents waves in a square container, similar to classic Chladni plate experiments.</li>
        <li><strong>Star:</strong> A more complex pattern demonstrating wave interference from multiple sources.</li>
      </ul>
      <p className="text-sm">
        Experiment with different frequencies, fluid depths, and modes to discover various cymatic patterns. The visualization uses color gradients to represent wave heights, with brighter areas indicating peaks and darker areas representing troughs.
      </p>
      <p className="text-sm">
        The fluid depth parameter is particularly important in cymatic pattern formation. Shallow depths tend to produce more complex patterns, while deeper fluids may result in simpler, longer-wavelength patterns.
      </p>
      <p className="text-sm">
        Use the "Play Tone" button to hear the corresponding frequency, and export interesting patterns as images for further study or sharing.
      </p>
    </div>
  );
};

export default InfoPanel;
