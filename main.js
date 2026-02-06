import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 1.Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
// Initial position
camera.position.set(-500, 1000, 1000); 

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    preserveDrawingBuffer: true // saving image
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const loader = new GLTFLoader();

async function loadScene() {
    const response = await fetch('3d.json');
    const data = await response.json();
    const layer = data.layers["layer-1"];
    const vertices = layer.vertices;
    
    // --- CENTER THE HOUSE ---
    // Calculate the average X and Y to find the middle of the house
    let totalX = 0, totalY = 0, count = 0;
    for (let vid in vertices) {
        totalX += vertices[vid].x;
        totalY += vertices[vid].y;
        count++;
    }
    const centerX = totalX / count;
    const centerZ = totalY / count;
    
    // Make the camera and controls look at the center of the house
    controls.target.set(centerX, 0, centerZ);
    camera.position.set(centerX - 800, 1000, centerZ + 800);
    controls.update();

    // --- 2.Smaller Grid (Centered on House) ---
    const gridHelper = new THREE.GridHelper(3000, 40, 0x444444, 0x888888);
    gridHelper.position.set(centerX, 0, centerZ);
    scene.add(gridHelper);

    // --- 3. Walls ---
    for (let lineId in layer.lines) {
        const line = layer.lines[lineId];
        const vS = vertices[line.vertices[0]];
        const vE = vertices[line.vertices[1]];
        const len = Math.sqrt(Math.pow(vE.x - vS.x, 2) + Math.pow(vE.y - vS.y, 2));
        const h = line.properties.height?.length || 260;
        
        const wallGeo = new THREE.BoxGeometry(len, h, 15);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        
        wall.position.set((vS.x + vE.x) / 2, h / 2, (vS.y + vE.y) / 2);
        wall.rotation.y = -Math.atan2(vE.y - vS.y, vE.x - vS.x);
        scene.add(wall);
    }

    // --- 4. Floors ---
    for (let areaId in layer.areas) {
        const area = layer.areas[areaId];
        const shape = new THREE.Shape();
        const start = vertices[area.vertices[0]];
        shape.moveTo(start.x, start.y);
        area.vertices.slice(1).forEach(v => shape.lineTo(vertices[v].x, vertices[v].y));
        
        const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide }));
        floor.rotation.x = Math.PI / 2;
        floor.position.y = 0.2;
        scene.add(floor);
    }

    // --- 5. Furniture & Gate (Items) ---
    for (let itemId in layer.items) {
        const item = layer.items[itemId];
        const url = item.asset_urls.GLB_File_URL;
        
        // Add a visible box first so you know the position is correct
        const box = new THREE.Mesh(new THREE.BoxGeometry(50, 100, 50), new THREE.MeshStandardMaterial({color: 0xff0000}));
        box.position.set(item.x, 50, item.y);
        scene.add(box);

        if (url) {
            loader.load(url, (gltf) => {
                scene.remove(box); // Remove placeholder if model loads
                const model = gltf.scene;
                model.position.set(item.x, 0, item.y);
                model.rotation.y = -(item.rotation * Math.PI) / 180;
                scene.add(model);
            });
        }
    }

    // --- 6. Holes (Doors) ---
    for (let hId in layer.holes) {
        const hole = layer.holes[hId];
        const line = layer.lines[hole.line];
        if (line && hole.asset_urls.GLB_File_URL) {
            const vS = vertices[line.vertices[0]];
            const vE = vertices[line.vertices[1]];
            loader.load(hole.asset_urls.GLB_File_URL, (gltf) => {
                const m = gltf.scene;
                m.position.set(vS.x + (vE.x - vS.x) * hole.offset, 0, vS.y + (vE.y - vS.y) * hole.offset);
                m.rotation.y = -Math.atan2(vE.y - vS.y, vE.x - vS.x);
                scene.add(m);
            });
        }
    }

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(centerX + 500, 2000, centerZ + 500);
    scene.add(sun);
}

// --- SAVE IMAGE LOGIC ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { // PRESS SPACE TO SAVE
        renderer.render(scene, camera);
        const link = document.createElement('a');
        link.download = 'render.png';
        link.href = renderer.domElement.toDataURL();
        link.click();
        alert("Image Saved!");
    }
});

loadScene();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();