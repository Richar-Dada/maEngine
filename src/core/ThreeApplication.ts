import * as THREE from 'three'
import { OrbitControls } from 'three-orbitcontrols-ts'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper'

import { Application } from './Application'
import { MaConfigType } from './MAEngine'
import Clip from '../lib/Clip'

export default class ThreeApplication extends Application {

    camera: THREE.Camera | null = null
    scene: THREE.Scene | null = null
    renderer: THREE.WebGLRenderer | null = null
    mixer: THREE.AnimationMixer | null = null
    hemiLight: THREE.HemisphereLight | null = null
    dirLight: THREE.DirectionalLight | null = null
    clock: THREE.Clock | null = null
    control: OrbitControls | null = null
    config: MaConfigType| null = null
    clip: Clip | null = null

    constructor(canvas: HTMLCanvasElement, config: MaConfigType) {
        super(canvas)
        this.config = config

        this.initThree()

        if (config.control) {
            this.stupControl()
        }
    }


    private initThree(): void {
        
        this.camera = new THREE.PerspectiveCamera( 45, this.canvas.width / this.canvas.height, 0.5, 200);
        this.camera.position.set( - 18, 6, 3.7  )

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

        const ax = new THREE.AxesHelper(1000)
        this.scene.add(ax)
    }

    public stupControl(): void {
        if (!this.camera) {
            throw new Error('camera is null')
        }

        this.control = new OrbitControls(this.camera, this.renderer?.domElement)
        this.control.enableZoom = true
    }

    public loadFbx(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const that = this
            const loader = new FBXLoader()
            loader.load( url, ( object ) =>{
                
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
                resolve()

            } )
        })
        
    }

    public loadGltf(url: string): Promise<object> {
        return new Promise((resolve, reject) => {
            const that = this
            const roughnessMipmapper = new RoughnessMipmapper( this.renderer )

            const dracoLoader = new DRACOLoader()
            dracoLoader.setDecoderPath( 'node_modules/three/examples/js/libs/draco/gltf/' )

            const loader = new GLTFLoader().setPath( 'public/gltf/' )
            loader.setDRACOLoader( dracoLoader )
            loader.load( url, function ( gltf ) {

                gltf.scene.traverse( function ( child ) {

                    if ( child.isMesh ) {

                        resolve(child)

                    }

                } );


                roughnessMipmapper.dispose();

            } );
        })
    }

    public openClip(mesh: THREE.Mesh): void {
        if (!this.scene || !this.renderer || !this.camera || !this.control) return

        this.renderer.localClippingEnabled = true
        this.renderer.autoClear = false
        this.clip = new Clip(mesh, this, this.scene, this.renderer, this.camera, this.control)
        this.clip.open()
    }

    public render(): void {
        if (this.scene && this.camera) {
            const delta = this.clock?.getDelta();

            // const planeObjects = this.clip?.clipBox.planeObjects
            // const planes = this.clip?.clipBox.planes
            // if (planes && planeObjects && planeObjects.length > 0) {
            //     for (var i = 0; i < planeObjects.length; i++) {
        
            //         var plane = planes[i];
            //         var po = planeObjects[i];
            //         plane.coplanarPoint(po.position);
            //         po.lookAt(
            //             po.position.x - plane.normal.x,
            //             po.position.y - plane.normal.y,
            //             po.position.z - plane.normal.z,
            //         );
        
            //     }
            // }

			if ( this.mixer ) this.mixer.update( delta! )
            this.renderer?.render( this.scene, this.camera )

            
        }
    }    
}