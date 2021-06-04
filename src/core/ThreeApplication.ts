import * as THREE from 'three'
import { OrbitControls } from 'three-orbitcontrols-ts'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper'

import { Application } from './Application'
import { MaConfigType } from './MAEngine'
import Clip from '../lib/Clip'
import { Object3D } from 'three'

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
    currentObj: Object3D| null = null

    constructor(canvas: HTMLCanvasElement, config: MaConfigType) {
        super(canvas)
        this.config = config

        this.initThree()

        if (config.control) {
            this.stupControl()
        }
    }


    private initThree(): void {
        
        this.camera = new THREE.PerspectiveCamera( 45, this.canvas.width / this.canvas.height, 0.25, 20);
        this.camera.position.set( - 1.8, 0.6, 3.7  )

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

    public stupControl(): void {
        if (!this.camera) {
            throw new Error('camera is null')
        }

        this.control = new OrbitControls(this.camera, this.renderer?.domElement)
        this.control.enableZoom = true
    }

    public loadFbx(url: string): void {
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

        } )
    }

    public loadGltf(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const that = this
            const roughnessMipmapper = new RoughnessMipmapper( this.renderer )
            const loader = new GLTFLoader().setPath( 'public/gltf/' );
            loader.load( url, function ( gltf ) {
                that.currentObj = gltf.scene

                gltf.scene.traverse( function ( child ) {

                    if ( child.isMesh ) {

                        // TOFIX RoughnessMipmapper seems to be broken with WebGL 2.0
                        // roughnessMipmapper.generateMipmaps( child.material );
                        const geometry = child.geometry
                        console.log(geometry.boundingBox)

                        geometry.computeVertexNormals();
                        geometry.center();
                        const material = new THREE.MeshPhongMaterial({color: 0xffff00, shading: THREE.SmoothShading});
                        const mesh = new THREE.Mesh(geometry, material);
                        var scale = 1.5
                        mesh.scale.multiplyScalar(scale);
                        mesh.position.set(0, 0, 0);
                        that.scene?.add(mesh)
                        resolve()

                    }


                } );

                that.scene?.add( gltf.scene );

                roughnessMipmapper.dispose();


            } );
        })
    }

    public openClip(): void {
        console.log('openClip')
        if (!this.currentObj || !this.scene || !this.renderer || !this.camera || !this.control) return

        const clip = new Clip(this.currentObj, this.scene, this.renderer, this.camera, this.control)
        clip.open()
    }

    public render(): void {
        if (this.scene && this.camera) {
            const delta = this.clock?.getDelta();

			if ( this.mixer ) this.mixer.update( delta! )
            this.renderer?.render( this.scene, this.camera )
        }
    }    
}