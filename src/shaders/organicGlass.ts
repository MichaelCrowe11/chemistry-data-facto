/**
 * Organic Glass Material Shader
 * Soft, translucent, organic flow for Synapse-Code
 */

export const organicGlassVertexShader = `
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

export const organicGlassFragmentShader = `
uniform samplerCube envMap;
uniform sampler2D noiseTexture;
uniform float time;
uniform vec3 cameraPosition;
uniform vec3 lightPosition;
uniform vec3 bioluminescentColor; // #00ffd9
uniform vec3 amberColor; // #ffaa00
uniform float flowSpeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

// Perlin noise approximation
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 lightDir = normalize(lightPosition - vWorldPosition);

  // Organic flow texture
  vec2 flowUV = vUv + time * flowSpeed;
  float flow1 = fbm(flowUV * 3.0);
  float flow2 = fbm(flowUV * 5.0 + vec2(0.5, 0.5));
  float flowPattern = (flow1 + flow2) * 0.5;

  // Perturb normal with flow
  vec3 flowNormal = normalize(vNormal + vec3(
    (flow1 - 0.5) * 0.3,
    (flow2 - 0.5) * 0.3,
    0.0
  ));

  // Soft fresnel for organic glass
  float fresnel = pow(1.0 - max(dot(viewDir, flowNormal), 0.0), 2.5);

  // Multiple refractions for subsurface effect (chromatic aberration)
  vec3 refract1 = refract(-viewDir, flowNormal, 0.98);
  vec3 refract2 = refract(-viewDir, flowNormal, 0.96);
  vec3 refract3 = refract(-viewDir, flowNormal, 0.94);

  vec3 env1 = textureCube(envMap, refract1).rgb;
  vec3 env2 = textureCube(envMap, refract2).rgb;
  vec3 env3 = textureCube(envMap, refract3).rgb;

  // Blend for depth (subsurface scattering approximation)
  vec3 refraction = (env1 + env2 * 1.2 + env3 * 0.8) / 3.0;

  // Subsurface scattering
  float thickness = 0.5 + flowPattern * 0.5;
  float subsurface = pow(max(0.0, dot(-lightDir, flowNormal)), 2.0);
  vec3 subsurfaceColor = amberColor * subsurface * (1.0 - thickness) * 0.6;

  // Bioluminescence based on flow pattern
  vec3 bioGlow = bioluminescentColor * flowPattern * 0.4;

  // Combine all elements
  vec3 finalColor = refraction * 0.6 +
                    subsurfaceColor +
                    bioGlow +
                    fresnel * mix(bioluminescentColor, amberColor, 0.5) * 0.4;

  // Variable alpha for organic translucency
  float alpha = 0.85 + flowPattern * 0.15;

  gl_FragColor = vec4(finalColor, alpha);
}
`

export const organicGlassMaterialConfig = {
  bioluminescentColor: [0.0, 1.0, 0.85],
  amberColor: [1.0, 0.67, 0.0],
  flowSpeed: 0.03
}
