precision highp float;

uniform sampler2D uVideo;
uniform vec2 uMotionDir;
uniform float uMotionStrength;
uniform float uIor;
uniform float uDispersion;
uniform float uRefractStrength;
uniform vec3 uTint;
uniform float uTime;
uniform vec2 uVideoAspectFit;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vPlanarUv;

const int BLUR_TAPS = 16;

vec2 fitUv(vec2 uv) {
  return (uv - 0.5) * uVideoAspectFit + 0.5;
}

vec3 sampleVideoBlurred(vec2 uv, float channelOffset) {
  vec2 uvC = uv + channelOffset;

  vec2 delta = uMotionDir * uMotionStrength / float(BLUR_TAPS);
  vec3 accum = vec3(0.0);
  float wsum = 0.0;

  for (int i = 0; i < BLUR_TAPS; i++) {
    float t = (float(i) / float(BLUR_TAPS - 1)) - 0.5;
    float w = 1.0 - abs(t) * 1.4;
    w = max(w, 0.0);
    vec2 sampleUv = fitUv(uvC + delta * t);
    sampleUv = clamp(sampleUv, vec2(0.001), vec2(0.999));
    accum += texture2D(uVideo, sampleUv).rgb * w;
    wsum += w;
  }
  return accum / max(wsum, 0.0001);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  vec3 refracted = refract(-V, N, 1.0 / uIor);

  vec2 refractOffset = refracted.xy * uRefractStrength;

  vec2 baseUv = vPlanarUv + refractOffset;

  float r = sampleVideoBlurred(baseUv, -uDispersion).r;
  float g = sampleVideoBlurred(baseUv,  0.0).g;
  float b = sampleVideoBlurred(baseUv,  uDispersion).b;
  vec3 col = vec3(r, g, b);

  col *= uTint;

  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float sheen = smoothstep(0.2, 1.0, N.y) * pow(1.0 - NdotV, 1.3);
  col += vec3(0.85, 0.88, 0.92) * sheen * 0.35;

  vec3 rim = mix(vec3(1.0, 0.55, 0.35), vec3(0.4, 0.85, 1.0), (N.x + 1.0) * 0.5);
  col += rim * fresnel * 0.18;

  col = mix(col, col * 0.92 + 0.06, fresnel * 0.4);

  float alpha = mix(0.94, 1.0, 1.0 - fresnel);

  gl_FragColor = vec4(col, alpha);
}
