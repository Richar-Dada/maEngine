import ThreeApplication from './ThreeApplication'

export interface MaConfigType {
    control: boolean
}

const baseConfig: MaConfigType = {
    control: true
}

export default class MAEngine extends ThreeApplication {
    constructor(canvas: HTMLCanvasElement, config: MaConfigType = baseConfig) {
        super(canvas, config)
    }

    
}