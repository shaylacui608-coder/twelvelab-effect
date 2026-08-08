precision highp float;

uniform sampler2D uStrip;
uniform float uIor;
uniform float uRefractStrength;
uniform vec3 uTint;
uniform float uTime;
uniform float uHalfDepth;
uniform float uPasteWidth;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vPlanarUv;
varying vec3 vLocalPosition;
varying vec3 vLocalNormal;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  vec3 refracted = refract(-V, N, 1.0 / uIor);
  vec2 refractOffset = refracted.xy * uRefractStrength;
  float frontStripU = mix(uPasteWidth, 0.999, vPlanarUv.x);
  float sideDepthUv = clamp(vLocalPosition.z / (2.0 * uHalfDepth) + 0.5, 0.0, 1.0);
  float leftSideStripU = mix(0.001, uPasteWidth, sideDepthUv);
  float leftSideMask = smoothstep(0.12, 0.62, -normalize(vLocalNormal).x);
  float topSideMask = smoothstep(0.18, 0.72, normalize(vLocalNormal).y);
  float topTrailU = mix(uPasteWidth + 0.08, 0.999, vPlanarUv.x);
  float frozenTopU = floor(topTrailU * 8.0) / 8.0 + 0.0625;
  float topBandV = mix(0.82, 0.995, sideDepthUv);
  vec2 topUv = vec2(mix(topTrailU, frozenTopU, 0.45), topBandV);

  vec2 surfaceUv = vec2(frontStripU, vPlanarUv.y);
  surfaceUv = mix(surfaceUv, topUv, topSideMask);
  surfaceUv = mix(surfaceUv, vec2(leftSideStripU, vPlanarUv.y), leftSideMask);
  vec2 baseUv = surfaceUv + refractOffset;

  vec2 clamped = clamp(baseUv, vec2(0.001), vec2(0.999));
  vec3 col = texture2D(uStrip, clamped).rgb;

  col *= uTint;

  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.5);

  float sheen = smoothstep(0.15, 1.0, N.y) * pow(1.0 - NdotV, 1.2);
  col += vec3(0.95, 0.96, 0.98) * sheen * 0.2;

  col += vec3(0.9, 0.92, 0.95) * fresnel * 0.08;

  gl_FragColor = vec4(col, 1.0);
}
