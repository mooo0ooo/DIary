let points = [];
let stars = [];
let visualStartTime = 0;

function prepareVisual() {
  points = [];

  if (cons === null) {
    // PAD選択ルート
    for (let v of padValues) {
      let emo = findClosestEmotion(v.P, v.A, v.D);
      let x = map(v.P, 0, 1, -100, 100);
      let y = map(v.A, 0, 1, -100, 100);
      let z = map(v.D, 0, 1, -100, 100);

      points.push({
        pos: createVector(x, y, z),
        emo: emo
      });
     }
   } else {
    // galleryページルート
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
    let tw = noise(s.twinkle + frameCount*0.01);
    let flicker = map(tw, 0, 1, 0.3, 1.2);
    let alpha = map(flicker, 0.3, 1.2, 70, 240);
    fill(255, alpha);
    push();
    translate(s.x, s.y, s.z);
    sphere(2);
    pop();
  }
  pop();

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

  if (allConstellations && allConstellations.length > 0) {
    let latest = allConstellations[allConstellations.length - 1];
    if (latest && latest.stars) {
      push();
      translate(0, 0, 200);
      scale(1.2);
      stroke(150,80); noFill();
      box(260);
      // 星
      for (let s of latest.stars) {
        let px = s.pos?.x ?? 0;
        let py = s.pos?.y ?? 0;
        let pz = s.pos?.z ?? 0;
        push();
        translate(px, py, pz);
        noStroke();
        fill(255, 255, 200, 240);
        sphere(8);
        pop();
      }

      if (millis() - visualStartTime > 1200) {
        push();
        stroke(180,200,255,90); strokeWeight(2); blendMode(ADD);
        for (let a = 0; a < latest.stars.length; a++) {
          for (let b = a+1; b < latest.stars.length; b++) {
            let aPos = latest.stars[a].pos;
            let bPos = latest.stars[b].pos;
            if (aPos && bPos) {
              line(aPos.x, aPos.y, aPos.z, bPos.x, bPos.y, bPos.z);
            }
          }
        }
        pop();
      }
      pop();
    }
  }
}
