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
  uniform float u_targetFrequency;
  uniform float u_transitionProgress;
  uniform float u_amplitude;
  uniform int u_mode;
  uniform int u_visualMode;
  varying vec2 v_texCoord;

  #define PI 3.14159265359

  float chladniPattern(vec2 pos, float freq) {
    vec2 center = vec2(0.5, 0.5);
    vec2 r = pos - center;
    float x = r.x;
    float y = r.y;
    
    float n, m;
    if (u_mode == 0) { // (2,1) mode
      n = 2.0;
      m = 1.0;
    } else if (u_mode == 1) { // (3,2) mode
      n = 3.0;
      m = 2.0;
    } else { // (4,3) mode
      n = 4.0;
      m = 3.0;
    }
    
    float a = n * PI * freq;
    float b = m * PI * freq;
    
    return abs(sin(a * x) * sin(b * y) + sin(b * x) * sin(a * y));
  }

  vec3 colorMode(float intensity) {
    vec3 sandColor = vec3(0.76, 0.70, 0.50);
    vec3 plateColor = vec3(0.2, 0.2, 0.2);
    return mix(plateColor, sandColor, intensity);
  }

  vec3 lineMode(float intensity) {
    float lineIntensity = step(0.01, intensity) - step(0.99, intensity);
    return mix(vec3(0.2), vec3(1.0), lineIntensity);
  }

  void main() {
    vec2 pos = v_texCoord;
    float currentFreq = mix(u_frequency, u_targetFrequency, u_transitionProgress);
    float pattern1 = chladniPattern(pos, u_frequency * 0.01);
    float pattern2 = chladniPattern(pos, u_targetFrequency * 0.01);
    float pattern = mix(pattern1, pattern2, u_transitionProgress);
    
    float intensity = smoothstep(0.0, 1.0, pattern * u_amplitude);
    
    vec3 color;
    if (u_visualMode == 0) {
      color = colorMode(intensity);
    } else {
      color = lineMode(intensity);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const CymaticVisualizer = () => {
  const [frequency, setFrequency] = useState(100);
  const [targetFrequency, setTargetFrequency] = useState(100);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [amplitude, setAmplitude] = useState(1.0);
  const [mode, setMode] = useState(0);
  const [visualMode, setVisualMode] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [fps, setFps] = useState(60);

  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const fpsIntervalRef = useRef(1000 / 60);
  const transitionStartTimeRef = useRef(0);

  const render = useCallback(() => {
    const currentTime = performance.now();
    const elapsed = currentTime - lastFrameTimeRef.current;

    if (elapsed > fpsIntervalRef.current) {
      lastFrameTimeRef.current = currentTime - (elapsed % fpsIntervalRef.current);

      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;

      if (!gl || !program || !canvas) return;

      resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update transition progress
      if (transitionProgress < 1) {
        const transitionDuration = 2000; // 2 seconds
        const newProgress = Math.min((currentTime - transitionStartTimeRef.current) / transitionDuration, 1);
        setTransitionProgress(newProgress);
        if (newProgress === 1) {
          setFrequency(targetFrequency);
        }
      }

      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, "u_frequency"), frequency);
      gl.uniform1f(gl.getUniformLocation(program, "u_targetFrequency"), targetFrequency);
      gl.uniform1f(gl.getUniformLocation(program, "u_transitionProgress"), transitionProgress);
      gl.uniform1f(gl.getUniformLocation(program, "u_amplitude"), amplitude);
      gl.uniform1i(gl.getUniformLocation(program, "u_mode"), mode);
      gl.uniform1i(gl.getUniformLocation(program, "u_visualMode"), visualMode);
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), currentTime / 1000);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(render);
    }
  }, [frequency, targetFrequency, transitionProgress, amplitude, mode, visualMode, isAnimating, fps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    
    if (!program) {
      console.error('Failed to create program');
      return;
    }

    programRef.current = program;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

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

  const handleFrequencyChange = (newFrequency) => {
    setTargetFrequency(newFrequency);
    setTransitionProgress(0);
    transitionStartTimeRef.current = performance.now();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "chladni_pattern.png";
    link.href = dataURL;
    link.click();
  };

  const toggleAnimation = () => {
    setIsAnimating((prev) => !prev);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Chladni Plate Simulator</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full h-auto border border-gray-600 rounded-lg shadow-lg"
          />
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
                frequency={targetFrequency}
                setFrequency={handleFrequencyChange}
                amplitude={amplitude}
                setAmplitude={setAmplitude}
                mode={mode}
                setMode={setMode}
                visualMode={visualMode}
                setVisualMode={setVisualMode}
                fps={fps}
                setFps={setFps}
                isAnimating={isAnimating}
                toggleAnimation={toggleAnimation}
                handleExport={handleExport}
                playAudio={() => playTone(targetFrequency)}
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
