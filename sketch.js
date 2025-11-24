let state = "seelect";
let myFont;
let addButton, okButton, backButton, galleryButton;
let allConstellations = [];
let selectedLabel = null;

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

  // DOM ボタン作成
  addButton = createButton("追加");
  addButton.style('position','absolute'); addButton.style('z-index','10');
  okButton = createButton("OK");
  okButton.style('position','absolute'); okButton.style('z-index','10');
  backButton = createButton("← 記録ページ");
  backButton.style('position','absolute'); backButton.style('z-index','10'); backButton.hide();

  galleryButton = createButton("日記一覧");
  galleryButton.style('position','absolute'); galleryButton.style('z-index','10');
  galleryButton.position(width-130, 20);

  // ボタンスタイル
  styleButton(addButton); styleButton(okButton); styleButton(backButton); styleButton(galleryButton);
  layoutDOMButtons(addButton, okButton, backButton);
  computeBtnSize();

  // イベント
  addButton.mousePressed(addPAD);

  okButton.mousePressed(() => {
    if (padValues.length > 0) {
      prepareVisual();
      // prepare serial stars and save
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

      // switch to visual
      state = "visual";
      addButton.hide(); okButton.hide(); backButton.show();
      visualStartTime = millis();
    }
  });

  backButton.mousePressed(() => {
    state = "select";
    addButton.show(); okButton.show(); backButton.hide();
    selectedLabel = null;
  });

  galleryButton.mousePressed(() => {
    state = "gallery";
    addButton.hide(); okButton.hide(); backButton.show();
    galleryStars = []; // reset background stars for gallery
  });

  // compute initial stars / layout
  computeBtnSize();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutDOMButtons(addButton, okButton, backButton);
  computeBtnSize();
}

function draw() {
  background(5,5,20);

  // UI: show selected label if any (for visual state)
  if (state === "visual") {
    // camera control + stars + constellations
    // handle mouse/touch camera motion (same behavior as original)
    let mx = mouseX, my = mouseY;
    if (touches.length > 0) { mx = touches[0].x; my = touches[0].y; }
    let isPan = (mouseButton === RIGHT) || (touches.length >= 2);

    if (mouseIsPressed || touches.length > 0) {
      if (lastX !== null && lastY !== null) {
        let dx = mx - lastX, dy = my - lastY;
        if (isPan) { camPanX += dx * 0.5; camPanY += dy * 0.5; }
        else { camRotY += dx * 0.005; camRotX += dy * 0.005; rotVelX = dx * 0.002; rotVelY = dy * 0.002; }
      }
      lastX = mx; lastY = my;
    } else { lastX = null; lastY = null; }

    camRotX += rotVelX; camRotY += rotVelY;
    rotVelX *= 0.9; rotVelY *= 0.9;
    camRotX = constrain(camRotX, -1.2, 1.2);

    let camPos = computeCameraPosition();
    camera(camPos.x, camPos.y, camPos.z, camPanX, camPanY, 0, 0, 1, 0);

    // draw visual scene
    drawVisualMode();

    // UI overlay: selectedLabel
    resetMatrix(); // reset to 2D
    if (selectedLabel) {
      noLights();
      textAlign(LEFT, TOP);
      textSize(18);
      fill(255);
      text(selectedLabel, 20, 20);
    }
    return;
  }

  if (state === "select") {
    // use 2D-like UI: reset camera
    camera();
    drawPADButtons();
    return;
  }

  if (state === "gallery") {
    // 2D gallery draw (note: gallery.js expects allConstellations passed)
    resetMatrix();
    drawGallery2D(allConstellations);
    return;
  }
}

function mousePressed() {
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
      let d = dist(mouseX, mouseY, sp.x, sp.y);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    if (nearest) {
      let emo = nearest.emo || {en:"", ja:""};
      selectedLabel = emo.en + "(" + (emo.ja || "") + ")";
    }
    return;
  } else if (state === "select") {
    let mx = (mouseX - width/2) / padLayout.scl;
    let my = (mouseY - height/2) / padLayout.scl;
    let cx = padLayout.cx, cy = padLayout.cy;
    // P 行
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy - 120;
      if (mx > bx - padLayout.btnSize/2 && mx < bx + padLayout.btnSize/2 &&
          my > by - padLayout.btnSize/2 && my < by + padLayout.btnSize/2) {
        selectedP = i;
      }
    }
    // A 行 (円判定)
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy;
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) selectedA = i;
    }
    // D 行
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy + 120;
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) selectedD = i;
    }
    return;
  } else if (state === "gallery") {
    let y = topOffset + scrollY;
    let maxThumb = 160;
    let colCount = floor((width - outerPad * 2) / (maxThumb + gutter));
    colCount = constrain(colCount, 1, 5);
    let thumbSize = floor((width - outerPad * 2 - gutter * (colCount - 1)) / colCount);
    thumbSize = constrain(thumbSize, 60, maxThumb);
    let mx = mouseX, my = mouseY;

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
      y += 40;
      let index = 0;
      let rows = ceil(list.length / colCount);
      for (let cons of list) {
        let col = index % colCount;
        let row = floor(index / colCount);
        let x = outerPad + col * (thumbSize + gutter);
        let ty = y + row * (thumbSize + 35);
        if (mx > x && mx < x + thumbSize && my > ty && my < ty + thumbSize) {
          selectedLabel = cons.created + " (selected)";
          state = "visual";
          addButton.show(); okButton.show(); backButton.hide();
          return;
        }
        index++;
      }
      y += rows * (thumbSize + 35) + 40;
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

function touchStarted() {
  if (state === "gallery") return mousePressed();
  return false;
}
