varying mediump vec3 vTextureCoord;
  
uniform sampler2D uSampler;
uniform mediump vec2 uTextureDimensions;

void main(void) {
  highp vec2 coord =   vTextureCoord.xy / uTextureDimensions;
  mediump vec4 base_color = texture2D(uSampler, coord);
  gl_FragColor = vec4(base_color.rgb*base_color.a*vTextureCoord.z, base_color.a*vTextureCoord.z);
}