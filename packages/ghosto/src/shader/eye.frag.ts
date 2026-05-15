const eyeVert = `
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform float uClosed;
uniform float uSad;
uniform float uBlink;
void main(){
  vec3 p = position;
  p.x *= 0.42;
  p.y *= 1.35;
  p.z *= 0.42;
  float blendUp = clamp(uClosed - uSad * 0.5, 0.0, 1.0);
  float blendDn = clamp(uSad, 0.0, 1.0);
  float blend = max(blendUp, blendDn);
  float s = blendDn > blendUp ? -1.0 : 1.0;
  float wideMul = mix(1.0, 3.2, blend);
  float xWide = p.x * wideMul;
  float archPeak = s * 0.04;
  float archK = 5.5;
  float archY = archPeak - s * archK * xWide * xWide;
  float tubeFlat = mix(1.0, 0.14, blend);
  float arched = mix(p.y, archY + p.y * tubeFlat, blend);
  arched -= uBlink * 0.05;
  p.x = xWide;
  p.y = arched;
  p.z = p.z * mix(1.0, 0.4, blend);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
const eyeFrag = `
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform vec3 uColor;
uniform vec3 uCameraPos;
uniform float uHighlight;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float NdotV = max(dot(N, V), 0.0);
  float rim = pow(1.0 - NdotV, 1.2);
  vec3 col = uColor * (0.92 + 0.08 * rim) + vec3(0.08) * uHighlight;
  gl_FragColor = vec4(col, 1.0);
}
`
export { eyeFrag, eyeVert }
