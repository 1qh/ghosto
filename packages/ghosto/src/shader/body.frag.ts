const bodyFrag = `
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform vec3 uBaseColor;
uniform vec3 uCoreColor;
uniform float uHeat;
uniform float uJoy;
uniform vec3 uPointer3D;
uniform vec3 uCameraPos;
uniform float uTime;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 L1 = normalize(vec3(-0.4, 0.85, 0.5));
  vec3 L2 = normalize(vec3(0.7, -0.2, 0.6));
  float NdotL1 = max(dot(N, L1), 0.0);
  float NdotL2 = max(dot(N, L2), 0.0);
  float NdotV = max(dot(N, V), 0.0);
  float wrap = 1.0;
  float diffuse = max((dot(N, L1) + wrap) / (1.0 + wrap), 0.0) * 0.35 + 0.65;
  float fillLight = NdotL2 * 0.18;
  float fresnel = pow(1.0 - NdotV, 3.5);
  vec3 col = uBaseColor * (diffuse + fillLight);
  col *= (1.0 - fresnel * 0.18);
  col += vec3(0.85, 0.88, 0.92) * fresnel * 0.05;
  float dPointer = length(vWorldPos - uPointer3D);
  float radial = smoothstep(0.9, 0.0, dPointer);
  col = mix(col, uCoreColor, radial * uHeat * 0.3);
  col += col * uJoy * 0.05;
  gl_FragColor = vec4(col, 1.0);
}
`
export { bodyFrag }
