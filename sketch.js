let cvs;

let myFont;

let addButton, okButton, backButton, galleryButton;

// ----PAD 用
let state = "select";
let padValues = [];
let points = [];

let allConstellations = [];
let selectedLabel = null;

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMovedFlag = false;

let bgStars = [];
let bgStarCount = 300;

// ---- gallery 用
let scrollY = 0;
let targetScrollY = 0;

let galleryOuterPad = 20;
let galleryGutter = 12;
let galleryTopOffset = 40;

let galleryMinScroll = 0;

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

  cvs.elt.style.position = "absolute";
  cvs.elt.style.left = "0px";
  cvs.elt.style.top = "0px";
  cvs.elt.style.zIndex = "0";

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
    b.style("position", "absolute");
    b.style("z-index", "200");
    b.style("pointer-events", "auto");
    styleButton(b);
  }
  backButton.hide();

  positionButtons();
  setTimeout(positionButtons, 50);

  /* -------------------- タッチイベント -------------------- */
   // addボタン
   function onAdd(){
     if(selectedP == null || selectedA == null || selectedD == null) return;
   
     padValues.push({
       p: selectedP,
       a: selectedA,
       d: selectedD
     });
   
     selectedP = null;
     selectedA = null;
     selectedD = null;
   }
   addButton.touchStarted(onAdd);
   
   // okボタン
   function onOK(){
     if (!padValues || padValues.length <= 0) return;
   
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
   okButton.touchStarted(onOK);
   
   
   // backボタン
   function onBack(){
     state = "select";
     addButton.show();
     okButton.show();
     backButton.hide();
     selectedLabel = null;
   }
   backButton.touchStarted(onBack);
   
   
   // galleryボタン
   function onGallery(){
     state = "gallery";
     addButton.hide();
     okButton.hide();
     galleryButton.hide();
     backButton.show();
     galleryStars = [];

     scrollY = 0;
   　targetScrollY = 0;
   }
   galleryButton.touchStarted(onGallery);

  /* -------------------- 背景の星 -------------------- */
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

  // PADページ
  if (state === "select") {
    camera();
    drawPADButtons();
     
    addButton.show();
    okButton.show();
    galleryButton.show();
    backButton.hide();
     
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
    if (touches && touches.length > 0) {
        let my = touches[0].y;
        let dy = my - lastY;
        targetScrollY += dy * 0.8;
        lastY = my;
    }
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
   PADページ
   ========================================================= */
function drawPADPage() {
   background(5, 5, 20);

   drawPADButtons();

   addButton.show();
   okButton.show();
   galleryButton.show();
}

/* =========================================================
   ギャラリー内タップ
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
         let emo = nearest.emo || { en: "", ja: "" };
         selectedLabel = emo.en + "(" + (emo.ja || "") + ")";
       }
       return;
     }
   
     // ---- select mode: PAD
     if (state === "select") {

     let tx = x - width / 2;
     let ty = y - height / 2;
   
     let mx = tx / padLayout.scl;
     let my = ty / padLayout.scl;
   
     let cx = 0;
     let cy = 0; 
   
     // === P row ===
     for (let i = 0; i < 7; i++) {
       let bx = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
       let by = cy - 160;
   
       if (mx > bx - padLayout.btnSize/2 &&
           mx < bx + padLayout.btnSize/2 &&
           my > by - padLayout.btnSize/2 &&
           my < by + padLayout.btnSize/2) {
         selectedP = i;
         return;
       }
     }
        
     // === A row ===
     for (let i = 0; i < 7; i++) {
       let bx = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
       let by = cy;
   
       if (dist(mx, my, bx, by) < padLayout.btnSize/2) {
         selectedA = i;
         return;
       }
     }
   
     // === D row ===
     for (let i = 0; i < 7; i++) {
       let bx = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
       let by = cy + 160;
   
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
        
       let maxThumb = 180;
       let minThumb = 60;
        
       let colCount = 1;
       for (let c = 4; c >= 1; c--) {
          let possibleSize = (width - outerPad * 2 - gutter * (c - 1)) / c;
          if (possibleSize >= minThumb) {
            colCount = c;
            break;
          }
       }

        let thumbSize = (width - outerPad * 2 - gutter * (colCount - 1)) / colCount;
        thumbSize = constrain(thumbSize, minThumb, maxThumb);
      
        let grouped = {};
        for (let i = 0; i < 12; i++) grouped[i] = [];
        for (let c of allConstellations) {
          let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
          if (!m) continue;
          grouped[int(m[2]) - 1].push(c);
        }

        let yOff = topOffset + scrollY;

        for (let month = 0; month < 12; month++) {
           let list = grouped[month];
           if (list.length === 0) continue; 

           yOff += 40;

           let index = 0;
           for (let cons of list) {
              let col = index % colCount;
              let row = Math.floor(index / colCount);

              let x0 = outerPad + col * (thumbSize + gutter);
              let ty = yOff + row * (thumbSize + 35);

              if (mx > x0 && mx < x0 + thumbSize && my > ty && my < ty + thumbSize) {
              selectedLabel = cons.created;
              state = "visual";
              prepareVisual(cons);
              return;
            }
      
            index++;
          }
      
          yOff += Math.ceil(list.length / colCount) * (thumbSize + 35) + 40;
        }
      }
   }

/* =========================================================
   mouseWheel
   ========================================================= */
function mouseWheel(event) {
  if (state === "gallery") {
    targetScrollY -= event.delta * 0.5;
    targetScrollY = constrain(targetScrollY, galleryMinScroll, 0);
    return false;
  }
  return false;
}

/* =========================================================
   ボタン配置
   ========================================================= */
function positionButtons() {
  if (!addButton || !okButton || !backButton || !galleryButton) return;

  let bw = addButton.size().width;
  let bh = addButton.size().height;
  if (bw === 0 || bh === 0) {
    setTimeout(positionButtons, 50);
    return;
  }

  // ---- PAD 選択モード ----
  if (state === "select") {

    addButton.position(
      windowWidth / 2 - bw - 10,
      windowHeight - bh - 20
    );

    okButton.position(
      windowWidth / 2 + 10,
      windowHeight - okButton.size().height - 20
    );

    galleryButton.position(
      windowWidth / 2 - galleryButton.size().width / 2,
      20
    );

    backButton.position(20, 20);
    return;
  }

  // ---- visual ----
  if (state === "visual") {
    backButton.position(20, 20);
    return;
  }

  // ---- gallery ----
  if (state === "gallery") {
    backButton.position(20, 20);
    return;
  }
}
