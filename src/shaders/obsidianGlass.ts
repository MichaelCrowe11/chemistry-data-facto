/**
 * Obsidian Glass Material Shader
 * High-contrast, reflective, sharp glass for Crowe Code
 */

export const obsidianGlassVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vUv = uv;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const obsidianGlassFragmentShader = `
uniform samplerCube envMap;
uniform float time;
uniform vec3 cameraPosition;
uniform vec3 electricColor; // #00d9ff
uniform float reflectivity;
uniform float circuitDensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

// Pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Circuit pattern
float circuitPattern(vec2 p) {
  vec2 grid = fract(p * circuitDensity);
  float pattern = 0.0;

  // Horizontal and vertical lines
  pattern += step(0.95, grid.x) + step(0.95, grid.y);

  // Random connection points
  float r = random(floor(p * circuitDensity));
  pattern += step(0.97, r) * 0.5;

  return pattern;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Sharp fresnel for obsidian
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 5.0);

  // Minimal refraction (dark glass)
  vec3 refracted = refract(-viewDir, vNormal, 0.95);
  vec4 envColor = textureCube(envMap, refracted);

  // Circuit-like reflections
  vec2 circuitUV = vWorldPosition.xy + vWorldPosition.yz;
  float circuit = circuitPattern(circuitUV);

  // Animated electric flow
  float flow = sin(circuit * 10.0 - time * 2.0) * 0.5 + 0.5;
  vec3 circuitColor = electricColor * circuit * flow * 0.3;

  // Reflection
  vec3 reflected = reflect(-viewDir, vNormal);
  vec4 reflectionColor = textureCube(envMap, reflected);

  // High contrast composition
  vec3 finalColor = envColor.rgb * (1.0 - reflectivity) +
                    reflectionColor.rgb * reflectivity * 0.5 +
                    circuitColor +
                    fresnel * electricColor * 0.6;

  // Darken for obsidian effect
  finalColor *= 0.4;

  gl_FragColor = vec4(finalColor, 0.95);
}
`

export const obsidianGlassMaterialConfig = {
  electricColor: [0.0, 0.85, 1.0],
  reflectivity: 0.8,
  circuitDensity: 20.0
}
