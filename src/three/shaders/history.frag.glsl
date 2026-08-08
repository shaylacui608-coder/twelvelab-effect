precision highp float;

uniform sampler2D uPrev;
uniform sampler2D uVideo;
uniform float uShiftUv;
uniform float uPasteWidth;
uniform vec2 uVideoAspectFit;

varying vec2 vUv;

void main() {
  vec2 srcUv = vec2(vUv.x - uShiftUv, vUv.y);
  vec3 prevCol = texture2D(uPrev, clamp(srcUv, vec2(0.001), vec2(0.999))).rgb;
  vec3 col = prevCol;

  if (vUv.x < uPasteWidth) {
    float regionU = vUv.x / uPasteWidth;
    vec2 videoUv = vec2(regionU, vUv.y);
    videoUv = (videoUv - 0.5) * uVideoAspectFit + 0.5;
    videoUv = clamp(videoUv, vec2(0.001), vec2(0.999));
    vec3 videoCol = texture2D(uVideo, videoUv).rgb;

    float edge = 1.0 - smoothstep(uPasteWidth * 0.65, uPasteWidth, vUv.x);
    col = mix(prevCol, videoCol, edge);
  }

  gl_FragColor = vec4(col, 1.0);
}
