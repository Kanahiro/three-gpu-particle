import { Texture, WebGLRenderer } from 'three';
import { ParticleRenderer } from './particleRenderer';
import { VertexTexture } from './vertexTexture';

type Options = {
    width?: number;
    height?: number;
    particleSize?: number;
    particleSpeed?: number;
    particleCount?: number;
    dropFactor?: number;
    trajectoryFactor?: number;
    repeat?: boolean;
};

export class GpuParticle {
    private vertexTexture: VertexTexture;
    private particleRenderer: ParticleRenderer;

    constructor(
        renderer: WebGLRenderer,
        velocityTexture: Texture,
        options: Options = {},
    ) {
        const width = options.width ?? 1024;
        const height = options.height ?? 1024;

        this.vertexTexture = new VertexTexture(renderer, velocityTexture, {
            width,
            height,
            particleSpeed: options.particleSpeed ?? 2,
            particleCount: options.particleCount ?? 64,
            dropFactor: options.dropFactor ?? 50,
            repeat: options.repeat ?? false,
        });
        this.particleRenderer = new ParticleRenderer(
            renderer,
            this.vertexTexture.getTexture(),
            {
                width,
                height,
                particleSize: options.particleSize ?? 3,
                trajectoryFactor: options.trajectoryFactor ?? 0.01,
            },
        );
    }

    setVelocityTexture(texture: Texture) {
        this.vertexTexture.updateVelocityTexture(texture);
    }

    setParticleSpeed(particleSpeed: number) {
        this.vertexTexture.updateParticleSpeed(particleSpeed);
    }

    getParticleTexture() {
        return this.particleRenderer.getTexture();
    }

    render() {
        this.vertexTexture.compute();
        this.particleRenderer.render();
    }
}
