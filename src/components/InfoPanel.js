const InfoPanel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">About Chladni Plates</h2>
      <p>
        Chladni plates, named after physicist Ernst Chladni, demonstrate the modal vibration patterns of a rigid surface. 
        When the plate vibrates at specific frequencies, particles on the surface move to areas with minimal vibration (nodes), 
        creating distinctive patterns.
      </p>
      <h3 className="text-xl font-semibold">How to Use This Simulator</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Adjust the frequency to change the vibration and observe different patterns.</li>
        <li>Modify the amplitude to control the intensity of the vibration.</li>
        <li>Change the particle size to affect the visual granularity of the simulation.</li>
        <li>Select different modes to explore various Chladni patterns.</li>
        <li>Use the FPS slider to balance between smooth animation and performance.</li>
        <li>Pause/Resume the simulation to observe static patterns or dynamic behavior.</li>
        <li>Export your favorite patterns as images.</li>
        <li>Play the corresponding tone to hear the frequency.</li>
      </ul>
      <p>
        This simulator uses WebGL to provide a real-time, physically-based approximation of Chladni patterns. 
        The particles' motion is influenced by the calculated vibration field, creating a dynamic visualization 
        of the phenomenon.
      </p>
    </div>
  );
};

export default InfoPanel;
