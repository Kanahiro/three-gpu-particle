import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GpuParticle } from '../src/index';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 500;

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

const light = new THREE.HemisphereLight(0x888888, 0x0000ff, 1.0);
threeObject.scene.add(light);

const gpuParticle = new GpuParticle(threeObject.renderer, './wind.png', {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
});

const terrainMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
        orthoTexture: {
            value: new THREE.TextureLoader().load('./wind.png'),
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
        uniform sampler2D orthoTexture;
        uniform sampler2D particleTexture;
        varying vec2 vUv;
        void main() {
            vec4 orthoColor = texture2D(orthoTexture, vUv);
            vec4 particleColor = texture2D(particleTexture, vUv);
            gl_FragColor = vec4(mix(orthoColor.rgb, particleColor.rgb, particleColor.a), 1.0);
        }
    `,
});
const view = new THREE.Mesh(
    new THREE.PlaneGeometry(VIEW_WIDTH, VIEW_HEIGHT),
    terrainMaterial,
);
threeObject.scene.add(view);

const animate = () => {
    gpuParticle.render();
    threeObject.renderer.render(threeObject.scene, threeObject.camera);
    requestAnimationFrame(animate);
};
animate();
