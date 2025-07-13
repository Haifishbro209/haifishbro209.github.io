// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('canvas'),
  alpha: true,
  antialias: true 
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// Particle System
const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = [];

for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 100;
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  
  particleVelocities.push({
    x: (Math.random() - 0.5) * 0.02,
    y: (Math.random() - 0.5) * 0.02,
    z: (Math.random() - 0.5) * 0.02
  });
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xff6b35,
  size: 0.5,
  transparent: true,
  opacity: 0.8
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Floating Geometric Shapes
const shapes = [];
const shapeCount = 20;

for (let i = 0; i < shapeCount; i++) {
  let geometry;
  const shapeType = Math.floor(Math.random() * 4);
  
  switch(shapeType) {
    case 0:
      geometry = new THREE.TetrahedronGeometry(1);
      break;
    case 1:
      geometry = new THREE.OctahedronGeometry(1);
      break;
    case 2:
      geometry = new THREE.IcosahedronGeometry(1);
      break;
    default:
      geometry = new THREE.DodecahedronGeometry(1);
  }

  const material = new THREE.MeshBasicMaterial({
    color: Math.random() > 0.7 ? 0xff6b35 : 0x333333,
    wireframe: true,
    transparent: true,
    opacity: 0.6
  });

  const shape = new THREE.Mesh(geometry, material);
  shape.position.set(
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50
  );
  
  shape.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  shape.userData = {
    rotationSpeed: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    },
    floatSpeed: Math.random() * 0.01 + 0.005,
    originalY: shape.position.y
  };

  shapes.push(shape);
  scene.add(shape);
}

// Central Energy Sphere
const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
const sphereMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec3 vPosition;
    void main() {
      float intensity = sin(vPosition.x * 10.0 + time) * sin(vPosition.y * 10.0 + time) * sin(vPosition.z * 10.0 + time);
      vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.42, 0.21), intensity);
      gl_FragColor = vec4(color, 0.8);
    }
  `,
  uniforms: {
    time: { value: 0 }
  },
  transparent: true
});

const energySphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
energySphere.position.set(0, 0, -10);
scene.add(energySphere);

camera.position.z = 20;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Scroll-based camera movement
let scrollY = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  
  // Update energy sphere
  energySphere.material.uniforms.time.value = time;
  energySphere.rotation.x += 0.005;
  energySphere.rotation.y += 0.01;

  // Animate particles
  const positions = particleSystem.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] += particleVelocities[i].x;
    positions[i * 3 + 1] += particleVelocities[i].y;
    positions[i * 3 + 2] += particleVelocities[i].z;

    // Boundary check
    if (Math.abs(positions[i * 3]) > 50) particleVelocities[i].x *= -1;
    if (Math.abs(positions[i * 3 + 1]) > 50) particleVelocities[i].y *= -1;
    if (Math.abs(positions[i * 3 + 2]) > 50) particleVelocities[i].z *= -1;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;

  // Animate shapes
  shapes.forEach((shape, index) => {
    shape.rotation.x += shape.userData.rotationSpeed.x;
    shape.rotation.y += shape.userData.rotationSpeed.y;
    shape.rotation.z += shape.userData.rotationSpeed.z;
    
    shape.position.y = shape.userData.originalY + Math.sin(time + index) * 2;
  });

  // Camera movement based on mouse and scroll
  camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
  camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
  camera.position.z = 20 + scrollY * 0.01;

  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Smooth scrolling for CTA button
document.querySelector('.cta-button').addEventListener('click', () => {
  document.querySelector('.section').scrollIntoView({ 
    behavior: 'smooth' 
  });
});
