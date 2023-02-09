import * as THREE from 'three';

// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GpuParticle } from '../src/index';

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 400;

const threeObject = {
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer({ alpha: true, antialias: true }),
    camera: new THREE.OrthographicCamera(
        -VIEW_WIDTH * 0.5,
        VIEW_WIDTH * 0.5,
        VIEW_HEIGHT * 0.5,
        -VIEW_HEIGHT * 0.5,
        -1000,
        1000,
    ),
};
threeObject.camera.position.z = 1;

//const controls = new OrbitControls(threeObject.camera, document.body);

document.querySelector('#three')!.appendChild(threeObject.renderer.domElement);
threeObject.renderer.setSize(VIEW_WIDTH, VIEW_HEIGHT);

const velocityTexture = new THREE.TextureLoader().load('./wind.png');
velocityTexture.magFilter = THREE.NearestFilter;
velocityTexture.minFilter = THREE.NearestFilter;
const velocityTexture2 = new THREE.TextureLoader().load('./wind2.png');
velocityTexture2.magFilter = THREE.NearestFilter;
velocityTexture2.minFilter = THREE.NearestFilter;

const gpuParticle = new GpuParticle(threeObject.renderer, velocityTexture);

const viewMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
        backgroundTexture: {
            value: velocityTexture,
        },
        particleTexture: {
            value: gpuParticle.getParticleTexture(),
        },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
        uniform sampler2D backgroundTexture;
        uniform sampler2D particleTexture;
        varying vec2 vUv;
        void main() {
            vec4 backgroundColor = texture2D(backgroundTexture, vUv);
            vec4 particleColor = texture2D(particleTexture, vUv);
            gl_FragColor = vec4(mix(backgroundColor.rgb, particleColor.rgb, particleColor.a), 1.0);
        }
    `,
});
const view = new THREE.Mesh(
    new THREE.PlaneGeometry(VIEW_WIDTH, VIEW_HEIGHT),
    viewMaterial,
);
threeObject.scene.add(view);

// ui
document.getElementById('wind1')!.onclick = () => {
    gpuParticle.setVelocityTexture(velocityTexture);
    gpuParticle.setParticleSpeed(2);
    viewMaterial.uniforms.backgroundTexture.value = velocityTexture;
};
document.getElementById('wind2')!.onclick = () => {
    gpuParticle.setVelocityTexture(velocityTexture2);
    gpuParticle.setParticleSpeed(8);
    viewMaterial.uniforms.backgroundTexture.value = velocityTexture2;
};

const animate = () => {
    gpuParticle.render();
    threeObject.renderer.render(threeObject.scene, threeObject.camera);
    requestAnimationFrame(animate);
};
animate();
