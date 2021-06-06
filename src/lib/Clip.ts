import { 
    Object3D, 
    Scene, 
    BufferGeometry, 
    Vector3, 
    Group, 
    Mesh, 
    LineSegments, 
    Plane, 
    LineBasicMaterial, 
    BufferAttribute, 
    MeshBasicMaterial,
    BackSide,
    Box3,
    WebGLRenderer,
    Raycaster,
    Vector2,
    Camera,
    PlaneGeometry,
} from 'three'

import * as THREE from 'three'
import { OrbitControls } from 'three-orbitcontrols-ts'
import ThreeApplication from '../core/ThreeApplication'

export default class Clip {
    // (1)基本数据
    private obj: Object3D;
    private app: ThreeApplication
    private scene: Scene;
    private renderer: WebGLRenderer
    private camera: Camera
    private controls: OrbitControls
    public clipBox: ClipBox;
    public isOpen: boolean = false

    // (1)基本数据
    private raycaster: Raycaster = new Raycaster(); // 光线投射
    private mouse: Vector2 = new Vector2(); // 鼠标坐标点
    private activeFace: BoxFace | null = null; // 鼠标碰触的面

    constructor(obj: Object3D, app: ThreeApplication, scene: Scene, renderer: WebGLRenderer, camera: Camera, controls: OrbitControls) {
        this.obj = obj
        this.app = app
        this.scene = scene
        this.renderer = renderer
        this.camera = camera
        this.controls = controls
        this.clipBox = new ClipBox(obj, scene, renderer)
    }

    public open(): void {
        this.isOpen = true
        this.clipBox.init()
        this.addEventListener()
    }

    public close(): void {
        this.isOpen = false
        this.clipBox.clear()
        this.removeEventListener()
    }

    public reset(): void {

    }

    public addEventListener(): void {
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('mousedown', this.onMouseDown.bind(this))
    }

