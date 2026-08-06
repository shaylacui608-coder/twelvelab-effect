uniform vec2 uHalfSize;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vPlanarUv;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);

  vPlanarUv = position.xy / (2.0 * uHalfSize) + 0.5;

  gl_Position = projectionMatrix * mvPosition;
}
