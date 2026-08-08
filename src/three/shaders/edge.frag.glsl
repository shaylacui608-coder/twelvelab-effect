precision highp float;

uniform vec3 uEdgeColor;
uniform float uEdgeStrength;
uniform float uEdgePower;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float softRim = pow(1.0 - NdotV, uEdgePower);
  float brightHairline = pow(1.0 - NdotV, 12.0);
  float alpha = clamp(softRim * uEdgeStrength + brightHairline * 0.16, 0.0, 0.6);

  gl_FragColor = vec4(uEdgeColor, alpha);
}
