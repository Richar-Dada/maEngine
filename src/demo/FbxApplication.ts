import { Application } from '../core/Application'
import { HttpRequest } from '../utils/HttpRequest'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import Clip from '../lib/Clip'

export default class FbxApplication extends Application {
    camera: THREE.Camera | null = null
    scene: THREE.Scene | null = null
    renderer: THREE.WebGLRenderer | null = null
    mixer: THREE.AnimationMixer | null = null
    hemiLight: THREE.HemisphereLight | null = null
    dirLight: THREE.DirectionalLight | null = null
    clock: THREE.Clock | null = null

    constructor(canvas: HTMLCanvasElement) {
        super(canvas)
        this.initThree()
    }

    public initThree(): void {
        
        this.camera = new THREE.PerspectiveCamera( 45, this.canvas.width / this.canvas.height, 1, 2000 );
        this.camera.position.set( 100, 200, 300 )

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color( 0xa0a0a0 );
		this.scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

        this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
		this.hemiLight.position.set( 0, 200, 0 );
		this.scene.add( this.hemiLight )

        this.dirLight = new THREE.DirectionalLight( 0xffffff );
        this.dirLight.position.set( 0, 200, 100 );
        this.dirLight.castShadow = true;
        this.dirLight.shadow.camera.top = 180;
        this.dirLight.shadow.camera.bottom = - 100;
        this.dirLight.shadow.camera.left = - 120;
        this.dirLight.shadow.camera.right = 120;
        this.scene.add( this.dirLight );

        this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, antialias: true } );
        this.renderer.setSize( this.canvas.width, this.canvas.height );
        this.renderer.setPixelRatio( window.devicePixelRatio )

        this.clock = new THREE.Clock()
    }

    public async run(): Promise<void> {
        // const img = await HttpRequest.loadArrayBufferAsync('public/fbx/pic1.jpg')
        console.log('run')
        const that = this
        const loader = new FBXLoader()
            loader.load( 'public/fbx/Samba Dancing.fbx', ( object ) => {

                that.mixer = new THREE.AnimationMixer( object );

                const action = that.mixer.clipAction( object.animations[ 0 ] );
                action.play();

                object.traverse( function ( child ) {

                    if ( child.isMesh ) {

                        child.castShadow = true;
                        child.receiveShadow = true;

                    }

                } )

                that.scene?.add( object );
            } );
            super.run()
    }

    public render(): void {
        if (this.scene && this.camera) {
            const delta = this.clock?.getDelta();

			if ( this.mixer ) this.mixer.update( delta! )
            this.renderer?.render( this.scene, this.camera )
        }
    }
}