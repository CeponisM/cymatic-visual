# Chladni Plate Simulator

A real-time, interactive visualization of Chladni patterns using WebGL and React. This simulator demonstrates the fascinating modal vibration patterns that occur on rigid surfaces when subjected to specific frequencies, named after physicist Ernst Chladni.

![Chladni Plate Simulator](https://img.shields.io/badge/React-18.3.1-blue) ![WebGL](https://img.shields.io/badge/WebGL-Enabled-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

- **Real-time Simulation**: 20,000 dynamic particles responding to vibration patterns
- **Multiple Plate Shapes**: Circle, Square, and Triangle geometries
- **Interactive Controls**: Frequency, amplitude, and particle size adjustments
- **Audio Integration**: Play corresponding tones using Tone.js
- **Advanced Rendering**: WebGL shaders with realistic lighting and water-like effects
- **Export Functionality**: Save patterns as PNG images
- **Performance Controls**: Adjustable FPS for optimal performance
- **Educational Content**: Built-in information panel explaining the physics

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chladni-plate-simulator.git
cd chladni-plate-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `build` folder ready for deployment.

## 🎮 Usage

### Basic Controls

- **Frequency Slider**: Adjust the vibration frequency (1-500 Hz) to change pattern complexity
- **Amplitude Slider**: Control vibration intensity (0.1-2.0)
- **Plate Shape**: Select between circular, square, or triangular plates
- **Particle Size**: Modify visual granularity of the simulation
- **FPS Control**: Balance between smooth animation and performance
- **Play/Pause**: Toggle animation state
- **Audio Controls**: Play/stop corresponding frequency tones

### Advanced Features

- **Export**: Save current pattern as PNG image
- **Real-time Physics**: Particles dynamically respond to calculated vibration fields
- **Boundary Collision**: Particles bounce realistically off plate edges
- **Visual Effects**: Advanced shader rendering with lighting and specular highlights

## 🔬 Physics Implementation

### Chladni Pattern Mathematics

The simulator implements authentic Chladni pattern equations:

#### Circular Plates
Uses Bessel functions to calculate radial modes:
```
J₀(kr) * cos(mθ) - J₁(kr) * cos(nθ)
```

#### Rectangular Plates
Employs standing wave equations:
```
sin(mπx) * sin(nπy) + sin(nπx) * sin(mπy)
```

#### Triangular Plates
Combines multiple wave modes for complex patterns:
```
φ₁ + φ₂ - φ₃
```

### Particle Physics

- **Force Calculation**: Gradient-based acceleration from vibration field
- **Velocity Integration**: Realistic damping and momentum conservation
- **Boundary Handling**: Elastic collision detection and response
- **Performance Optimization**: Efficient GPU-based particle updates

## 🛠 Technical Architecture

### Project Structure

```
src/
├── components/
│   ├── CymaticVisualizer.js    # Main component
│   ├── Controls.js             # UI controls
│   └── InfoPanel.js            # Educational content
├── utils/
│   ├── webgl.js               # WebGL utilities
│   └── audio.js               # Audio functionality
├── shaders/
│   ├── vertex.glsl            # Vertex shader
│   └── fragment.glsl          # Fragment shader
└── styles/
    └── index.css              # Tailwind CSS
```

### Key Technologies

- **React 18.3.1**: Modern React with hooks
- **WebGL**: High-performance graphics rendering
- **Tone.js**: Audio synthesis and playback
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **GLSL**: Custom shader programming

### Performance Optimizations

- **GPU Computing**: Particle physics calculated in fragment shaders
- **Efficient Rendering**: Single-pass rendering with texture-based particle data
- **Memory Management**: Optimized buffer usage and cleanup
- **Frame Rate Control**: Adaptive FPS limiting

## 🎨 Customization

### Shader Modifications

The fragment shader (`paste.txt` content) can be modified to:
- Adjust lighting models
- Change water-like visual effects
- Modify particle rendering styles
- Add new visual effects

### Adding New Plate Shapes

1. Extend the `isInsidePlate` function
2. Add corresponding pattern calculation in `chladniPattern`
3. Update boundary collision detection
4. Add UI controls for the new shape

### Audio Enhancements

Extend the audio system to:
- Add harmonic overtones
- Implement stereo effects
- Support custom waveforms
- Add audio visualization

## 📊 Browser Compatibility

| Browser | Version | WebGL Support | Audio Support |
|---------|---------|---------------|---------------|
| Chrome  | 90+     | ✅ Full       | ✅ Full       |
| Firefox | 88+     | ✅ Full       | ✅ Full       |
| Safari  | 14+     | ✅ Full       | ✅ Full       |
| Edge    | 90+     | ✅ Full       | ✅ Full       |

## 🐛 Troubleshooting

### Common Issues

**WebGL Not Supported**
- Ensure hardware acceleration is enabled
- Update graphics drivers
- Try a different browser

**Poor Performance**
- Reduce FPS setting
- Decrease particle count (modify `PARTICLE_COUNT`)
- Close other browser tabs

**Audio Not Working**
- Check browser audio permissions
- Ensure page interaction before audio playback
- Verify Tone.js initialization

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('chladni-debug', 'true');
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add comments for complex physics calculations
- Test on multiple browsers and devices
- Update documentation for new features

## 📚 Educational Resources

### Understanding Chladni Patterns

- [Ernst Chladni's Original Work](https://en.wikipedia.org/wiki/Ernst_Chladni)
- [Physics of Standing Waves](https://physics.info/waves-standing/)
- [Bessel Functions in Physics](https://mathworld.wolfram.com/BesselFunction.html)

### WebGL and Shader Programming

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Shader Programming Guide](https://thebookofshaders.com/)
- [GLSL Reference](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)

---

**Made with ❤️ for science education and interactive learning**