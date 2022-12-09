import {
    WebGLRenderer,
    Scene,
    OrthographicCamera,
    BufferGeometry,
    BufferAttribute,
    ShaderMaterial,
    Points,
    LinearFilter,
    WebGLRenderTarget,
    PlaneGeometry,
    RGBAFormat,
    Mesh,
    Texture,
} from 'three';

type ParticleRendererOptions = {
    width: number;
    height: number;
    particleSize: number;
    trajectoryFactor: number;
};

export class ParticleRenderer {
    renderer: WebGLRenderer;
    vertexTexture: Texture;

    singleRenderTarget: WebGLRenderTarget;

    currRenderTarget: WebGLRenderTarget;
    prevRenderTarget: WebGLRenderTarget;
    renderTargetSwap: WebGLRenderTarget;

    camera: OrthographicCamera;
    singleScene: Scene;
    singleMaterial: ShaderMaterial;
    mixScene: Scene;
    mixMesh: Mesh<PlaneGeometry, ShaderMaterial>;

    constructor(
        renderer: WebGLRenderer,
        vertexTexture: Texture,
        options: ParticleRendererOptions,
    ) {
        this.renderer = renderer;
        this.vertexTexture = vertexTexture;

        const { width, height, particleSize, trajectoryFactor } = options;

        this.singleRenderTarget = new WebGLRenderTarget(width, height, {
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            format: RGBAFormat,
        });

        this.currRenderTarget = new WebGLRenderTarget(width, height, {
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            format: RGBAFormat,
        });
        this.prevRenderTarget = new WebGLRenderTarget(width, height, {
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            format: RGBAFormat,
        });
        this.renderTargetSwap = this.prevRenderTarget;

        this.singleScene = new Scene();
        this.camera = new OrthographicCamera(
            width / -2,
            width / 2,
            height / 2,
            height / -2,
            0,
        );

        const geometry = new BufferGeometry();
        const vertices = new Float32Array(width * height * 3);
        const uv = new Float32Array(width * height * 2);
        let p = 0;
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                uv[p++] = i / (width - 1);
                uv[p++] = j / (height - 1);
            }
        }

        const attVert = new BufferAttribute(vertices, 3);
        const attUv = new BufferAttribute(uv, 2);
        geometry.setAttribute('position', attVert);
        geometry.setAttribute('uv', attUv);
        this.singleMaterial = new ShaderMaterial({
            uniforms: {
                posTexture: {
                    value: null,
                },
                prevTexture: {
                    value: null,
                },
                particleSize: {
                    value: particleSize,
                },
            },
            vertexShader: `
                uniform sampler2D posTexture;
                uniform float particleSize;
                varying vec2 vUv;
                varying vec4 vPos;
    
                void main() {
                    vUv = uv;
                    vPos = texture2D( posTexture, vUv);
                    
                    gl_PointSize = particleSize;
                    gl_Position =  projectionMatrix * modelViewMatrix * vec4(vPos.xy, 0.0, vPos.w);
                }
            `,
            fragmentShader: `
                varying vec4 vPos;
                void main() {
                    float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
                    if ( f > 0.3 ) {
                        discard;
                    }
                    gl_FragColor = vec4(vec3(1.0), vPos.w);
                }
            `,
        });
        const points = new Points(geometry, this.singleMaterial);
        this.singleScene.add(points);

        this.mixMesh = new Mesh(
            new PlaneGeometry(width, height),
            new ShaderMaterial({
                uniforms: {
                    currTexture: {
                        value: null,
                    },
                    prevTexture: {
                        value: null,
                    },
                    trajectoryFactor: {
                        value: trajectoryFactor,
                    },
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    }
                `,
                fragmentShader: `
                    uniform sampler2D currTexture;
                    uniform sampler2D prevTexture;
                    uniform float trajectoryFactor;
                    varying vec2 vUv;
    
                    void main() {
                        vec4 curr = texture2D( currTexture, vUv );
                        vec4 prev = texture2D( prevTexture, vUv ) - trajectoryFactor;
                        gl_FragColor = curr + prev;
                    }
                `,
            }),
        );

        this.mixScene = new Scene();
        this.mixScene.add(this.mixMesh);
    }

    updateVertexTexture(texture: Texture) {
        this.vertexTexture = texture;
    }

    getTexture() {
        return this.currRenderTarget.texture;
    }

    render() {
        // update vertices
        this.singleMaterial.uniforms.posTexture.value = this.vertexTexture;

        // render current vertices
        this.renderer.setRenderTarget(this.singleRenderTarget);
        this.renderer.render(this.singleScene, this.camera);
        this.renderer.setRenderTarget(null);

        // overlay two texture as a gradient: current vertieces and vertices 1-frame ago
        this.mixMesh.material.uniforms.currTexture.value =
            this.singleRenderTarget.texture;
        this.mixMesh.material.uniforms.prevTexture.value =
            this.prevRenderTarget.texture;
        this.renderer.setRenderTarget(this.currRenderTarget);
        this.renderer.render(this.mixScene, this.camera);
        this.renderer.setRenderTarget(null);

        // swap
        this.renderTargetSwap = this.currRenderTarget;
        this.currRenderTarget = this.prevRenderTarget;
        this.prevRenderTarget = this.renderTargetSwap;
    }
}
