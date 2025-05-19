import { BufferGeometry, Float32BufferAttribute, Shape, ShapeGeometry } from 'three';

export interface RoundedPlaneParameters {
    width: number;
    height: number;
    radius: number | string | Array<number | string>;
    segments: number;
}

export class RoundedPlaneGeometry extends BufferGeometry {
    parameters: RoundedPlaneParameters;

    /**
     * Creates a new RoundedPlaneGeometry instance
     * 
     * @param width - Width of the plane in world units. Must be a positive number.
     * @param height - Height of the plane in world units. Must be a positive number.
     * @param radius - Corner radius or array of radii for each corner in counterclockwise order starting from top-right:
     *                [topRight, topLeft, bottomLeft, bottomRight]
     *                Can be specified as:
     *                - Single number for uniform radius
     *                - Single percentage string (e.g. '10%') relative to min(width/2, height/2)
     *                - Array of numbers/percentages for individual corner radii
     * 
     * @param segments - Number of segments used to approximate curved corners. Higher values create smoother curves
     *                  but increase geometry complexity. Will be clamped to minimum of 1.
     */
    constructor(width = 2, height = 1, radius: number | string | Array<number | string> = '10%', segments = 16) {
        super();

        // Validate input parameters
        if (width <= 0 || height <= 0) throw new Error('Width and height must be positive');


        // Initialize basic parameters
        const segmentsCount = Math.max(1, Math.floor(segments));
        this.parameters = { width, height, radius, segments: segmentsCount };

        // Calculate half dimensions and base radius
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const baseRadius = Math.min(halfWidth, halfHeight);

        // Process radius values
        const radiusArray = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
        const cornerRadii = this.calculateCornerRadii(radiusArray, baseRadius);
        const [topRight, topLeft, bottomLeft, bottomRight] = cornerRadii;

        // Create rounded rectangle shape
        const shape = this.createRoundedRectangle(halfWidth, halfHeight, topRight, topLeft, bottomLeft, bottomRight);

        // Generate geometry and attributes
        const geometry = new ShapeGeometry(shape, segmentsCount);
        const positionAttribute = geometry.getAttribute('position') as Float32BufferAttribute;

        // Calculate UV coordinates
        const uvCoordinates = this.calculateUVCoordinates(positionAttribute, halfWidth, halfHeight, width, height);

        // Set geometry attributes
        this.setAttribute('position', positionAttribute.clone());
        this.setAttribute('uv', new Float32BufferAttribute(uvCoordinates, 2));

        if (geometry.getIndex()) this.setIndex(geometry.getIndex()!.clone());


        this.computeVertexNormals();
    }

    private calculateCornerRadii(rawRadii: Array<number | string>, baseRadius: number): [number, number, number, number] {
        return rawRadii.map(radius => {
            if (typeof radius === 'string' && radius.trim().endsWith('%')) {
                const percentage = parseFloat(radius.trim().slice(0, -1));

                if (isNaN(percentage)) throw new Error(`Invalid percentage value: ${radius}`);

                return Math.max(0, Math.min((percentage / 100) * baseRadius, baseRadius));
            }

            if (typeof radius === 'number') return Math.max(0, Math.min(radius, baseRadius));

            const numericRadius = parseFloat(String(radius));
            if (isNaN(numericRadius)) throw new Error(`Invalid radius value: ${radius}`);

            return Math.max(0, Math.min(numericRadius, baseRadius));
        }) as [number, number, number, number];
    }

    private createRoundedRectangle(halfWidth: number, halfHeight: number, topRight: number, topLeft: number, bottomLeft: number, bottomRight: number): Shape {
        const shape = new Shape();

        shape.moveTo(-halfWidth + topLeft, -halfHeight);
        shape.lineTo(halfWidth - bottomRight, -halfHeight);
        shape.absarc(halfWidth - bottomRight, -halfHeight + bottomRight, bottomRight, -Math.PI / 2, 0, false);
        shape.lineTo(halfWidth, halfHeight - topRight);
        shape.absarc(halfWidth - topRight, halfHeight - topRight, topRight, 0, Math.PI / 2, false);
        shape.lineTo(-halfWidth + topLeft, halfHeight);
        shape.absarc(-halfWidth + topLeft, halfHeight - topLeft, topLeft, Math.PI / 2, Math.PI, false);
        shape.lineTo(-halfWidth, -halfHeight + bottomLeft);
        shape.absarc(-halfWidth + bottomLeft, -halfHeight + bottomLeft, bottomLeft, Math.PI, 3 * Math.PI / 2, false);
        shape.closePath();

        return shape;
    }

    private calculateUVCoordinates(positionAttribute: Float32BufferAttribute, halfWidth: number, halfHeight: number, width: number, height: number): number[] {
        const positions = positionAttribute.array as Float32Array;
        const vertexCount = positionAttribute.count;
        const uvs: number[] = [];

        for (let i = 0; i < vertexCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            uvs.push((x + halfWidth) / width, (y + halfHeight) / height);
        }

        return uvs;
    }
}
