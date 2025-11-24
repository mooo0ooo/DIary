let camPanX = 0, camPanY = 0;
let camRotX = 0, camRotY = 0;
let rotVelX = 0, rotVelY = 0;
let camDistance = 600;
let lastX = null, lastY = null;

function updateCameraHandling(isVisual) {
}

function computeCameraPosition() {
  let camX = sin(camRotY) * cos(camRotX) * camDistance;
  let camY = sin(camRotX) * camDistance;
  let camZ = cos(camRotY) * cos(camRotX) * camDistance;
  return { x: camX + camPanX, y: camY + camPanY, z: camZ };
}
