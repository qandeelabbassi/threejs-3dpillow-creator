import * as THREE from 'three';
import * as createjs from 'createjs-module'
import * as Masonry from 'masonry-layout'
import * as imagesLoaded from 'imagesloaded'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import objectModelPath from './assets/models/pillow/Models/Pillow_highpoly.obj'
import objectMtlPath from './assets/models/pillow/Models/Pillow_highpoly.mtl'
import objectTexturePath from './assets/models/pillow/material/linen_large.jpg'

let frontImagePath = null
let backImagePath = null
let isMouseDown = false;
let objectModel = null;

function importAll(r) {
    return r.keys().map(r);
}

/**
 * Load an image from a given URL
 * @param {String} url The URL of the image resource
 * @returns {Promise<Image>} The loaded image
 */
function loadImage(url) {
    return new Promise(resolve => {
        const image = new Image();
        image.addEventListener('load', () => {
            resolve(image);
        });
        image.src = url;
    });
}

function canvasImagePositioner(canwidth, canheight, imgWidth, imgHeight) {
    const wrh = imgWidth / imgHeight;
    let newWidth = imgWidth;
    let newHeight = imgHeight;
    if (imgWidth > canwidth || imgHeight > canheight) {
        newWidth = canwidth;
        newHeight = newWidth / wrh;
        if (newHeight > canheight) {
            newHeight = canheight;
            newWidth = newHeight * wrh;
        }
    }
    const x = canwidth / 2 - newWidth / 2;
    const y = canheight / 2 - newHeight / 2;
    return {x: x, y: y, width: newWidth, height: newHeight};
}

async function updateTextureImages(model, frontImage, backImage) {
    if (model == null)
        return

    const stage = new createjs.Stage("texture-canvas");

    const baseImage = await loadImage(objectTexturePath);
    const baseTexture = new createjs.Bitmap(baseImage);
    baseTexture.scaleX = stage.canvas.width / baseImage.width;
    baseTexture.scaleY = stage.canvas.height / baseImage.height;
    stage.addChild(baseTexture);

    if (frontImage != null) {
        frontImage = await loadImage(frontImage);
        const frontTexture = new createjs.Bitmap(frontImage);
        const frontBounds = canvasImagePositioner(stage.canvas.width / 2, stage.canvas.height, frontImage.width, frontImage.height)
        frontTexture.scaleX = (frontBounds.width) / frontImage.width;
        frontTexture.scaleY = (frontBounds.height) / frontImage.height;
        frontTexture.x = (stage.canvas.width / 2) + frontBounds.x;
        frontTexture.y = frontBounds.y + 10;
        stage.addChild(frontTexture);
    }

    if (backImage != null) {
        backImage = await loadImage(backImage);
        const backTexture = new createjs.Bitmap(backImage);
        const backBounds = canvasImagePositioner(stage.canvas.width / 2, stage.canvas.height, backImage.width, backImage.height)
        backTexture.scaleX = (backBounds.width) / backImage.width;
        backTexture.scaleY = (backBounds.height) / backImage.height;
        backTexture.x = backBounds.x;
        backTexture.y = backBounds.y + 10;
        stage.addChild(backTexture);
    }
    stage.update();

    // update model texture
    const texture = new THREE.TextureLoader().load(stage.canvas.toDataURL("image/png"));
    model.traverse(function (child) {   // aka setTexture
        if (child instanceof THREE.Mesh) {
            child.material.map = texture;
        }
    });
}

async function chooseCoverImage() {
    return new Promise(resolve => {
        const modal = document.getElementById("gallery-modal");
        const closeBtn = document.getElementById('span-modal-close');
        const grid = document.getElementById("texture-grid")
        const imagePaths = importAll(require.context('./assets/images', false, /\.(png|jpe?g)$/));
        let masonry = null;
        const destroy = () => {
            modal.style.display = "none";
            const items = document.getElementsByClassName("grid-item");
            while (items.length > 0) {
                items[0].parentNode.removeChild(items[0]);
            }
            masonry.destroy()
        }

        for (let i = 0; i < imagePaths.length; i++) {
            const img = new Image();
            img.src = imagePaths[i]
            const newDiv = document.createElement("div");
            newDiv.className = 'grid-item'
            newDiv.appendChild(img)
            newDiv.onclick = function () {
                destroy();
                resolve(img.src)
            }
            grid.appendChild(newDiv);
        }

        modal.style.display = "block";
        masonry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            percentPosition: true
        });
        imagesLoaded(grid, function () {
            masonry.layout()
        });
        closeBtn.onclick = () => destroy()
    });
}

function onMouseDown() {
    isMouseDown = true;
}

function onMouseUp() {
    isMouseDown = false;
}

function main() {
    const canvas = document.querySelector('#model-canvas');
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
    renderer.setClearColor(0x000000, 0); // the default

    const fov = 45;
    const aspect = 1;  // the canvas default
    const near = 0.1;
    const far = 100000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 1);

    const controls = new OrbitControls(camera, canvas);
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 0.7;
    controls.maxDistance = 1;
    controls.target.set(0, 0, 0);
    controls.update();

    const scene = new THREE.Scene();
    // scene.add(new THREE.AxesHelper(1))
    // scene.background = new THREE.Color('black');

    {
        // global light
        const skyColor = 0xffffff;
        const groundColor = 0xaaaaaa;  // brownish orange
        const intensity = 1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    {
        // front light
        const color = 0xF3F3F3;
        const intensity = 0.9;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 1);
        light.target.position.set(0, -0.2, 0);
        scene.add(light);
        scene.add(light.target);
    }

    {
        // back light
        const color = 0xF3F3F3;
        const intensity = 0.9;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, -1);
        light.target.position.set(0, -0.2, 0);
        scene.add(light);
        scene.add(light.target);
    }

    {
        // load model
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.load(objectMtlPath, (materials) => {
            materials.preload()
            objLoader.setMaterials(materials)
            objLoader.load(objectModelPath, (object) => {
                const texture = new THREE.TextureLoader().load(objectTexturePath);
                object.traverse(function (child) {   // aka setTexture
                    if (child instanceof THREE.Mesh) {
                        child.material.map = texture;
                    }
                });
                object.position.set(0, -0.2, 0);
                scene.add(object)
                objectModel = object;
            }, (xhr) => {
                console.log(xhr)
            }, (error) => console.log(error))
        })
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            const textureCanvas = document.getElementById("texture-canvas");
            textureCanvas.width = width;
            textureCanvas.height = height;
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        if (objectModel && !isMouseDown) {
            objectModel.rotation.y -= 0.005;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.getElementById('choose-front-images').onclick = () => {
        chooseCoverImage().then(src => {
            frontImagePath = src
            updateTextureImages(objectModel, frontImagePath, backImagePath)
        })
    }

    document.getElementById('choose-back-images').onclick = () => {
        chooseCoverImage().then(src => {
            backImagePath = src
            updateTextureImages(objectModel, frontImagePath, backImagePath)
        })
    }
}

main();
