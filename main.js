import * as THREE from 'three';
import { orbOutput } from '/OrbHandler.js'
import { buttonOutput } from '/OrbHandler.js'
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x808080);

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);

directionalLight.position.set(8, 16, 1);
scene.add(directionalLight.target);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
var size = Math.min(window.innerWidth, window.innerHeight) * 0.75;
renderer.setSize(size, size);
var viewport = document.getElementById("rendererViewport");
viewport.appendChild(renderer.domElement);


const cubeGroup = new THREE.Group();
const cubeMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

const cubeGeo = new THREE.BoxGeometry(10, 10, 10);
const cube = new THREE.Mesh(cubeGeo, cubeMat);

// const cubeGeo2 = new THREE.BoxGeometry(4, 20, 4);
// const cube2 = new THREE.Mesh(cubeGeo2, cubeMat);

// cube2.position.set(0, 15, 0);

cubeGroup.add(cube);
// cubeGroup.add(cube2);

scene.add(cubeGroup);

const boundingBoxGeo = new THREE.BoxGeometry(100, 100, 100);
const boundingEdges = new THREE.EdgesGeometry(boundingBoxGeo);
const line = new THREE.LineSegments(boundingEdges, new THREE.LineBasicMaterial({ color: 0xffffff }));
scene.add(line);

const sphereGeo = new THREE.SphereGeometry(1);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff00ff });
const dotXA = new THREE.Mesh(sphereGeo, sphereMat);
const dotXB = new THREE.Mesh(sphereGeo, sphereMat);
const dotXgroup = new THREE.Group();
dotXA.position.set(-50, 0, 0);
dotXB.position.set(50, 0, 0);
dotXgroup.add(dotXA);
dotXgroup.add(dotXB);

const dotYA = new THREE.Mesh(sphereGeo, sphereMat);
const dotYB = new THREE.Mesh(sphereGeo, sphereMat);
const dotYgroup = new THREE.Group();
dotYA.position.set(0, -50, 0);
dotYB.position.set(0, 50, 0);
dotYgroup.add(dotYA);
dotYgroup.add(dotYB);

const dotZA = new THREE.Mesh(sphereGeo, sphereMat);
const dotZB = new THREE.Mesh(sphereGeo, sphereMat);
const dotZgroup = new THREE.Group();
dotZA.position.set(0, 0, -50);
dotZB.position.set(0, 0, 50);
dotZgroup.add(dotZA);
dotZgroup.add(dotZB);

scene.add(dotXgroup);
scene.add(dotYgroup);
scene.add(dotZgroup);

camera.position.z = 150;
// camera.position.y = 25;
// camera.rotation.x = -3.14159 / 12;

function setCubeVals(x, y, z, rx, ry, rz) {
	dotXgroup.position.set(0, y, z);
	dotYgroup.position.set(x, 0, z);
	dotZgroup.position.set(x, y, 0);

	cubeGroup.position.set(x, y, z);
	cubeGroup.rotation.set(-rx, -ry, -rz);
}

function addCubeVals(x, y, z, rx, ry, rz) {
	dotXgroup.position.set(0, cubeGroup.position.y, cubeGroup.position.z);
	dotYgroup.position.set(cubeGroup.position.x, 0, cubeGroup.position.z);
	dotZgroup.position.set(cubeGroup.position.x, cubeGroup.position.y, 0);

	var pos = new THREE.Vector3(x, y, z).add(cubeGroup.position);
	// var rot = new THREE.Vector3(-rx  / 50, -ry  / 50, -rz  / 50).add(cubeGroup.rotation);
	pos.clamp(new THREE.Vector3(-50, -50, -50), new THREE.Vector3(50, 50, 50));
	cubeGroup.position.set(pos.x, pos.y, pos.z);
	// cubeGroup.rotation.set(rot.x, rot.y, rot.z);
	cubeGroup.rotation.set(-rx, -ry, -rz);
}


var state = 0;
function animate() {
	if( buttonOutput > 0 ){
		state = 1 - state;
	}
	if(state){
		addCubeVals(orbOutput.x, orbOutput.y, orbOutput.z, orbOutput.rx, orbOutput.ry, orbOutput.rz);
	} else {
		setCubeVals(orbOutput.x * 50, orbOutput.y * 50, orbOutput.z * 50, orbOutput.rx, orbOutput.ry, orbOutput.rz);
	}

	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);