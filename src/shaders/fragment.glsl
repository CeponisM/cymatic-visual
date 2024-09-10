precision mediump float;

uniform vec2 u_resolution;
uniform float u_frequency;
uniform float u_amplitude;
uniform int u_patternType;
uniform float u_time;
uniform int u_colorScheme;
uniform vec2 u_touch;

#define PI 3.14159265359

float chladni(vec2 pos, float freq) {
  return sin(PI * pos.x * freq) * sin(PI * pos.y * freq);
}

float circular(vec2 pos, float freq) {
  float r = length(pos);
  return sin(2.0 * PI * r * freq);
}

float bessel(vec2 pos, float freq) {
  float r = length(pos);
  return (cos(freq * r) + sin(freq * r)) / sqrt(max(r, 0.001));
}

vec3 grayscale(float v) {
  return vec3(v);
}

vec3 heatmap(float v) {
  return vec3(smoothstep(0.5, 0.8, v), smoothstep(0.0, 0.5, v), smoothstep(0.2, 0.0, v));
}

vec3 rainbow(float v) {
  return 0.5 + 0.5 * cos(6.28318 * (v * 0.75 + vec3(0.0, 0.1, 0.2)));
}

void main() {
  vec2 pos = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  float pattern;
  
  if (u_patternType == 0) {
    pattern = chladni(pos, u_frequency);
  } else if (u_patternType == 1) {
    pattern = circular(pos, u_frequency);
  } else {
    pattern = bessel(pos, u_frequency);
  }
  
  pattern *= u_amplitude;
  pattern = sin(pattern + u_time) * 0.5 + 0.5;
  
  // Add touch interactivity
  float touchEffect = smoothstep(0.1, 0.0, length(pos - u_touch));
  pattern = mix(pattern, 1.0 - pattern, touchEffect);
  
  vec3 color;
  if (u_colorScheme == 0) {
    color = grayscale(pattern);
  } else if (u_colorScheme == 1) {
    color = heatmap(pattern);
  } else {
    color = rainbow(pattern);
  }
  
  gl_FragColor = vec4(color, 1.0);
}