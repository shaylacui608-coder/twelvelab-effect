uniform vec2 uHalfSize;
uniform float uHalfDepth;
uniform float uNormalCurve;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 localNormal = normalize(normal);
  vec3 curvedNormal = normalize(vec3(
    position.x / max(uHalfSize.x, 0.001),
    position.y / max(uHalfSize.y, 0.001),
    position.z / max(uHalfDepth, 0.001)
  ));
  vec3 bentNormal = normalize(mix(localNormal, curvedNormal, uNormalCurve));

  vNormal = normalize(normalMatrix * bentNormal);
  vViewDir = normalize(-mvPosition.xyz);

  gl_Position = projectionMatrix * mvPosition;
}
