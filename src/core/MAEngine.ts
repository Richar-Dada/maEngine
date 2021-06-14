import ThreeApplication from './ThreeApplication'

export interface MaConfigType {
    containerId: string
    controls?: boolean
}

const baseConfig: MaConfigType = {
    containerId: '',
    controls: true
}

export default class MAEngine extends ThreeApplication {
    constructor(config: MaConfigType = baseConfig) {
        super(config)
    }

    
}