    public removeEventListener(): void {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this))
        window.removeEventListener('mousedown', this.onMouseDown.bind(this))
    }

    private updateMouseAndRay(event: MouseEvent): void {
        this.mouse.setX((event.clientX / this.app.canvas.width) * 2 - 1);
        this.mouse.setY(-(event.clientY / this.app.canvas.height) * 2 + 1);
        this.raycaster.setFromCamera(this.mouse, this.camera);
    }

    private onMouseMove(event: MouseEvent): void {
        this.updateMouseAndRay(event)
        const intersects = this.raycaster.intersectObjects(this.clipBox.faces); // 鼠标与剖切盒的面的相交情况
        if (intersects.length) {
            this.renderer.domElement.style.cursor = 'pointer';
            const face = intersects[0].object as BoxFace;
            if (face !== this.activeFace) {
                if (this.activeFace) {
                    this.activeFace.setActive(false);
                }
                face.setActive(true);
                this.activeFace = face;
            }
        } else {
            if (this.activeFace) {
                this.activeFace.setActive(false);
                this.activeFace = null;
                this.renderer.domElement.style.cursor = 'auto';
            }
        }
    }

    private onMouseDown(event: MouseEvent): void {
        if (this.activeFace) {
            this.updateMouseAndRay(event);
            const intersects = this.raycaster.intersectObjects(this.clipBox.faces); // 鼠标与剖切盒的面的相交情况
            if (intersects.length) {
                const face = intersects[0].object as BoxFace;
                const axis = face.axis;
                const point = intersects[0].point;
                this.dragStart(axis, point);
            }
        }
    }

    axis = '' // 轴线
    point = new Vector3() // 起点
    ground = new Mesh(new PlaneGeometry(1000000, 1000000), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }))
        
    dragStart = (axis: string, point: Vector3) => {
        this.axis = axis;
        this.point = point;
        this.dragInitGround();
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.enableRotate = false;
        this.renderer.domElement.style.cursor = 'move';
        window.removeEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousemove', this.dragMouseMove);
        window.addEventListener('mouseup', this.dragMouseUp);
    }

    dragEnd = () => {
        console.log('end')
        this.scene.remove(this.ground);
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        window.removeEventListener('mousemove', this.dragMouseMove);
        window.removeEventListener('mouseup', this.dragMouseUp);
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    dragMouseMove = (event: MouseEvent) => {
        this.updateMouseAndRay(event);
        const intersects = this.raycaster.intersectObject(this.ground); // 鼠标与拖动地面的相交情况
        if (intersects.length) {
            this.dragUpdateClipBox(intersects[0].point);
        }
    }

    dragMouseUp = () => {
        this.dragEnd()
    }

    dragInitGround = () => {
        const normals: any = {
            'x1': new Vector3(-1, 0, 0),
            'x2': new Vector3(1, 0, 0),
            'y1': new Vector3(0, -1, 0),
            'y2': new Vector3(0, 1, 0),
            'z1': new Vector3(0, 0, -1),
            'z2': new Vector3(0, 0, 1)
        }
        if (['x1', 'x2'].includes(this.axis)) {
            this.point.setX(0);
        } else if (['y1', 'y2'].includes(this.axis)) {
            this.point.setY(0);
        } else if (['z1', 'z2'].includes(this.axis)) {
            this.point.setZ(0);
        }
        this.ground.position.copy(this.point);
        const newNormal = this.camera.position.clone().
            sub(this.camera.position.clone().projectOnVector(normals[this.axis]))
            .add(this.point); // 转换得到平面的法向量
        this.ground.lookAt(newNormal);
        this.scene.add(this.ground);
    }

    dragUpdateClipBox = (point: Vector3) => {
        // 设置剖切盒的最低点和最高点
        const minSize = 0.0002; // 剖切盒的最小大小
        switch (this.axis) {
            case 'y2': // 上
                this.clipBox.high.setY(Math.max(this.clipBox.low.y + minSize, Math.min(this.clipBox.high_init.y, point.y)));
                break;
            case 'y1': // 下
                this.clipBox.low.setY(Math.max(this.clipBox.low_init.y, Math.min(this.clipBox.high.y - minSize, point.y)));
                break;
            case 'x1': // 左
                this.clipBox.low.setX(Math.max(this.clipBox.low_init.x, Math.min(this.clipBox.high.x - minSize, point.x)));
                break;
            case 'x2': // 右
                this.clipBox.high.setX(Math.max(this.clipBox.low.x + minSize, Math.min(this.clipBox.high_init.x, point.x)));
                break;
            case 'z2': // 前
                this.clipBox.high.setZ(Math.max(this.clipBox.low.z + minSize, Math.min(this.clipBox.high_init.z, point.z)));
                break;
            case 'z1': // 后
                this.clipBox.low.setZ(Math.max(this.clipBox.low_init.z, Math.min(this.clipBox.high.z - minSize, point.z)));
                break;
        }

        // 更新剖切盒的剖切平面、顶点、面和边线\
        this.clipBox.clearFaces()
        this.clipBox.clearLines()


        this.clipBox.initVertices()
        this.clipBox.initFaces()
        this.clipBox.initLines()
        this.clipBox.initPlanes()

        // 更新覆盖盒
        this.updateCapBoxList();
    }

    private capBoxList: Array<any> = []
    private uniforms = {
        low: { value: new Vector3() },
        high: { value: new Vector3() }
    }

    /**(3)更新覆盖盒的大小和中心位置 */
    private updateCapBoxList() {
        this.uniforms.low.value.copy(this.clipBox.low);
        this.uniforms.high.value.copy(this.clipBox.high);
        this.capBoxList.forEach(item => {
            const size = new Vector3();
            size.subVectors(this.clipBox.high, this.clipBox.low); // 大小
            const position = this.clipBox.low.clone().add(size.clone().multiplyScalar(0.5)); // 中心位置
            item.capBox.scale.copy(size);
            item.capBox.position.copy(position);
        })
    }

    stencilTest() {
        this.renderer.clear(); // 清除模板缓存
        const gl = this.renderer.getContext();
        gl.enable(gl.STENCIL_TEST);
        this.capBoxList.forEach((item, index) => {

            // 初始化模板缓冲值，每层不一样
            gl.stencilFunc(gl.ALWAYS, index, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
            this.renderer.render(item.backScene, this.camera);

            // 背面加1
            gl.stencilFunc(gl.ALWAYS, 1, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
            this.renderer.render(item.backScene, this.camera);

            // 正面减1
            gl.stencilFunc(gl.ALWAYS, 1, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
            this.renderer.render(item.frontScene, this.camera);

            // 缓冲区为指定值，才显示覆盖盒
            gl.stencilFunc(gl.LEQUAL, index + 1, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
            this.renderer.render(item.capBoxScene, this.camera);
        })

        gl.disable(gl.STENCIL_TEST);
    }
}

class ClipBox {
    public low: Vector3 = new Vector3(); // 最低点
    public high: Vector3 = new Vector3(); // 最高点
    public low_init: Vector3 = new Vector3();
    public high_init: Vector3 = new Vector3();
    public group: Group = new Group();; // 记录开启剖切后添加的所有对象
    public planes: Array<Plane> = []; // 剖切平面
    private vertices: number[] = []
    public faces: Array<BoxFace> = []
    public lines: Array<BoxLine> = []

    public planeObjects = []

    private obj: Object3D;
    private scene: Scene;
    private renderer: WebGLRenderer


    constructor(obj: Object3D, scene: Scene, renderer: WebGLRenderer) {
        this.obj = obj
        this.scene = scene
        this.renderer = renderer
    }

    public init(): void {
        
        const box3 = new Box3();
        box3.setFromObject(this.obj); // 获取模型对象的边界
        this.low = box3.min;
        this.high = box3.max;
        this.low_init.copy(this.low); // 保留一下初始值，好作为限制条件
        this.high_init.copy(this.high);
        this.scene.add(this.obj)
        this.group = new Group()
        this.initPlanes();
        this.initVertices();
        this.initFaces();
        this.initLines();
        this.scene.add(this.group)

        console.log('low', this.low, 'high', this.high)
        
    }

    public clear(): void {
        this.scene.remove(this.group);
        this.obj.traverse((child: any) => {
            if (child.type == 'Mesh') {
                child.material.clippingPlanes = [];
            }
        });
        this.renderer.domElement.style.cursor = '';
    }

    public initPlanes(): void {
        this.planes = [];
        this.planes.push(
            new Plane(new Vector3(0, -1, 0), this.high.y), // 上
            new Plane(new Vector3(0, 1, 0), -this.low.y), // 下
            new Plane(new Vector3(1, 0, 0), -this.low.x), // 左
            new Plane(new Vector3(-1, 0, 0), this.high.x), // 右
            new Plane(new Vector3(0, 0, -1), this.high.z), // 前
            new Plane(new Vector3(0, 0, 1), -this.low.z), // 后
        );
        // this.obj.traverse((child: any) => {
        //     if (['Mesh', 'LineSegments'].includes(child.type)) {
        //         child.material.clippingPlanes = this.planes;
        //     }
        // })
         this.obj.material.clippingPlanes = this.planes
    }

    public initVertices(): void {
        this.vertices = [
            this.low.x, this.high.y, this.low.z,         // 0
            this.high.x, this.high.y, this.low.z,        // 1
            this.high.x, this.high.y, this.high.z,       // 2
            this.low.x, this.high.y, this.high.z,        // 3
            this.low.x, this.low.y, this.low.z,          // 4
            this.high.x, this.low.y, this.low.z,         // 5
            this.high.x, this.low.y, this.high.z,        // 6
            this.low.x, this.low.y, this.high.z          // 7
        ]
    }

    public initFaces(): void {
        const y2: number[] = [
            this.low.x, this.high.y, this.low.z,
            this.high.x, this.high.y, this.low.z,
            this.high.x, this.high.y, this.high.z,
            this.low.x, this.high.y, this.high.z,
        ]
        const y1: number[] = [
            this.low.x, this.low.y, this.low.z,
            this.low.x, this.low.y, this.high.z,
            this.high.x, this.low.y, this.high.z,
            this.high.x, this.low.y, this.low.z
        ]

        const x1: number[] = [
            this.low.x, this.high.y, this.low.z,
            this.low.x, this.high.y, this.high.z,
            this.low.x, this.low.y, this.high.z,
            this.low.x, this.low.y, this.low.z
        ]

        const x2: number[] = [
            this.high.x, this.high.y, this.low.z,
            this.high.x, this.low.y, this.low.z,    
            this.high.x, this.low.y, this.high.z,
            this.high.x, this.high.y, this.high.z,
        ]

        const z2: number[] = [
            this.high.x, this.high.y, this.high.z,
            this.high.x, this.low.y, this.high.z,       
            this.low.x, this.low.y, this.high.z,
            this.low.x, this.high.y, this.high.z
        ]

        const z1: number[] = [
            this.low.x, this.high.y, this.low.z,
            this.low.x, this.low.y, this.low.z,        
            this.high.x, this.low.y, this.low.z,
            this.high.x, this.high.y, this.low.z,
        ]
        this.faces = [];
        this.faces.push(
            new BoxFace('y2', y2), // 上 y2
            new BoxFace('y1', y1), // 下 y1
            new BoxFace('x1', x1), // 左 x1
            new BoxFace('x2', x2), // 右 x2
            new BoxFace('z2', z2), // 前 z2
            new BoxFace('z1', z1), // 后 z1
        )
        this.group.add(...this.faces);
        this.faces.forEach(face => {
            this.group.add(face.backFace);
        });
    }

    public clearPlanes(): void {
        this.planes = []
    }

    public clearFaces(): void {
        this.faces.forEach((face) => {
            this.group.remove(face.backFace)
            this.group.remove(face)
            face.clear()
        })
    }

    public clearLines(): void {
        this.lines.forEach((line) => {
            this.group.remove(line)
            line.clear()
        })
    }

    public initLines(): void {
        const v = this.vertices;
        const f = this.faces;
        this.lines = [];
        this.lines.push(
            new BoxLine([v[0], v[1], v[2], v[3], v[4], v[5]], [f[0], f[5]]),
            new BoxLine([v[3], v[4], v[5], v[6], v[7], v[8]], [f[0], f[3]]),
            new BoxLine([v[6], v[7], v[8], v[9], v[10], v[11]], [f[0], f[4]]),
            new BoxLine([v[9], v[10], v[11], v[0], v[1], v[2]], [f[0], f[2]]),
            new BoxLine([v[12], v[13], v[14], v[15], v[16], v[17]], [f[1], f[5]]),
            new BoxLine([v[15], v[16], v[17], v[18], v[19], v[20]], [f[1], f[3]]),
            new BoxLine([v[18], v[19], v[20], v[21], v[22], v[23]], [f[1], f[4]]),
            new BoxLine([v[21], v[22], v[23], v[12], v[13], v[14]], [f[1], f[2]]),
            new BoxLine([v[0], v[1], v[2], v[12], v[13], v[14]], [f[2], f[5]]),
            new BoxLine([v[3], v[4], v[5], v[15], v[16], v[17]], [f[3], f[5]]),
            new BoxLine([v[6], v[7], v[8], v[18], v[19], v[20]], [f[3], f[4]]),
            new BoxLine([v[18], v[19], v[20], v[21], v[22], v[23]], [f[2], f[4]])
        );
        this.group.add(...this.lines);
    }

    public createObj(mesh: Mesh) {
        const planeGeom = new THREE.PlaneBufferGeometry(100, 100);
        this.scene.add(mesh)
    }

}

/**类：用于构造剖切盒的边线 */
class BoxLine extends LineSegments {

    // (1)基本数据
    private normalMaterial = new LineBasicMaterial({ color: 0xe1f2fb }); // 边线的常态
    private activeMaterial = new LineBasicMaterial({ color: 0x00ffff }); // 边线的活跃态

    /**
     * (2)构造函数
     * @param vertices 边线的 2 个点
     * @param faces 边线涉及的 2 个面
     */
    constructor(vertices: Array<number>, faces: Array<BoxFace>) {
        super();
        faces.forEach(face => { face.lines.push(this) }); // 保存面和边线的关系
        this.geometry = new BufferGeometry()
        this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
        this.material = this.normalMaterial;
    }

    /**
     * (3)活跃边线
     * @param isActive 是否活跃
     */
    setActive(isActive: boolean) {
        this.material = isActive ? this.activeMaterial : this.normalMaterial;
    }
}


/**类：用于构造剖切盒的面 */
class BoxFace extends Mesh {

    // (1)基本数据
    axis: string;
    lines: Array<BoxLine> = []; // 面涉及的 4 条边线
    backFace: Mesh; // 面的背面，用来展示

    /**
     * (2)构造函数
     * @param axis 面的轴线
     * @param vertices 面的 4 个点
     */
    constructor(axis: string, vertices: Array<number>) {
        super();
        this.axis = axis;
        this.lines = [];
        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
        this.geometry.setIndex( [0, 3, 2, 0, 2, 1] )
        this.material = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
        const backMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: BackSide });
        this.backFace = new Mesh(this.geometry, backMaterial);
    }

    /**
     * (3)活跃面，即活跃相关边线
     * @param isActive 是否活跃
     */
    setActive(isActive: boolean) {
        this.lines.forEach(line => { line.setActive(isActive) });
    }

}