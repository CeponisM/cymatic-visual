import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import Controls from './Controls';
import InfoPanel from './InfoPanel';
import { createShader, createProgram, resizeCanvasToDisplaySize } from '../utils/webgl';
import { initAudio, playTone, stopTone } from '../utils/audio';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_amplitude;
  uniform int u_plateShape;
  uniform sampler2D u_particles;
  uniform int u_particleCount;
  uniform float u_particleSize;
  varying vec2 v_texCoord;

  #define PI 3.14159265359
  #define MAX_PARTICLES 20000

  // Optimized Bessel functions
  float besselJ0(float x) {
    float ax = abs(x);
    if (ax < 8.0) {
      float y = x * x;
      return 1.0 - y * (0.25 - y * (0.015625 - y * 0.000434027777));
    } else {
      float z = 8.0 / ax;
      float y = z * z;
      float xx = ax - 0.785398164;
      return sqrt(0.636619772 / ax) * cos(xx + z * (0.0781250 - y * (0.0043945313 - y * 0.000021219444)));
    }
  }

  float besselJ1(float x) {
    float ax = abs(x);
    if (ax < 8.0) {
      float y = x * x;
      return x * (0.5 - y * (0.0625 - y * (0.001302083333 - y * 0.0000173611111)));
    } else {
      float z = 8.0 / ax;
      float y = z * z;
      float xx = ax - 2.356194491;
      return sqrt(0.636619772 / ax) * cos(xx + z * (-0.0781250 + y * (0.0087890625 - y * 0.000030381944)));
    }
  }

  bool isInsidePlate(vec2 pos) {
    if (u_plateShape == 0) { // Circle
      return distance(pos, vec2(0.5)) <= 0.5;
    } else if (u_plateShape == 1) { // Square
      return all(greaterThanEqual(pos, vec2(0.0))) && all(lessThanEqual(pos, vec2(1.0)));
    } else { // Triangle
      vec2 p = pos - vec2(0.5, 0.0);
      float q = p.x - sqrt(3.0) * p.y;
      float r = p.x + sqrt(3.0) * p.y;
      return (q <= 0.5) && (r <= 0.5) && (p.y >= -0.25);
    }
  }

  float chladniPattern(vec2 pos) {
    float k = u_frequency * 0.0628;  // 2 * PI / 100 for smoother scaling
    vec2 center = vec2(0.5, 0.5);
    vec2 p = pos - center;
    
    if (u_plateShape == 0) { // Circle
      float r = length(p);
      float theta = atan(p.y, p.x);
      float m = 2.0 + sin(k * 0.1) * 3.0;
      float n = 2.0 + cos(k * 0.15) * 3.0;
      return abs(besselJ0(k * r) * cos(m * theta) - besselJ1(k * r) * cos(n * theta));
    } else if (u_plateShape == 1) { // Square
      float x = p.x;
      float y = p.y;
      float m = 2.0 + sin(k * 0.1) * 3.0;
      float n = 2.0 + cos(k * 0.15) * 3.0;
      return abs(sin(m * PI * x) * sin(n * PI * y) + 
                 sin(n * PI * x) * sin(m * PI * y));
    } else { // Triangle
      float x = p.x * 2.0;
      float y = p.y * 2.0;
      float m = 2.0 + sin(k * 0.1) * 3.0;
      float n = 2.0 + cos(k * 0.15) * 3.0;
      float phi1 = sin(m * PI * x) * sin(n * PI * y);
      float phi2 = sin(n * PI * x) * sin(m * PI * y);
      float phi3 = sin((m + n) * PI * x) * sin((m + n) * PI * y);
      return abs(phi1 + phi2 - phi3);
    }
  }

  void main() {
    vec2 pos = v_texCoord;
    if (!isInsidePlate(pos)) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    
    float pattern = chladniPattern(pos);
    
    vec3 plateColor = vec3(0.1, 0.1, 0.1);
    vec3 patternColor = vec3(0.9, 0.9, 0.9);
    
    float particleDensity = 0.0;
    for (int i = 0; i < MAX_PARTICLES; i++) {
      if (i >= u_particleCount) break;
      vec4 particleData = texture2D(u_particles, vec2(float(i) / float(u_particleCount), 0.0));
      vec2 particlePos = particleData.xy;
      float dist = distance(pos, particlePos);
      if (dist < u_particleSize && isInsidePlate(particlePos)) {
        float smoothEdge = 1.0 - smoothstep(0.0, u_particleSize, dist);
        particleDensity += smoothEdge;
      }
    }
    
    particleDensity = min(particleDensity, 1.0);
    
    vec3 color = mix(plateColor, patternColor, pattern * u_amplitude);
    color = mix(color, vec3(1.0), particleDensity * 0.7);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const PARTICLE_COUNT = 20000;

const CymaticVisualizer = () => {
  const [frequency, setFrequency] = useState(100);
  const [amplitude, setAmplitude] = useState(1.0);
  const [plateShape, setPlateShape] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [fps, setFps] = useState(60);
  const [particleSize, setParticleSize] = useState(0.003);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const particlesRef = useRef(null);
  const particleTextureRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const fpsIntervalRef = useRef(1000 / 60);

  const updateParticles = useCallback((particles, frequency, amplitude, deltaTime) => {
    const accelerationScale = 5000;
    const velocityDamping = 0.98;
    const bounceDamping = 0.8;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = particles[i * 4];
      let y = particles[i * 4 + 1];
      let vx = particles[i * 4 + 2];
      let vy = particles[i * 4 + 3];

      const pattern = chladniPattern({x, y}, frequency, plateShape);
      const gradientX = (chladniPattern({x: x + 0.001, y}, frequency, plateShape) - pattern) / 0.001;
      const gradientY = (chladniPattern({x, y: y + 0.001}, frequency, plateShape) - pattern) / 0.001;

      const ax = -gradientX * accelerationScale * amplitude;
      const ay = -gradientY * accelerationScale * amplitude;

      vx = vx * velocityDamping + ax * deltaTime;
      vy = vy * velocityDamping + ay * deltaTime;
      x += vx * deltaTime;
      y += vy * deltaTime;

      if (!isInsidePlate({x, y}, plateShape)) {
        const {x: newX, y: newY} = findNearestPointOnPlate({x, y}, plateShape);
        const norm = normalize({x: newX - x, y: newY - y});
        const dot = vx * norm.x + vy * norm.y;
        vx = (vx - 2 * dot * norm.x) * bounceDamping;
        vy = (vy - 2 * dot * norm.y) * bounceDamping;
        x = newX;
        y = newY;
      }

      particles[i * 4] = x;
      particles[i * 4 + 1] = y;
      particles[i * 4 + 2] = vx;
      particles[i * 4 + 3] = vy;
    }

    return particles;
  }, [plateShape]);

  const chladniPattern = useCallback((pos, freq, shape) => {
    const k = freq * 0.0628;  // 2 * PI / 100 for smoother scaling
    const x = pos.x - 0.5;
    const y = pos.y - 0.5;
    
    if (shape === 0) { // Circle
      const r = Math.hypot(x, y);
      const theta = Math.atan2(y, x);
      const m = 2 + Math.sin(k * 0.1) * 3;
      const n = 2 + Math.cos(k * 0.15) * 3;
      return Math.abs(besselJ0(k * r) * Math.cos(m * theta) - besselJ1(k * r) * Math.cos(n * theta));
    } else if (shape === 1) { // Square
      const m = 2 + Math.sin(k * 0.1) * 3;
      const n = 2 + Math.cos(k * 0.15) * 3;
      return Math.abs(Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y) + 
                      Math.sin(n * Math.PI * x) * Math.sin(m * Math.PI * y));
    } else { // Triangle
      const m = 2 + Math.sin(k * 0.1) * 3;
      const n = 2 + Math.cos(k * 0.15) * 3;
      const phi1 = Math.sin(m * Math.PI * x * 2) * Math.sin(n * Math.PI * y * 2);
      const phi2 = Math.sin(n * Math.PI * x * 2) * Math.sin(m * Math.PI * y * 2);
      const phi3 = Math.sin((m + n) * Math.PI * x * 2) * Math.sin((m + n) * Math.PI * y * 2);
      return Math.abs(phi1 + phi2 - phi3);
    }
  }, []);

  const isInsidePlate = useCallback((pos, shape) => {
    if (shape === 0) { // Circle
      return Math.hypot(pos.x - 0.5, pos.y - 0.5) <= 0.5;
    } else if (shape === 1) { // Square
      return pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1;
    } else { // Triangle
      const p = {x: pos.x - 0.5, y: pos.y};
      const q = p.x - Math.sqrt(3) * p.y;
      const r = p.x + Math.sqrt(3) * p.y;
      return (q <= 0.5) && (r <= 0.5) && (p.y >= -0.25);
    }
  }, []);

  const findNearestPointOnPlate = useCallback((pos, shape) => {
    if (shape === 0) { // Circle
      const dx = pos.x - 0.5;
      const dy = pos.y - 0.5;
      const dist = Math.hypot(dx, dy);
      return dist <= 0.5 ? pos : {x: dx / dist * 0.5 + 0.5, y: dy / dist * 0.5 + 0.5};
    } else if (shape === 1) { // Square
      return {
        x: Math.max(0, Math.min(1, pos.x)),
        y: Math.max(0, Math.min(1, pos.y))
      };
    } else { // Triangle
      // Project onto nearest edge of equilateral triangle
      const p = {x: pos.x - 0.5, y: pos.y};
      const q = p.x - Math.sqrt(3) * p.y;
      const r = p.x + Math.sqrt(3) * p.y;
      if (q > 0.5) p.x -= (q - 0.5) / 2;
      if (r > 0.5) p.x -= (r - 0.5) / 2;
      if (p.y < -0.25) p.y = -0.25;
      return {x: p.x + 0.5, y: p.y};
    }
  }, []);

  const normalize = useCallback((vec) => {
    const len = Math.hypot(vec.x, vec.y);
    return {x: vec.x / len, y: vec.y / len};
  }, []);

  const besselJ0 = useCallback((x) => {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      return 1 - y * (0.25 - y * (0.015625 - y * 0.000434027777));
    } else {
      const z = 8 / ax;
      const y = z * z;
      const xx = ax - 0.785398164;
      return Math.sqrt(0.636619772 / ax) * Math.cos(xx + z * (0.0781250 - y * (0.0043945313 - y * 0.000021219444)));
    }
  }, []);

  const besselJ1 = useCallback((x) => {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      return x * (0.5 - y * (0.0625 - y * (0.001302083333 - y * 0.0000173611111)));
    } else {
      const z = 8 / ax;
      const y = z * z;
      const xx = ax - 2.356194491;
      return Math.sqrt(0.636619772 / ax) * Math.cos(xx + z * (-0.0781250 + y * (0.0087890625 - y * 0.000030381944)));
    }
  }, []);

  const render = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = currentTime;

    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), currentTime / 1000);
    gl.uniform1f(gl.getUniformLocation(program, "u_frequency"), frequency);
    gl.uniform1f(gl.getUniformLocation(program, "u_amplitude"), amplitude);
    gl.uniform1i(gl.getUniformLocation(program, "u_plateShape"), plateShape);
    gl.uniform1f(gl.getUniformLocation(program, "u_particleSize"), particleSize);

    particlesRef.current = updateParticles(particlesRef.current, frequency, amplitude, deltaTime);
    gl.bindTexture(gl.TEXTURE_2D, particleTextureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PARTICLE_COUNT, 1, 0, gl.RGBA, gl.FLOAT, particlesRef.current);
    gl.uniform1i(gl.getUniformLocation(program, "u_particles"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_particleCount"), PARTICLE_COUNT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(render);
    }
  }, [frequency, amplitude, plateShape, isAnimating, particleSize, updateParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      setError("WebGL not supported. Please try a different browser.");
      return;
    }
    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      setError("Failed to create shaders");
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    
    if (!program) {
      setError("Failed to create program");
      return;
    }

    programRef.current = program;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    particlesRef.current = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current[i * 4] = Math.random();
      particlesRef.current[i * 4 + 1] = Math.random();
      particlesRef.current[i * 4 + 2] = 0;
      particlesRef.current[i * 4 + 3] = 0;
    }

    particleTextureRef.current = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, particleTextureRef.current);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.useProgram(program);

    initAudio();
    lastFrameTimeRef.current = performance.now();
    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  useEffect(() => {
    fpsIntervalRef.current = 1000 / fps;
  }, [fps]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "chladni_pattern.png";
    link.href = dataURL;
    link.click();
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating((prev) => !prev);
  }, []);

  const getCanvasStyle = useCallback(() => {
    const baseStyle = "w-full h-auto border border-gray-600 shadow-lg";
    switch (plateShape) {
      case 0: // Circle
        return `${baseStyle} rounded-full`;
      case 1: // Square
        return baseStyle;
      case 2: // Triangle
        return `${baseStyle} clip-path-triangle`;
      default:
        return baseStyle;
    }
  }, [plateShape]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Advanced Chladni Plate Simulator</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            className={getCanvasStyle()}
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}
        </div>
        <div className="flex-1">
          <Tabs.Root defaultValue="controls" className="bg-surface rounded-lg shadow-lg overflow-hidden">
            <Tabs.List className="flex border-b border-gray-600">
              <Tabs.Trigger 
                value="controls" 
                className="flex-1 px-4 py-2 focus:outline-none hover:bg-gray-700 text-center transition-colors duration-200 ease-in-out"
              >
                Controls
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="info" 
                className="flex-1 px-4 py-2 focus:outline-none hover:bg-gray-700 text-center transition-colors duration-200 ease-in-out"
              >
                Info
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="controls" className="p-4">
              <Controls
                frequency={frequency}
                setFrequency={setFrequency}
                amplitude={amplitude}
                setAmplitude={setAmplitude}
                plateShape={plateShape}
                setPlateShape={setPlateShape}
                fps={fps}
                setFps={setFps}
                particleSize={particleSize}
                setParticleSize={setParticleSize}
                isAnimating={isAnimating}
                toggleAnimation={toggleAnimation}
                handleExport={handleExport}
                playAudio={() => playTone(frequency)}
                stopAudio={stopTone}
              />
            </Tabs.Content>
            <Tabs.Content value="info" className="p-4">
              <InfoPanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
};

export default CymaticVisualizer;
