let points = [];
let stars = [];
let visualStartTime = 0;

function prepareVisual() {
  points = [];
  stars = [];

  // ---- PADページから来た場合 ----
  if (cons === null) {
    for (let v of padValues) {

      let x = map(v.p, 0, 6, -100, 100);
      let y = map(v.a, 0, 6, -100, 100);
      let z = map(v.d, 0, 6, -100, 100);

      let emo = findClosestEmotion(v.p / 6, v.a / 6, v.d / 6);

      points.push({
        pos: createVector(x, y, z),
        emo: emo
      });
    }
  }

  // ---- ギャラリーから来た場合 ----
  else {
    for (let s of cons.stars) {
      points.push({
        pos: createVector(s.pos.x, s.pos.y, s.pos.z),
        emo: s.emo
      });
    }
  }

  // 共通
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: random(-2000, 2000),
      y: random(-2000, 2000),
      z: random(-2000, 2000),
      twinkle: random(1000)
    });
  }

  visualStartTime = millis();
}

function drawVisualMode() {
  // 背景星
  push();
  noStroke();
  for (let s of stars) {
    let tw = noise(s.twinkle + frameCount * 0.01);
    let flicker = map(tw, 0, 1, 0.3, 1.2);
    let alpha = map(flicker, 0.3, 1.2, 70, 240);

    fill(255, alpha);
    push();
    translate(s.x, s.y, s.z);
    sphere(2);
    pop();
  }
  pop();

  // 日記の星
   push();
  for (let p of points) {
    push();
    translate(p.pos.x, p.pos.y, p.pos.z);
    noStroke();
    fill(255, 255, 200, 220);
    sphere(6);
    pop();
  }
  pop();

  // 立方体と線
  if (points.length > 0) {

    push();
    translate(0, 0, 200);
    scale(1.2);

    // 立方体
    stroke(150, 80);
    noFill();
    box(260);

    // 点
    for (let p of points) {
      push();
      translate(p.pos.x, p.pos.y, p.pos.z);
      noStroke();
      fill(255, 255, 200, 240);
      sphere(8);
      pop();
    }

    // 1 秒後に線
    if (millis() - visualStartTime > 1200) {
      push();
      stroke(180, 200, 255, 90);
      strokeWeight(2);

      for (let a = 0; a < points.length; a++) {
        for (let b = a + 1; b < points.length; b++) {
          let A = points[a].pos;
          let B = points[b].pos;
          line(A.x, A.y, A.z, B.x, B.y, B.z);
        }
      }
      pop();
    }

    pop();
  }
}
}
