import * as THREE from 'three';
import { GpuParticle } from '../src/index';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 1000;

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
        uniform sampler2D particleTexture;
        varying vec2 vUv;
        void main() {
            vec4 particleColor = texture2D(particleTexture, vUv);
            gl_FragColor = vec4(particleColor);
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

import maplibreGl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';

const terrainSource = useGsiTerrainSource(maplibreGl.addProtocol);

const map = new Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                maxzoom: 19,
                tileSize: 256,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
            terrainSource,
        },
        layers: [
            {
                id: 'osm-layer',
                source: 'osm',
                type: 'raster',
            },
        ],
    },
});

map.on('load', () => {
    map.addSource('three', {
        type: 'canvas',
        canvas: threeObject.renderer.domElement,
        coordinates: [
            [-180, 85],
            [180, 85],
            [180, -85],
            [-180, -85],
        ],
    });

    map.addLayer({
        id: 'three',
        source: 'three',
        type: 'raster',
        paint: {
            'raster-opacity': 1.0,
        },
    });
});
