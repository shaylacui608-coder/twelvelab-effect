precision highp float;

uniform sampler2D uStrip;
uniform float uIor;
uniform float uRefractStrength;
uniform vec3 uTint;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vPlanarUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  vec3 refracted = refract(-V, N, 1.0 / uIor);
  vec2 refractOffset = refracted.xy * uRefractStrength;
  vec2 baseUv = vPlanarUv + refractOffset;

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
