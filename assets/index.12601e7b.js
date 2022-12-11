import{S as d,W as s,O as m,T as l,N as o,G as v,a as g,D as p,M as x,P as w}from"./index.f7462749.js";const a=1e3,n=500,e={scene:new d,renderer:new s({alpha:!0,antialias:!0}),camera:new m(-a*.5,a*.5,n*.5,-n*.5,-1e3,1e3)};e.camera.position.z=1;document.querySelector("#three").appendChild(e.renderer.domElement);e.renderer.setSize(a,n);const r=new l().load("./wind.png");r.magFilter=o;r.minFilter=o;const i=new l().load("./wind2.png");i.magFilter=o;i.minFilter=o;const t=new v(e.renderer,r,{width:a,height:n}),c=new g({side:p,transparent:!0,uniforms:{backgroundTexture:{value:r},particleTexture:{value:t.getParticleTexture()}},vertexShader:`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,fragmentShader:`
        uniform sampler2D backgroundTexture;
        uniform sampler2D particleTexture;
        varying vec2 vUv;
        void main() {
            vec4 backgroundColor = texture2D(backgroundTexture, vUv);
            vec4 particleColor = texture2D(particleTexture, vUv);
            gl_FragColor = vec4(mix(backgroundColor.rgb, particleColor.rgb, particleColor.a), 1.0);
        }
    `}),T=new x(new w(a,n),c);e.scene.add(T);document.getElementById("wind1").onclick=()=>{t.setVelocityTexture(r),t.setParticleSpeed(2),c.uniforms.backgroundTexture.value=r};document.getElementById("wind2").onclick=()=>{t.setVelocityTexture(i),t.setParticleSpeed(8),c.uniforms.backgroundTexture.value=i};const u=()=>{t.render(),e.renderer.render(e.scene,e.camera),requestAnimationFrame(u)};u();
