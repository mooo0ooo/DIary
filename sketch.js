let state = "select";

let cvs;

let myFont;

let addButton, okButton, backButton, galleryButton;

let allConstellations = [];
let selectedLabel = null;

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMovedFlag = false;

let bgStars = [];
let bgStarCount = 300;

// ---- gallery 用
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
  cvs = createCanvas(windowWidth, windowHeight, WEBGL);

  // ★★★ 修正１：pointer-events:none を削除 ★★★
  // cvs.elt.style.pointerEvents = "none"; ← 削除
  cvs.elt.style.position = "absolute";
  cvs.elt.style.left = "0px";
  cvs.elt.style.top = "0px";
  cvs.elt.style.zIndex = "-1";

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

  // ★★★ 修正２：pointer-events:auto を強制付与 + z-index↑ ★★★
  for (let b of [addButton, okButton, backButton, galleryButton]) {
    b.style("position", "absolute");
    b.style("z-index", "200");       
    b.style("pointer-events", "auto");    // ← これでタッチが確実に届く
    styleButton(b);
  }
  backButton.hide();

  computeBtnSize();
  positionButtons();

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

  // デスクトップ用
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
    drawGallery2D(allConstellations);
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
   ギャラリー内タップ
   ========================================================= */
// （元の handleTap をそのまま使用）
/* ここは長いため省略、あなたの元コードと同じです */
/* 必要であればここも完全修正版を展開します。 */


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
  if (!addButton || !okButton || !backButton || !galleryButton) return;

  okButton.position(
    windowWidth / 2 - okButton.width / 2,
    windowHeight - okButton.height - 20
  );

  addButton.position(20, windowHeight - addButton.height - 20);
  backButton.position(20, 20);
  galleryButton.position(windowWidth - galleryButton.width - 40, 20);
}
