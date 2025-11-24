function findClosestEmotion(p,a,d){
  let best = null, minDist = Infinity;
  for (let e of emotions) {
    let dx = p - e.P;
    let dy = a - e.A;
    let dz = d - e.D;
    let dist2 = sqrt(dx*dx + dy*dy + dz*dz);
    if (dist2 < minDist) { minDist = dist2; best = e; }
  }
  return best;
}

function projectPoint(pos, ax, ay) {
  let x = pos.x, y = pos.y, z = pos.z;
  let ry = y * cos(ax) - z * sin(ax);
  let rz = y * sin(ax) + z * cos(ax);
  let rx = x * cos(ay) - rz * sin(ay);
  rz = x * sin(ay) + rz * cos(ay);
  let px = rx, py = ry;
  return createVector(px, py);
}

function applyMatrixToVector(mat, v) {
  let x = v.x, y = v.y, z = v.z;
  let m = mat.mat4;
  let cx = m[0]*x + m[4]*y + m[8]*z + m[12];
  let cy = m[1]*x + m[5]*y + m[9]*z + m[13];
  let cz = m[2]*x + m[6]*y + m[10]*z + m[14];
  let cw = m[3]*x + m[7]*y + m[11]*z + m[15];
  return { x: cx, y: cy, z: cz, w: cw };
}

function screenPos(x,y,z) {
  let p = createVector(x,y,z);
  let modelView = _renderer.uMVMatrix.copy();
  let projection = _renderer.uPMatrix.copy();
  let mv = applyMatrixToVector(modelView, p);
  let clip = applyMatrixToVector(projection, mv);
  let w = clip.w || 1;
  let sx = map(clip.x / w, -1, 1, 0, width);
  let sy = map(-clip.y / w, -1, 1, 0, height);
  return createVector(sx, sy);
}

function polygon(x,y,r,n) {
  beginShape();
  for (let i = 0; i < n; i++) {
    let angle = TWO_PI * i / n;
    vertex(x + cos(angle) * r, y + sin(angle) * r);
  }
  endShape(CLOSE);
}
