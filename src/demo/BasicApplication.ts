import { Application, CanvasKeyBoardEvent } from '../Application'
import * as THREE from 'three'

export default class BasicApplication extends Application {

    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.Renderer
    geometry: THREE.BufferGeometry
    material: THREE.Material
    mesh: THREE.Mesh
    
    cubeAngle: number = 0
    cubeSpeed: number = 10
    constructor(canvas: HTMLCanvasElement) {
        super(canvas)
        this.initThree()
    }

    public initThree() {
        
        this.camera = new THREE.PerspectiveCamera( 70, this.canvas.width / this.canvas.height, 0.01, 10 );
        this.camera.position.z = 1;

        this.scene = new THREE.Scene();

        this.geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
        this.material = new THREE.MeshNormalMaterial();

        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.scene.add( this.mesh );

        this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, antialias: true } );
        this.renderer.setSize( this.canvas.width, this.canvas.height );
    }

    public render() {
        this.renderer.render( this.scene, this.camera )
    }

    public update(elapsedMsec: number, intervalSec: number): void {
        this.cubeAngle += this.cubeSpeed * intervalSec
        console.log('cubeAngle', this.cubeAngle)
        this.mesh.rotation.x = this.cubeAngle
        this.mesh.rotation.y = this.cubeAngle
    }

    public onKeyDown(evt: CanvasKeyBoardEvent) {
        console.log('evt', evt)
    }
}