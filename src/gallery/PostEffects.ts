import * as THREE from 'three';
import { galleryLayout } from './layout.mjs';

const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const fragmentShader=`
uniform sampler2D scene,trail;uniform vec2 aspect,texel,drift;uniform float time,hole,radius,band,compact,ball,alphaMode;
varying vec2 vUv;
vec3 sampleAt(vec2 dir,float rad){vec2 uv=dir*rad*aspect.x/aspect+vec2(.5);if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec3(0.);return texture2D(scene,uv).rgb;}
float pull(float t,float e,float f){return f*e*e/max(t,.001);}
vec2 orbit(int i){
 if(i==0)return vec2(-.40,.69);if(i==1)return vec2(.40,.74);
 if(i==2)return vec2(-.44,-.69);if(i==3)return vec2(.43,-.73);
 if(i==4)return vec2(-.77,.02);return vec2(.78,-.04);
}
vec3 floaters(vec3 background,vec2 point,float r,float t,vec2 dir){
 float reveal=smoothstep(.4,.95,hole);
 if(reveal<.001)return background;
 for(int i=0;i<6;i++){
  if(compact>.5&&i>3)continue;
  float phase=float(i)*1.73;
  vec2 anchor=orbit(i);
  if(compact>.5)anchor=vec2(i==0||i==2?-.30:.30,i<2?.83:-.83);
  vec2 center=(anchor+vec2(sin(time*.37+phase),cos(time*.29+phase))*.015+drift*.025)*r;
  float size=r*mix(.11,.075,compact)*(1.+.12*sin(phase));
  float tilt=phase*.3+sin(time*.23+phase)*.3,c=cos(tilt),s=sin(tilt);
  vec2 local=mat2(c,-s,s,c)*(point-center)/vec2(size,size*1.42);
  float d=length(local),aa=max(fwidth(d),.002);
  if(d>1.+aa)continue;
  vec3 n=normalize(vec3(local,sqrt(max(0.,1.-dot(local,local)))));
  vec3 reflected=sampleAt(normalize(dir+n.xy*.55),abs(t+n.z*.04));
  float spot=pow(max(dot(n,normalize(vec3(-.48,.65,1.3))),0.),55.);
  float rim=pow(1.-max(n.z,0.),3.);
  vec3 pearl=vec3(.009,.012,.016)+reflected*.23+vec3(.75,.87,1.)*spot*1.35+vec3(.11,.15,.18)*rim;
  float mask=(1.-smoothstep(1.-aa,1.+aa,d))*reveal;
  background=mix(background,pearl,mask);
 }
 return background;
}
void main(){
 vec2 q=(vUv-.5)*aspect;float t=length(q)/aspect.x;vec2 dir=length(q)>.00001?normalize(q):vec2(1.,0.);
 float a=atan(q.y,q.x);float wave=(sin(a*3.+time*.7)*.6+sin(a*5.-time*.45)*.4)*radius*.012*hole;
 float r=hole*radius*(1.+.008*sin(time*1.1))+wave,e=r*1.6,fall=1.-smoothstep(r,r+band,t),draw=pull(t,e,fall);
 float angle=draw*(.4+time*.22);float c=cos(angle),s=sin(angle);vec2 sd=mat2(c,-s,s,c)*dir;float split=e*.004;
 vec3 rgb=vec3(sampleAt(sd,t-pull(t,e+split,fall)).r,sampleAt(sd,t-draw).g,sampleAt(sd,t-pull(t,e-split,fall)).b);
 float d=t-r,aa=max(fwidth(d),.0001);rgb=mix(rgb,vec3(0.),(1.-smoothstep(-aa,aa,d))*step(.0001,hole));
 float rimBand=smoothstep(0.,band*.12,d)*(1.-smoothstep(band*.5,band,d))*smoothstep(.25,.9,hole);
 float gleam=pow(.5+.5*dot(dir,normalize(vec2(-.5,.85))),6.);
 float ribs=.5+.5*sin(d/max(band,.001)*44.+a*3.-time*.65);
 rgb+=vec3(.74,.82,.9)*rimBand*(.045+.24*gleam)*(.65+.35*ribs);
 rgb=floaters(rgb,q/aspect.x,r,t,dir);
 vec2 taps=texel*1.5;vec2 g=vec2(texture2D(trail,vUv+vec2(taps.x,0.)).r-texture2D(trail,vUv-vec2(taps.x,0.)).r,texture2D(trail,vUv+vec2(0.,taps.y)).r-texture2D(trail,vUv-vec2(0.,taps.y)).r);
 float edge=mix(1.-smoothstep(.22,.5,length(vec2(vUv.x-.5,(vUv.y-.5)/aspect.x))),1.,alphaMode);
 vec2 off=g*(-.045)*ball*edge*(1.-hole);float m=smoothstep(0.,.002,length(off));vec3 warped=texture2D(scene,clamp(vUv+off,0.,1.)).rgb;
 float light=dot(-g,normalize(vec2(-.3,1.)))*(-1.2)*ball*edge*(1.-hole);float lum=dot(warped,vec3(.2126,.7152,.0722));warped*=1.+clamp(light,-.5,.5)*(1.-smoothstep(.7,.95,lum));
 float alpha=mix(texture2D(scene,vUv).a,texture2D(scene,clamp(vUv+off,0.,1.)).a,m);
 gl_FragColor=vec4(mix(rgb,warped,m),mix(1.,alpha,alphaMode));
 #include <colorspace_fragment>
}`;
const trailShader=`uniform sampler2D previous;uniform vec2 texel,pos;uniform float decay,diff,amp,aspect,rad;varying vec2 vUv;
void main(){float c=texture2D(previous,vUv).r;float n=texture2D(previous,vUv+vec2(texel.x,0.)).r+texture2D(previous,vUv-vec2(texel.x,0.)).r+texture2D(previous,vUv+vec2(0.,texel.y)).r+texture2D(previous,vUv-vec2(0.,texel.y)).r;
float h=mix(c,n*.25,diff)*decay;vec2 d=vUv-pos;d.y/=aspect;h+=amp*exp(-dot(d,d)/(rad*rad));gl_FragColor=vec4(min(h,1.5),0.,0.,1.);}`;

