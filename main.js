import * as THREE from 'three';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const positionLabel = document.querySelector('#position');
const rotationLabel = document.querySelector('#rotation');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d18);
scene.fog = new THREE.Fog(0x080d18, 35, 150);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.prepend(renderer.domElement);

// Ambient lighting and a simple reference object make depth easier to judge.
scene.add(new THREE.HemisphereLight(0xb9dcff, 0x172033, 1.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(8, 14, 6);
scene.add(keyLight);

// Ground grid lies on the XZ plane; Y is the vertical axis.
const grid = new THREE.GridHelper(200, 100, 0x3b8ba8, 0x26394e);
grid.position.y = 0;
scene.add(grid);

const axes = new THREE.AxesHelper(3.5);
axes.position.set(0, 0.025, 0);
scene.add(axes);

const originGeometry = new THREE.BoxGeometry(1, 1, 1);
const originMaterial = new THREE.MeshStandardMaterial({
  color: 0x54d9f4,
  metalness: 0.35,
  roughness: 0.35,
  wireframe: true
});
const originCube = new THREE.Mesh(originGeometry, originMaterial);
originCube.position.set(0, 0.5, 0);
scene.add(originCube);

// Yaw rotates around world-up. Pitch is clamped to avoid camera flipping.
let yaw = 0;
let pitch = -0.12;
const keys = new Set();
const MOVE_SPEED = 6;
const LOOK_SPEED = 1.65;
const PITCH_LIMIT = Math.PI / 2 - 0.025;

const keyMap = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  KeyZ: 'z', KeyX: 'x',
  ArrowUp: 'up', ArrowDown: 'down',
  ArrowLeft: 'left', ArrowRight: 'right'
};
const controlledCodes = new Set(Object.keys(keyMap));

window.addEventListener('keydown', (event) => {
  if (!controlledCodes.has(event.code)) return;
  event.preventDefault();
  keys.add(keyMap[event.code]);
});

window.addEventListener('keyup', (event) => {
  if (controlledCodes.has(event.code)) {
    keys.delete(keyMap[event.code]);
  }
});

// Prevent a stuck key if the browser window loses focus while a key is held.
window.addEventListener('blur', () => keys.clear());

const direction = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const clock = new THREE.Clock();

function updateCamera(delta) {
  if (keys.has('left')) yaw += LOOK_SPEED * delta;
  if (keys.has('right')) yaw -= LOOK_SPEED * delta;
  if (keys.has('up')) pitch += LOOK_SPEED * delta;
  if (keys.has('down')) pitch -= LOOK_SPEED * delta;
  pitch = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);

  // WASD moves parallel to the ground, independent of camera pitch.
  const forwardX = Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  right.set(Math.cos(yaw), 0, Math.sin(yaw));
  movement.set(0, 0, 0);

  if (keys.has('w')) movement.add(new THREE.Vector3(forwardX, 0, forwardZ));
  if (keys.has('s')) movement.add(new THREE.Vector3(-forwardX, 0, -forwardZ));
  if (keys.has('d')) movement.add(right);
  if (keys.has('a')) movement.sub(right);

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(MOVE_SPEED * delta);
    camera.position.add(movement);
  }

  if (keys.has('z')) camera.position.y += MOVE_SPEED * delta;
  if (keys.has('x')) camera.position.y -= MOVE_SPEED * delta;

  direction.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
  camera.lookAt(camera.position.clone().add(direction));

  positionLabel.textContent =
    `X ${camera.position.x.toFixed(2)} / Y ${camera.position.y.toFixed(2)} / Z ${camera.position.z.toFixed(2)}`;
  rotationLabel.textContent =
    `YAW ${THREE.MathUtils.radToDeg(yaw).toFixed(1)}° / PITCH ${THREE.MathUtils.radToDeg(pitch).toFixed(1)}°`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updateCamera(delta);
  renderer.render(scene, camera);
}
animate();

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);

requestAnimationFrame(() => loading.classList.add('hidden'));
