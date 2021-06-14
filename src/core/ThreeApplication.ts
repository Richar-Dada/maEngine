import * as THREE from 'three'

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper'

import { Application } from './Application'
import CameraController from './controller/CameraController'
import { MaConfigType } from './MAEngine'
import Clip from '../lib/Clip'



export default class ThreeApplication extends Application {

    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null
    scene: THREE.Scene | null = null
    renderer: THREE.WebGLRenderer | null = null
    mixer: THREE.AnimationMixer | null = null
    hemiLight: THREE.HemisphereLight | null = null
    dirLight: THREE.DirectionalLight | null = null
    clock: THREE.Clock | null = null
    controls: CameraController | null = null
    config: MaConfigType| null = null
    clip: Clip | null = null

    constructor( config: MaConfigType) {
        super(config.containerId)
        this.config = config

        this.initThree()

        if (config.controls) {
            this.stupControl()
        }
    }


    private initThree(): void {
        
        this.camera = new THREE.PerspectiveCamera( 45, this.canvas.width / this.canvas.height, 0.5, 200);
        this.camera.position.set( 0, 0, 20  )

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
        this._render()
    }

    public stupControl(): void {
        if (!this.camera) {
            throw new Error('camera is null')
        }

        if (!this.renderer) {
            throw new Error('render is nul')
        }

        this.controls = new CameraController( this.camera, this.renderer )
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
                that._render()
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
                        that.scene.add(child)
                        that._render()

                    }

                } );


                roughnessMipmapper.dispose();

            } )
        })
    }

    public openClip(mesh: THREE.Mesh): void {
        if (!this.scene || !this.renderer || !this.camera || !this.controls) return

        this.renderer.localClippingEnabled = true
        this.renderer.autoClear = false
        this.clip = new Clip(mesh, this, this.scene, this.renderer, this.camera, this.controls)
        this.clip.open()
    }

    public render(): void {
        if (this.scene && this.camera) {
            const delta: number = this.clock?.getDelta() as number

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
            const hasControlsUpdated = this.controls?.update( delta )
            if (hasControlsUpdated) {
                this._render()
            }
            
        }
    }    

    private _render(): void {
        if (this.scene && this.camera) { 
            this.renderer?.render( this.scene, this.camera )
        }
    }

    public clear(): void {
        if(this.scene) {
            this.scene.clear()
            this._render()
        }
    }
}