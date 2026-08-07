precision highp float;

uniform sampler2D uStrip;
uniform float uSoftness;
uniform float uIor;
uniform float uRefractStrength;
uniform vec3 uTint;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vPlanarUv;

const int SOFT_TAPS = 5;

vec3 sampleStrip(vec2 uv) {
  vec2 c = clamp(uv, vec2(0.001), vec2(0.999));
  return texture2D(uStrip, c).rgb;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  vec3 refracted = refract(-V, N, 1.0 / uIor);
  vec2 refractOffset = refracted.xy * uRefractStrength;
  vec2 baseUv = vPlanarUv + refractOffset;

  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < SOFT_TAPS; i++) {
    float t = (float(i) / float(SOFT_TAPS - 1) - 0.5) * 2.0;
    float w = 1.0 - abs(t) * 0.5;
    vec2 offset = vec2(t * uSoftness, t * uSoftness * 0.4);
    col += sampleStrip(baseUv + offset) * w;
    wsum += w;
  }
  col /= max(wsum, 0.0001);

  col *= uTint;

  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.5);

  float sheen = smoothstep(0.1, 1.0, N.y) * pow(1.0 - NdotV, 1.2);
  col += vec3(0.95, 0.96, 0.98) * sheen * 0.3;

  col += vec3(0.9, 0.92, 0.95) * fresnel * 0.1;

  col = mix(col, col * 1.04 + 0.015, sheen * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
