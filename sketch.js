let state = "select";

let myFont;

let addButton, okButton, backButton, galleryButton;

let allConstellations = [];
let selectedLabel = null;

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMovedFlag = false;

let bgStars = [];
let bgStarCount = 300;

// ---- gallery 用（衝突防止リネーム）----
let galleryStars = [];
let galleryScrollY = 0;
let galleryTargetScrollY = 0;
let galleryOuterPad = 20;
let galleryGutter = 12;
let galleryTopOffset = 40;

/* =========================================================
   preload
   ========================================================= */
function preload() {
  myFont = loadFont("nicomoji-plus_v2-5.ttf");
}

/* =========================================================
   setup
   ========================================================= */
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(myFont);
  textSize(16);

  // ---- localStorage
  let saved = localStorage.getItem("myConstellations");
  if (saved) {
    try {
      allConstellations = JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage parse error. Reset.", e);
      allConstellations = [];
      localStorage.removeItem("myConstellations");
    }
  }

  // ---- ボタン作成
  addButton = createButton("追加");
  okButton = createButton("OK");
  backButton = createButton("← 記録ページ");
  galleryButton = createButton("日記一覧");

  for (let b of [addButton, okButton, backButton, galleryButton]) {
    b.style('position', 'absolute');
    b.style('z-index', '10');
    styleButton(b);
  }
  backButton.hide();

  computeBtnSize();
  positionButtons();

  // ---- ボタンイベント
  addButton.touchStarted(() => {
    state = "select";
    selectedLabel = null;
  });

  okButton.touchStarted(() => {
    if (padValues.length > 0) {
      prepareVisual();

      let now = new Date();
      let timestamp = formatDate(now);

      let serialStars = points.map(s => ({
        pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z },
        emo: s.emo
      }));

      let newConstellation = { stars: serialStars, created: timestamp };
      allConstellations.push(newConstellation);
      localStorage.setItem("myConstellations", JSON.stringify(allConstellations));

      state = "visual";
      addButton.hide();
      okButton.hide();
      backButton.show();
      visualStartTime = millis();
    }
  });

  backButton.touchStarted(() => {
    state = "select";
    addButton.show();
    okButton.show();
    backButton.hide();
    selectedLabel = null;
  });

  galleryButton.touchStarted(() => {
    state = "gallery";
    addButton.hide();
    okButton.hide();
    backButton.show();
    galleryStars = [];
  });

  addButton.mousePressed(() => addButton.touchStarted());
  okButton.mousePressed(() => okButton.touchStarted());
  backButton.mousePressed(() => backButton.touchStarted());
  galleryButton.mousePressed(() => galleryButton.touchStarted());

  // ---- 背景の星
  for (let i = 0; i < bgStarCount; i++) {
    bgStars.push({
      x: random(-width * 2, width * 2),
      y: random(-height * 2, height * 2),
      z: random(-2000, 200),
      tw: random(1000)
    });
  }
}

/* =========================================================
   windowResized
   ========================================================= */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionButtons();
}

/* =========================================================
   formatDate
   ========================================================= */
