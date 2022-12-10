import{S as o,W as i,O as c,H as s,G as l,a as d,D as u,T as v,M as m,P as p}from"./index.142fd074.js";const r=1e3,t=500,e={scene:new o,renderer:new i({alpha:!0,antialias:!0}),camera:new c(-r*.5,r*.5,t*.5,-t*.5,-1e3,1e3)};e.camera.position.z=1;document.querySelector("#three").appendChild(e.renderer.domElement);e.renderer.setSize(r,t);const h=new s(8947848,255,1);e.scene.add(h);const a=new l(e.renderer,"./wind.png",{width:r,height:t}),g=new d({side:u,transparent:!0,uniforms:{orthoTexture:{value:new v().load("./wind.png")},particleTexture:{value:a.getParticleTexture()}},vertexShader:`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,fragmentShader:`
        uniform sampler2D orthoTexture;
        uniform sampler2D particleTexture;
        varying vec2 vUv;
        void main() {
            vec4 orthoColor = texture2D(orthoTexture, vUv);
            vec4 particleColor = texture2D(particleTexture, vUv);
            gl_FragColor = vec4(mix(orthoColor.rgb, particleColor.rgb, particleColor.a), 1.0);
        }
    `}),w=new m(new p(r,t),g);e.scene.add(w);const n=()=>{a.render(),e.renderer.render(e.scene,e.camera),requestAnimationFrame(n)};n();
