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
  uniform float u_fluidDepth;
  uniform float u_damping;
  uniform int u_mode;
  varying vec2 v_texCoord;

  #define PI 3.14159265359
  #define MAX_REFLECTIONS 4

  float tanh_approx(float x) {
    float x2 = x * x;
    return clamp(x * (27.0 + x2) / (27.0 + 9.0 * x2), -1.0, 1.0);
  }

  float standingWave(vec2 pos, vec2 k) {
    float t = u_time * u_frequency * 0.0001;
    float wave = 0.0;
    vec2 p = pos;
    
    for (int i = 0; i < MAX_REFLECTIONS; i++) {
      wave += sin(dot(k, p) - t);
      p = abs(1.0 - p); // Reflect at boundaries
    }
    
    return wave / float(MAX_REFLECTIONS);
  }

  float cymaticPattern(vec2 pos) {
    float k = sqrt(u_frequency * 0.0001) * sqrt(tanh_approx(u_fluidDepth * sqrt(u_frequency * 0.0001)) / u_fluidDepth);
    float pattern = 0.0;
    
    if (u_mode == 0) {  // Circular mode
      for (int i = 0; i < 8; i++) {
        float angle = float(i) * PI / 4.0;
        vec2 dir = vec2(cos(angle), sin(angle));
        pattern += standingWave(pos, k * dir);
      }
      pattern /= 8.0;
    } else if (u_mode == 1) {  // Square mode
      pattern = standingWave(pos, vec2(k, 0.0)) * standingWave(pos, vec2(0.0, k));
    } else if (u_mode == 2) {  // Star mode
      for (int i = 0; i < 5; i++) {
        float angle = float(i) * 2.0 * PI / 5.0;
        vec2 dir = vec2(cos(angle), sin(angle));
        pattern += standingWave(pos, k * dir);
      }
      pattern /= 5.0;
    }
    
    return pattern * exp(-u_damping * u_time);
  }

  void main() {
    vec2 pos = v_texCoord;
    float height = cymaticPattern(pos) * u_amplitude;
    
    height = clamp(height, -1.0, 1.0) * 0.5 + 0.5;
    
    vec3 waterColor = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.4, 0.8), height);
    vec3 foamColor = vec3(0.9, 0.95, 1.0);
    vec3 color = mix(waterColor, foamColor, smoothstep(0.8, 1.0, height));
    
    vec2 eps = vec2(1.0, 0.0) / u_resolution;
    float dx = cymaticPattern(pos + eps.xy) - cymaticPattern(pos - eps.xy);
    float dy = cymaticPattern(pos + eps.yx) - cymaticPattern(pos - eps.yx);
    vec3 normal = normalize(vec3(-dx, -dy, 0.1));
    vec3 light = normalize(vec3(0.5, 0.5, 1.0));
    float diffuse = max(dot(normal, light), 0.0);
    float specular = pow(max(dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
    
    color = color * (diffuse * 0.7 + 0.3) + specular * 0.2;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const CymaticVisualizer = () => {
    const [frequency, setFrequency] = useState(1000000); // 1 MHz
    const [amplitude, setAmplitude] = useState(1.0);
    const [fluidDepth, setFluidDepth] = useState(0.01);
    const [damping, setDamping] = useState(0.1);
    const [mode, setMode] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
  
    const canvasRef = useRef(null);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);
  
    const render = useCallback(() => {
      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;
  
      if (!gl || !program || !canvas) return;
  
      resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
  
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, "u_frequency"), frequency);
      gl.uniform1f(gl.getUniformLocation(program, "u_amplitude"), amplitude);
      gl.uniform1f(gl.getUniformLocation(program, "u_fluidDepth"), fluidDepth);
      gl.uniform1f(gl.getUniformLocation(program, "u_damping"), damping);
      gl.uniform1i(gl.getUniformLocation(program, "u_mode"), mode);
  
      const currentTime = (performance.now() - startTimeRef.current) / 1000;
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), currentTime);
  
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(render);
      }
    }, [frequency, amplitude, fluidDepth, damping, mode, isAnimating]);
  
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
      startTimeRef.current = performance.now();
      render();
  
      return () => {
        cancelAnimationFrame(animationRef.current);
      };
    }, [render]);
  
    useEffect(() => {
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationRef.current);
      }
    }, [isAnimating, render]);
  
    const handleExport = () => {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "cymatic_pattern.png";
      link.href = dataURL;
      link.click();
    };
  
    const toggleAnimation = () => {
      setIsAnimating((prev) => !prev);
    };
  
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Improved Cymatic Pattern Simulator</h1>
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
                  frequency={frequency}
                  setFrequency={setFrequency}
                  amplitude={amplitude}
                  setAmplitude={setAmplitude}
                  fluidDepth={fluidDepth}
                  setFluidDepth={setFluidDepth}
                  damping={damping}
                  setDamping={setDamping}
                  mode={mode}
                  setMode={setMode}
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
