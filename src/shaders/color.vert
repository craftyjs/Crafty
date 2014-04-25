attribute vec2 aPosition;
attribute vec3 aOrientation;
attribute vec2 aLayer;
attribute vec4 aColor;

varying lowp vec4 vColor;

uniform  vec4 uViewport;

mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);
vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);

void main() {
  vec2 pos = aPosition;
  vec2 entityOrigin = aOrientation.xy;
  mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));

  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aLayer.x) ), 1) );
  vColor = vec4(aColor.rgb*aColor.a*aLayer.y, aColor.a*aLayer.y);
}