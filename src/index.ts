import { NearestFilter, TextureLoader, WebGLRenderer } from 'three';
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
};

export class GpuParticle {
    private vertexTexture: VertexTexture;
    private particleRenderer: ParticleRenderer;

    constructor(
        renderer: WebGLRenderer,
        velocityTexturePath: string,
        options: Options = {},
    ) {
        const width = options.width ?? 1024;
        const height = options.height ?? 1024;

        const velocityTexture = new TextureLoader().load(velocityTexturePath);
        velocityTexture.magFilter = NearestFilter;
        velocityTexture.minFilter = NearestFilter;

        this.vertexTexture = new VertexTexture(renderer, velocityTexture, {
            width,
            height,
            particleSpeed: options.particleSpeed ?? 2,
            particleCount: options.particleCount ?? 64,
            dropFactor: options.dropFactor ?? 50,
        });
        this.particleRenderer = new ParticleRenderer(
            renderer,
            this.vertexTexture.getTexture(),
            {
                width,
                height,
                particleSize: options.particleSize ?? 2,
                trajectoryFactor: options.trajectoryFactor ?? 0.01,
            },
        );
    }

    getParticleTexture() {
        return this.particleRenderer.getTexture();
    }

    render() {
        this.vertexTexture.compute();
        this.particleRenderer.render();
    }
}
