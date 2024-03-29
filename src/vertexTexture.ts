import { WebGLRenderer, Texture, DataTexture } from 'three';
import {
    GPUComputationRenderer,
    Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer';

type VertexTextureOptions = {
    width: number;
    height: number;
    particleSpeed: number;
    particleCount: number;
    dropFactor: number;
    repeat: boolean;
};

export class VertexTexture {
    private gpuRenderer: GPUComputationRenderer;
    private computationVariable: Variable;
    private velocityTexture: Texture;
    private vertexTexture: DataTexture;

    constructor(
        renderer: WebGLRenderer,
        velocityTexture: Texture,
        options: VertexTextureOptions,
    ) {
        this.velocityTexture = velocityTexture;

        const {
            width,
            height,
            particleSpeed,
            particleCount,
            dropFactor,
            repeat,
        } = options;

        this.gpuRenderer = new GPUComputationRenderer(
            particleCount,
            particleCount,
            renderer,
        );

        this.vertexTexture = this.gpuRenderer.createTexture();

        // init vertices
        for (let i = 0; i < this.vertexTexture.image.data.length / 4; i++) {
            this.vertexTexture.image.data[i * 4] =
                (Math.random() - 0.5) * width; // x
            this.vertexTexture.image.data[i * 4 + 1] =
                (Math.random() - 0.5) * height; // y
            this.vertexTexture.image.data[i * 4 + 2] =
                Math.random() * dropFactor; // age
            this.vertexTexture.image.data[i * 4 + 3] = 0; // velocity
        }

        this.computationVariable = this.gpuRenderer.addVariable(
            'computationTexture',
            `
            precision highp float;
            
            uniform sampler2D velocityTexture;
            uniform float particleSpeed;
            uniform float dropFactor;
            uniform bool repeat;
    
            float rand(vec2 p){
                return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
            }
    
            vec3 getVelocity(vec2 pos) {
                float xPx = 1.0 / ${width}.0;
                float yPx = 1.0 / ${height}.0;
                vec2 centerUv = vec2(pos.x / ${width}.0 + 0.5, 
                                    pos.y / ${height}.0 + 0.5);
                vec3 center = texture2D(velocityTexture, centerUv).rgb;
                vec3 left = texture2D(velocityTexture, centerUv - vec2(xPx, 0.0)).rgb;
                vec3 top = texture2D(velocityTexture, centerUv + vec2(0.0, yPx)).rgb;
                vec3 right = texture2D(velocityTexture, centerUv + vec2(xPx, 0.0)).rgb;
                vec3 bottom = texture2D(velocityTexture, centerUv - vec2(0.0, yPx)).rgb;
                
                vec3 avg = (center + left + top + right + bottom) * 0.2 - vec3(vec2(0.49803922), 0.0);;

                return avg;
            }
    
            void main()	{
    
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 position = texture2D(computationTexture, uv);

                float age = position.z;
    
                vec3 velocity = getVelocity(position.xy);
                if (age > dropFactor) {
                    // reset particle position
                    vec2 random = vec2((rand(position.xy) - 0.5) * ${width}.0, (rand(position.yx) - 0.5) * ${height}.0);
                    gl_FragColor = vec4(random, 0.0, 0.0);
                } else {
                    float absVelocity = length(velocity.xy);
                    vec2 newPosition = position.xy + velocity.xy * particleSpeed;
                    if (repeat) {
                        if (newPosition.x < -0.5 * ${width}.0) {
                            newPosition.x += 1.0 * ${width}.0;
                        } else if (0.5 * ${width}.0 < newPosition.x) {
                            newPosition.x -= 1.0 * ${width}.0;
                        }
                        if (newPosition.y < -0.5 * ${height}.0) {
                            newPosition.y += 1.0 * ${height}.0;
                        } else if (0.5 * ${height}.0 < newPosition.y) {
                            newPosition.y -= 1.0 * ${height}.0;
                        }
                    }
                    gl_FragColor = vec4(newPosition, age + rand(vec2(absVelocity, age)), absVelocity);
                }
            }
        `,
            this.vertexTexture,
        );

        this.computationVariable.material.uniforms = {
            velocityTexture: { value: this.velocityTexture },
            particleSpeed: { value: particleSpeed },
            dropFactor: { value: dropFactor },
            repeat: { value: repeat },
        };

        this.gpuRenderer.setVariableDependencies(this.computationVariable, [
            this.computationVariable,
        ]);
        this.gpuRenderer.init();
    }

    getTexture() {
        return this.gpuRenderer.getCurrentRenderTarget(this.computationVariable)
            .texture;
    }

    updateVelocityTexture(texture: Texture) {
        this.computationVariable.material.uniforms.velocityTexture.value =
            texture;
    }

    updateParticleSpeed(particleSpeed: number) {
        this.computationVariable.material.uniforms.particleSpeed.value =
            particleSpeed;
    }

    updateDropFactor(dropFactor: number) {
        this.computationVariable.material.uniforms.dropFactor.value =
            dropFactor;
    }

    compute() {
        this.gpuRenderer.compute();
    }
}
