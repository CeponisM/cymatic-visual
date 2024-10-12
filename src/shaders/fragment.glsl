#version 100
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
#define MAX_PARTICLES 10000
#define WAVE_SPEED 0.1
#define LIGHT_DIR vec3(-0.7, -0.7, 0.5)

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
  if (u_plateShape == 0) {
    return length(pos - vec2(0.5)) <= 0.5;
  } else if (u_plateShape == 1) {
    return all(greaterThanEqual(pos, vec2(0.0))) && all(lessThanEqual(pos, vec2(1.0)));
  } else {
    vec2 p = pos - vec2(0.5, 0.0);
    float q = p.x - sqrt(3.0) * p.y;
    float r = p.x + p.y * sqrt(3.0);
    return (q <= 0.5) && (r <= 0.5) && (p.y >= -0.25);
  }
}

float chladniPattern(vec2 pos, float freq) {
  float k = freq * 0.0628;
  vec2 p = pos - vec2(0.5);
  
  if (u_plateShape == 0) {
    float r = length(p);
    float theta = atan(p.y, p.x);
    float m = floor(2.0 + sin(k * 0.1) * 3.0);
    float wave = besselJ0(k * r) * cos(m * theta);
    return abs(wave) * cos(2.0 * PI * freq * u_time * WAVE_SPEED);
  } else if (u_plateShape == 1) {
    float m = floor(2.0 + sin(k * 0.1) * 3.0);
    float n = floor(2.0 + cos(k * 0.15) * 3.0);
    float wave = sin(m * PI * p.x) * sin(n * PI * p.y);
    return abs(wave) * cos(2.0 * PI * freq * u_time * WAVE_SPEED);
  } else {
    float m = floor(2.0 + sin(k * 0.1) * 3.0);
    float n = floor(2.0 + cos(k * 0.15) * 3.0);
    float x = p.x * 2.0;
    float y = p.y * 2.0;
    float phi1 = sin(m * PI * x) * sin(n * PI * y);
    float phi2 = sin(n * PI * x) * sin(m * PI * y);
    float phi3 = sin((m + n) * PI * x) * sin((m + n) * PI * y);
    float wave = phi1 + phi2 - phi3;
    return abs(wave) * cos(2.0 * PI * freq * u_time * WAVE_SPEED);
  }
}

vec3 getNormal(vec2 pos, float freq) {
  float delta = 0.001;
  float h = chladniPattern(pos, freq);
  float hx = chladniPattern(vec2(pos.x + delta, pos.y), freq) - h;
  float hy = chladniPattern(vec2(pos.x, pos.y + delta), freq) - h;
  return normalize(vec3(-hx / delta, -hy / delta, 1.0));
}

void main() {
  vec2 pos = v_texCoord;
  if (!isInsidePlate(pos)) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float pattern = chladniPattern(pos, u_frequency) * u_amplitude;
  vec3 normal = getNormal(pos, u_frequency);
  vec3 lightDir = normalize(LIGHT_DIR);
  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
  vec3 waterColor = vec3(0.1, 0.3, 0.5);
  vec3 lighting = waterColor * (0.3 + 0.5 * diffuse) + vec3(0.8) * specular;

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

  vec3 color = mix(lighting, vec3(1.0, 0.8, 0.6), particleDensity * 0.7);
  gl_FragColor = vec4(color, 1.0);
}