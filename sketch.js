let state = "select";

let myFont;

let addButton, okButton, backButton, galleryButton;

let allConstellations = [];
let selectedLabel = null;

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMovedFlag = false;

let bgStars = [];
let bgStarCount = 300;

function preload() {
  myFont = loadFont("nicomoji-plus_v2-5.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(myFont);
  textSize(16);

  let saved = localStorage.getItem("myConstellations");
  if (saved) {
    try {
      allConstellations = JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage JSON parse error, resetting storage.", e);
      allConstellations = [];
      localStorage.removeItem("myConstellations");
    }
  }

  // ボタン作成
  addButton = createButton("追加");
  addButton.style('position','absolute'); addButton.style('z-index','10');
  okButton = createButton("OK");
  okButton.style('position','absolute'); okButton.style('z-index','10');
  backButton = createButton("← 記録ページ");
  backButton.style('position','absolute'); backButton.style('z-index','10'); backButton.hide();
  galleryButton = createButton("日記一覧");
  galleryButton.style('position','absolute'); galleryButton.style('z-index','10');

  styleButton(addButton); styleButton(okButton); styleButton(backButton); styleButton(galleryButton);
  computeBtnSize();
  positionButtons();

  addButton.touchStarted(addPAD);

  okButton.touchStarted(() => {
    if (padValues.length > 0) {
      prepareVisual();
      let now = new Date();
      let y = now.getFullYear();
      let m = String(now.getMonth() + 1).padStart(2, "0");
      let d = String(now.getDate()).padStart(2, "0");
      let hh = now.getHours();
      let mm = String(now.getMinutes()).padStart(2, "0");
      let weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      let wd = weekdays[now.getDay()];
      let timestamp = `${y}. ${m}. ${d} (${wd}) ${hh}:${mm}`;

      let serialStars = points.map(s => {
        return { pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z }, emo: s.emo };
      });

      let newConstellation = { stars: serialStars, created: timestamp };
      allConstellations.push(newConstellation);
      localStorage.setItem("myConstellations", JSON.stringify(allConstellations));

      state = "visual";
      addButton.hide(); okButton.hide(); backButton.show();
      visualStartTime = millis();
    }
  });

  backButton.touchStarted(() => {
    state = "select";
    addButton.show(); okButton.show(); backButton.hide();
    selectedLabel = null;
  });

  galleryButton.touchStarted(() => {
    state = "gallery";
    addButton.hide(); okButton.hide(); backButton.show();
    galleryStars = []; // reset gallery background stars
  });

  computeBtnSize();

  // 背景の星
  for (let i = 0; i < bgStarCount; i++) {
    bgStars.push( {
      x: random(-width * 2, width * 2),
      y: random(-height * 2, height * 2),
      z: random(-2000, 200),
      tw: random(1000)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionButtons();
}

function draw() {
  background(5,5,20);

  if (state === "visual") {
    drawBackgroundStars();
    drawVisualMode();
    
    camRotX += rotVelX;
    camRotY += rotVelY;
    rotVelX *= 0.9;
    rotVelY *= 0.9;
    camRotX = constrain(camRotX, -1.2, 1.2);

    let camPos = computeCameraPosition();
    camera(camPos.x, camPos.y, camPos.z, camPanX, camPanY, 0, 0, 1, 0);

    resetMatrix();
    if (selectedLabel) {
      noLights();
      textAlign(LEFT, TOP);
      textSize(18);
      fill(255);
      text(selectedLabel, 20, 20);
    }
    return;
  }

  // ----------------
  // SELECT MODE (PAD UI)
  // ----------------
  if (state === "select") {
    camera(); // reset camera for 2D-like UI
    drawPADButtons();
    return;
  }

  // ----------------
  // GALLERY MODE (2D)
  // ----------------
  if (state === "gallery") {
    resetMatrix();
    drawBackgroundStars();
    drawGallery2D(allConstellations);
    return;
  }
}

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

function handleTap(x, y) {
  if (x == null || y == null) return;

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

  if (state === "select") {
    // convert page coords -> padLayout coords (we used width/2, height/2 center)
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

  if (state === "gallery") {
    let yOff = topOffset + scrollY;
    let maxThumb = 160;
    let colCount = floor((width - outerPad * 2) / (maxThumb + gutter));
    colCount = constrain(colCount, 1, 5);
    let thumbSize = floor((width - outerPad * 2 - gutter * (colCount - 1)) / colCount);
    thumbSize = constrain(thumbSize, 60, maxThumb);

    let mx = x, my = y;
    let grouped = {};
    for (let i=0;i<12;i++) grouped[i] = [];
    for (let c of allConstellations) {
      let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
      if (!m) continue;
      grouped[int(m[2]) - 1].push(c);
    }

    for (let month = 0; month < 12; month++) {
      let list = grouped[month];
      if (list.length === 0) continue;
      yOff += 40;
      let index = 0;
      let rows = ceil(list.length / colCount);
      for (let cons of list) {
        let col = index % colCount;
        let row = floor(index / colCount);
        let x0 = outerPad + col * (thumbSize + gutter);
        let ty = yOff + row * (thumbSize + 35);
        if (mx > x0 && mx < x0 + thumbSize && my > ty && my < ty + thumbSize) {
          selectedLabel = cons.created + " (selected)";
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

function mouseWheel(event) {
  if (state === "gallery") {
    targetScrollY -= event.delta * 0.5;
    let maxScroll = 0;
    let minScroll = -3000;
    targetScrollY = constrain(targetScrollY, minScroll, maxScroll);
    return false;
  }
  if (state === "visual") {
    camDistance += event.delta * 0.9;
    camDistance = constrain(camDistance, 200, 2000);
  }
  return false;
}

function positionButtons() {
  okButton.position(
    windowWidth / 2 - okButton.width / 2,
    windowHeight - okButton.height - 20
  );

  addButton.position(
    20,
    windowHeight - addButton.height - 20
  );

  backButton.position(
    20,
    20
  );

  galleryButton.position(
    windowWidth - galleryButton.width - 40,
    20
  );
}