export class PostEffects{
  private target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  private trails=[0,1].map(()=>new THREE.WebGLRenderTarget(256,256,{type:THREE.HalfFloatType,depthBuffer:false}));
  private side=0;
  private camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  private stage=new THREE.Scene();private trailStage=new THREE.Scene();
  private quad=new THREE.PlaneGeometry(2,2);
  private post=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{scene:{value:this.target.texture},trail:{value:this.trails[0].texture},aspect:{value:new THREE.Vector2(1,1)},texel:{value:new THREE.Vector2(1/256,1/256)},drift:{value:new THREE.Vector2()},time:{value:0},hole:{value:0},radius:{value:.2},band:{value:.09},compact:{value:0},ball:{value:0},alphaMode:{value:0}},depthTest:false,depthWrite:false});
  private brush=new THREE.ShaderMaterial({vertexShader,fragmentShader:trailShader,uniforms:{previous:{value:this.trails[0].texture},texel:{value:new THREE.Vector2(1/256,1/256)},pos:{value:new THREE.Vector2(.5,.5)},decay:{value:1},diff:{value:0},amp:{value:0},aspect:{value:1},rad:{value:.04}},depthTest:false,depthWrite:false});
  private width=1;private height=1;private x=0;private y=0;private sx=0;private sy=0;private seen=false;private ink=0;
  constructor(transparent=false){this.post.uniforms.alphaMode.value=transparent?1:0;this.stage.add(new THREE.Mesh(this.quad,this.post));this.trailStage.add(new THREE.Mesh(this.quad,this.brush));}
  pointer(x:number,y:number){this.x=x;this.y=y;if(!this.seen){this.sx=x;this.sy=y;this.seen=true;}}
  resize(w:number,h:number,renderer:THREE.WebGLRenderer){this.width=w;this.height=h;const layout=galleryLayout(w,h),ratio=renderer.getPixelRatio();this.target.setSize(w*ratio,h*ratio);const th=Math.max(1,Math.round(256*h/w));this.trails.forEach(t=>{t.texture.type=renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;t.setSize(256,th);renderer.setRenderTarget(t);renderer.clear();});renderer.setRenderTarget(null);this.post.uniforms.aspect.value.set(w/h,1);this.post.uniforms.radius.value=layout.ringRadius;this.post.uniforms.band.value=layout.ringBand;this.post.uniforms.compact.value=layout.compact?1:0;this.post.uniforms.texel.value.set(1/256,1/th);this.brush.uniforms.texel.value.set(1/256,1/th);this.brush.uniforms.aspect.value=w/h;}
  resetPointer(){this.seen=false;this.ink=0;}
  releasePointer(){this.x=this.sx;this.y=this.sy;this.seen=false;}
  render(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,dt:number,hole:number,reduced=false,allowPointer=true){
    if(!reduced)this.post.uniforms.time.value+=dt;this.post.uniforms.hole.value=hole;
    this.sx+=(this.x-this.sx)*(1-Math.exp(-7*dt));this.sy+=(this.y-this.sy)*(1-Math.exp(-7*dt));
    this.post.uniforms.drift.value.set(this.seen&&!reduced?(this.sx/this.width-.5):0,this.seen&&!reduced?(.5-this.sy/this.height):0);
    const fieldWidth=this.post.uniforms.alphaMode.value?innerWidth:this.width;this.brush.uniforms.rad.value=.04*fieldWidth/this.width;
    const distance=Math.hypot(this.x-this.sx,this.y-this.sy)/fieldWidth,tension=Math.tanh(Math.max(0,distance-.025)/.08)**2;
    this.ink=Math.max(this.ink*Math.exp(-4*dt),tension);this.brush.uniforms.pos.value.set(this.x/this.width,1-this.y/this.height);this.brush.uniforms.amp.value=allowPointer&&!reduced&&this.seen?tension:0;this.brush.uniforms.decay.value=Math.exp(-4*dt);this.brush.uniforms.diff.value=1-Math.exp(-40*dt);
    this.brush.uniforms.previous.value=this.trails[this.side].texture;renderer.setRenderTarget(this.trails[1-this.side]);renderer.render(this.trailStage,this.camera);this.side=1-this.side;this.post.uniforms.trail.value=this.trails[this.side].texture;this.post.uniforms.ball.value=allowPointer&&!reduced&&this.ink>.004?1:0;
    renderer.setRenderTarget(this.target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(this.stage,this.camera);
  }
  dispose(){this.target.dispose();this.trails.forEach(t=>t.dispose());this.post.dispose();this.brush.dispose();this.quad.dispose();}
}