function formatDate(date) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let y = date.getFullYear();
  let m = String(date.getMonth() + 1).padStart(2, "0");
  let d = String(date.getDate()).padStart(2, "0");
  let day = days[date.getDay()];
  let hh = String(date.getHours()).padStart(2, "0");
  let mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}. ${m}. ${d} (${day}) ${hh}:${mm}`;
}

/* =========================================================
   draw
   ========================================================= */
function draw() {
  background(5,5,20);

  // visual
  if (state === "visual") {
    drawBackgroundStars();

    camRotX += rotVelX;
    camRotY += rotVelY;
    rotVelX *= 0.9;
    rotVelY *= 0.9;
    camRotX = constrain(camRotX, -1.2, 1.2);

    let camPos = computeCameraPosition();
    camera(camPos.x, camPos.y, camPos.z, camPanX, camPanY, 0, 0, 1, 0);

    drawVisualMode();

    resetMatrix();

    if (selectedLabel) {
      noLights();
      textAlign(LEFT, TOP);
      textSize(18);
      fill(255);
      text(selectedLabel, 20, 20);
    }

    if (allConstellations.length > 0) {
      let lastCreated = allConstellations[allConstellations.length - 1].created || "";
      noLights();
      textAlign(CENTER, BOTTOM);
      textSize(16);
      fill(220);
      text(lastCreated, width / 2, height - 40);
    }

    return;
  }

  // select
  if (state === "select") {
    camera();
    drawPADButtons();
    return;
  }

  // gallery
  if (state === "gallery") {
    resetMatrix();
    drawBackgroundStars();
    drawGallery2D(allConstellations, galleryButton);
    return;
  }
}

/* =========================================================
   背景の星
   ========================================================= */
function drawBackgroundStars() {
  push();
  noStroke();

  for (let s of bgStars) {
    let tw = (sin((millis() + s.tw) * 0.002) + 1) * 0.5;
    let brightness = lerp(100, 255, tw);

    fill(brightness);
    push();
    translate(s.x, s.y, s.z);
    sphere(1.5);
    pop();
  }

  pop();
}

/* =========================================================
   タッチ操作
   ========================================================= */
function touchStarted() {
  touchMovedFlag = false;
  touchStartTime = millis();
  if (touches && touches.length > 0) {
    touchStartX = touches[0].x;
    touchStartY = touches[0].y;
    lastX = touchStartX;
    lastY = touchStartY;
  }
  return false;
}

function touchMoved() {
  touchMovedFlag = true;

  // ---- gallery スワイプスクロール
  if (state === "gallery") {
    galleryTargetScrollY += movedY * 0.8;
    return false;
  }

  // ---- visual カメラ操作
  if (touches && touches.length > 0 && state === "visual") {
    let mx = touches[0].x;
    let my = touches[0].y;

    if (lastX !== null && lastY !== null) {
      let dx = mx - lastX;
      let dy = my - lastY;

      let isPan = (touches.length >= 2);
      if (isPan) {
        camPanX += dx * 0.5;
        camPanY += dy * 0.5;
      } else {
        camRotY += dx * 0.005;
        camRotX += dy * 0.005;
        rotVelX = dx * 0.002;
        rotVelY = dy * 0.002;
      }
    }

    lastX = mx;
    lastY = my;
  }

  return false;
}

function touchEnded() {
  let duration = millis() - touchStartTime;
  let moved = touchMovedFlag;
  let tapThresholdMs = 300;
  let moveThresholdPx = 8;

  let endX = (touches && touches.length > 0) ? touches[0].x : lastX;
  let endY = (touches && touches.length > 0) ? touches[0].y : lastY;

  if (!moved && duration <= tapThresholdMs) {
    let dx = (endX !== null && touchStartX !== null) ? abs(endX - touchStartX) : 0;
    let dy = (endY !== null && touchStartY !== null) ? abs(endY - touchStartY) : 0;
    if (dx <= moveThresholdPx && dy <= moveThresholdPx) {
      handleTap(touchStartX, touchStartY);
    }
  }

  lastX = null;
  lastY = null;

  return false;
}

/* =========================================================
   ギャラリー内のサムネイルタップ
   ========================================================= */
function handleTap(x, y) {
  if (x == null || y == null) return;

  // ---- visual mode: 星ラベル選択
  if (state === "visual") {
    if (allConstellations.length === 0) return;
    let last = allConstellations[allConstellations.length - 1];
    let minDist = 50;
    let nearest = null;
    for (let p of last.stars) {
      let px = p.pos?.x ?? 0;
      let py = p.pos?.y ?? 0;
      let pz = p.pos?.z ?? 0;
      let sp = screenPos(px, py, pz);
      let d = dist(x, y, sp.x, sp.y);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    if (nearest) {
      let emo = nearest.emo || {en:"", ja:""};
      selectedLabel = emo.en + "(" + (emo.ja || "") + ")";
    }
    return;
  }

  // ---- select mode: PAD
  if (state === "select") {
    let mx = (x - width/2) / padLayout.scl;
    let my = (y - height/2) / padLayout.scl;
    let cx = padLayout.cx, cy = padLayout.cy;

    // P
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy - 120;
      if (mx > bx - padLayout.btnSize/2 && mx < bx + padLayout.btnSize/2 &&
          my > by - padLayout.btnSize/2 && my < by + padLayout.btnSize/2) {
        selectedP = i;
        return;
      }
    }

    // A
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy;
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) {
        selectedA = i;
        return;
      }
    }

    // D
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy + 120;
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) {
        selectedD = i;
        return;
      }
    }
    return;
  }

  // ---- gallery: サムネイル選択
  if (state === "gallery") {
    let mx = x, my = y;

    let maxThumb = min(180, width * 0.28);
    let colCount = floor((width - galleryOuterPad * 2) / (maxThumb + galleryGutter));
    colCount = constrain(colCount, 1, 4);
    let thumbSize = floor((width - galleryOuterPad * 2 - galleryGutter * (colCount - 1)) / colCount);
    thumbSize = constrain(thumbSize, 60, maxThumb);

    let grouped = {};
    for (let i=0;i<12;i++) grouped[i] = [];
    for (let c of allConstellations) {
      let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
      if (!m) continue;
      grouped[int(m[2]) - 1].push(c);
    }

    let yOff = galleryTopOffset + galleryScrollY;

    for (let month = 0; month < 12; month++) {
      let list = grouped[month];
      if (list.length === 0) continue;

      yOff += 40;
      let index = 0;
      let rows = ceil(list.length / colCount);

      for (let cons of list) {
        let col = index % colCount;
        let row = floor(index / colCount);
        let x0 = galleryOuterPad + col * (thumbSize + galleryGutter);
        let ty = yOff + row * (thumbSize + 35);

        if (mx > x0 && mx < x0 + thumbSize && my > ty && my < ty + thumbSize) {
          selectedLabel = cons.created + "";
          state = "visual";
          addButton.show(); okButton.show(); backButton.hide();
          return;
        }
        index++;
      }
      yOff += rows * (thumbSize + 35) + 40;
    }
    return;
  }
}

/* =========================================================
   mouseWheel
   ========================================================= */
function mouseWheel(event) {
  if (state === "gallery") {
    galleryTargetScrollY -= event.delta * 0.5;
    return false;
  }
  if (state === "visual") {
    camDistance += event.delta * 0.9;
    camDistance = constrain(camDistance, 200, 2000);
  }
  return false;
}

/* =========================================================
   ボタン配置
   ========================================================= */
function positionButtons() {
  okButton.position(
    windowWidth / 2 - okButton.width / 2,
    windowHeight - okButton.height - 20
  );

  addButton.position(20, windowHeight - addButton.height - 20);
  backButton.position(20, 20);
  galleryButton.position(windowWidth - galleryButton.width - 40, 20);
}

/* =========================================================
   ギャラリー描画（scrollY衝突完全修正済版）
   ========================================================= */
function drawGallery2D(allConstellations) {

  // ---- 背景星
  if (galleryStars.length === 0) {
    for (let i = 0; i < 400; i++) {
      galleryStars.push({
        x: random(-2000, 2000),
        y: random(-2000, 2000),
        z: random(-2000, 2000),
        twinkle: random(1000),
        baseSize: random(1, 4)
      });
    }
  }

  background(5,5,20);

  // きらめき背景
  for (let s of galleryStars) {
    let tw = noise(s.twinkle + frameCount*0.01);
    let size = s.baseSize * map(tw, 0, 1, 0.3, 1.2);
    fill(255,200);
    circle(s.x * 0.08 + width/2, s.y * 0.08 + height/2, size);
  }

  // ---- スクロール反映
  galleryScrollY = lerp(galleryScrollY, galleryTargetScrollY, 0.25);
  let y = galleryTopOffset + galleryScrollY;

  // ---- カラム計算
  let maxThumb = min(180, width * 0.28);
  let colCount = floor((width - galleryOuterPad * 2) / (maxThumb + galleryGutter));
  colCount = constrain(colCount, 1, 4);

  let thumbSize = floor((width - galleryOuterPad * 2 - galleryGutter * (colCount - 1)) / colCount);
  thumbSize = constrain(thumbSize, 60, maxThumb);

  // ---- 月別分類
  let grouped = {};
  for (let i = 0; i < 12; i++) grouped[i] = [];
  for (let c of allConstellations) {
    let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) continue;
    grouped[int(m[2]) - 1].push(c);
  }

  let monthNames = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

  let contentBottom = 0;

  for (let month = 0; month < 12; month++) {
    let list = grouped[month];
    if (list.length === 0) continue;

    fill(255);
    textSize(26);
    textAlign(LEFT, TOP);
    text(monthNames[month], galleryOuterPad, y);
    y += 40;

    let index = 0;
    let rows = ceil(list.length / colCount);

    for (let cons of list) {
      let col = index % colCount;
      let row = floor(index / colCount);
      let x = galleryOuterPad + col * (thumbSize + galleryGutter);
      let ty = y + row * (thumbSize + 35);

      if (!cons.thumbnail) cons.thumbnail = generateThumbnail(cons, thumbSize);

      push();
      translate(x, ty);
      stroke(150,80); noFill();
      rect(0,0,thumbSize,thumbSize,12);
      image(cons.thumbnail, 0, 0, thumbSize, thumbSize);
      fill(240); textSize(10); textAlign(LEFT, TOP);
      text(cons.created, 0, thumbSize + 6);
      pop();

      index++;
    }

    y += rows * (thumbSize + 35) + 40;
    contentBottom = y;
  }

  // ---- スクロール範囲
  let minScroll = height - (contentBottom + 60);
  galleryTargetScrollY = constrain(galleryTargetScrollY, minScroll, 0);
  galleryScrollY       = constrain(galleryScrollY,       minScroll, 0);
}

/* =========================================================
   サムネイル生成
   ========================================================= */
function generateThumbnail(cons, size) {
  let pg = createGraphics(size, size);
  pg.pixelDensity(1);
  pg.background(5,5,20);

  let ax = radians(-30), ay = radians(30);
  let projected = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (let s of cons.stars) {
    let p = projectPoint(s.pos, ax, ay);
    projected.push(p);
    minX = min(minX, p.x);
    maxX = max(maxX, p.x);
    minY = min(minY, p.y);
    maxY = max(maxY, p.y);
  }

  if (projected.length === 0) {
    pg.noStroke(); pg.fill(255,20); pg.rect(0,0,size,size);
    return pg;
  }

  let w = max(1e-6, maxX - minX);
  let h = max(1e-6, maxY - minY);
  let margin = size * 0.12;
  let scaleFactor = (size - margin*2) / max(w,h);

  pg.push();
  pg.translate(size/2, size/2);
  pg.scale(scaleFactor);
  pg.translate(-(minX+maxX)/2, -(minY+maxY)/2);

  pg.stroke(180,200,255,90);
  pg.strokeWeight(1/scaleFactor);
  pg.noFill();

  for (let i = 0; i < projected.length; i++) {
    let dists = [];
    for (let j = 0; j < projected.length; j++) {
      if (i === j) continue;
      let dx = projected[i].x - projected[j].x;
      let dy = projected[i].y - projected[j].y;
      dists.push({idx:j, d:dx*dx+dy*dy});
    }
    dists.sort((a,b)=>a.d-b.d);
    for (let n=0;n<min(2,dists.length);n++) {
      let a = projected[i], b = projected[dists[n].idx];
      pg.line(a.x, a.y, b.x, b.y);
    }
  }

  pg.noStroke();
  pg.fill(255,240,200,230);
  for (let p of projected) pg.circle(p.x, p.y, 5/scaleFactor);

  pg.pop();
  return pg;
}
