import BasicApplication from './demo/BasicApplication'
import FbxApplication from './demo/FbxApplication'

import MAEngine from './core/MAEngine'

const canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement
// const basic: BasicApplication = new BasicApplication(canvas)
// basic.run()

// const fbx: FbxApplication = new FbxApplication(canvas)
// fbx.run()

const ma = new MAEngine(canvas)
ma.run()
// ma.loadFbx('public/fbx/Samba Dancing.fbx')
ma.loadGltf('LeePerrySmith.glb')
    .then((mesh) => {
        ma.openClip(mesh)

    })

// ma.loadFbx('public/fbx/Samba Dancing.fbx')
// .then(() => {
//     ma.openClip()

// })