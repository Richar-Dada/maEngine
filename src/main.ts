import BasicApplication from './demo/BasicApplication'
import FbxApplication from './demo/FbxApplication'

import MAEngine from './core/MAEngine'

const canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement
// const basic: BasicApplication = new BasicApplication(canvas)
// basic.run()

// const fbx: FbxApplication = new FbxApplication(canvas)
// fbx.run()

const ma = new MAEngine({ 
    containerId: 'canvas',
    controls: true 
})
ma.run()
// ma.loadFbx('public/fbx/Samba Dancing.fbx')
ma.loadGltf('LeePerrySmith.glb')
    .then((mesh) => {
        // ma.openClip(mesh)
        ma.controls?.fitToBox(mesh, true)
    })

// ma.loadFbx('public/fbx/Samba Dancing.fbx')
// .then(() => {
//     ma.openClip()

// })

window['ma'] = ma