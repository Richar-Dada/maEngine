import * as THREE from 'three'
import CameraControls from 'camera-controls'

CameraControls.install( { THREE: THREE } )

export default class CameraController extends CameraControls {

    constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, renderer: THREE.WebGLRenderer){
        super(camera, renderer.domElement)
    }

    
}