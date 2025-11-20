let emotions = [
  {en: "Relaxed", ja: "リラックス", P: 0.7, A: -0.6, D: 0.2},
  {en: "Contented", ja: "満足", P: 0.6, A: -0.3, D: 0.1},
  {en: "Calm", ja: "落ち着いた", P: 0.65, A: -0.5, D: 0.0},
  {en: "Sleepy", ja: "眠い", P: 0.0, A: -0.9, D: -0.3},
  {en: "Bored", ja: "退屈", P: -0.5, A: -0.6, D: -0.4},
  {en: "Miserable", ja: "惨め", P: -0.85, A: -0.4, D: -0.6},
  {en: "Unhappy", ja: "不幸", P: -0.7, A: -0.5, D:-0.4},
  {en: "Annoyed", ja: "いらいら", P: 0.4, A: 0.2, D: -0.1},
  {en: "Angry", ja: "怒り", P: -0.8, A: 0.6, D: 0.6},
  {en: "Excited", ja: "興奮", P: 0.8, A: 0.9, D: 0.4},
  {en: "Aroused", ja: "覚醒", P: 0.5, A: 0.8, D: 0.3},
  {en: "Wide-awake", ja: "目が覚める", P: 0.1, A: 0.9, D: 0.0},
  {en: "Frenzied", ja: "狂乱", P: -0.2, A: 0.95, D: -0.1},
  {en: "Jittery", ja: "神経質", P: -0.5, A: 0.8, D: -0.2},
  {en: "Fearful", ja: "恐れ", P: -0.9, A: 0.8, D: -0.6},
  {en: "Anxious", ja: "不安", P: -0.7, A: 0.65, D: -0.5},
  {en: "Dependent", ja: "依存", P: 0.2, A: -0.1, D: -0.6},
  {en: "Controlled", ja: "支配されている", P: -0.3, A: -0.1, D: -0.8},
  {en: "Influenced", ja: "影響される", P: -0.1, A: 0.0, D: -0.5},
  {en: "Dominant", ja: "支配的", P: 0.1, A: 0.2, D: 0.8}
];

let myFont;

// 3Dカメラ
let camRotX = 0;
let camRotY = 0;
let camDistance = 600;
let lastX = null;
let lastY = null;

let padValues = [];
let points = [];
let stars = [];
let selectedLabel = null;

let state = "select"; 

let addButton, okButton, backButton;

// PAD選択ボタン
let selectedP = null, selectedA = null, selectedD = null; 
let btnSize = 50;
let padLayout = {
  cx: 0,
  cy: 0,
  btnSize: 50,
  spacing: 10,
  scl: 1
};

let visualStartTime = 0; 
let allConstellations = [];

// 日記一覧ページ
let galleryButton;
let scrollY = 0;
let targetScrollY = 0;
let galleryStars = [];

let outerPad = 20;
let gutter = 12;
let topOffset = 40;

function preload() {
	myFont = loadFont("assets/nicomoji_1.00.ttf");
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
 
    addButton = createButton("追加");
    addButton.style('position', 'absolute');
    addButton.style('z-index', '10');

    okButton = createButton("OK");
    okButton.style('position', 'absolute');
    okButton.style('z-index', '10');

    backButton = createButton("← 記録ページ");
    backButton.style('position', 'absolute');
    backButton.style('z-index', '10');
    backButton.hide();
	
    addButton.mousePressed(addPAD);

    okButton.mousePressed(() => {
      if (padValues.length > 0) {
        prepareVisual();
      
        let now = new Date();
        let y = now.getFullYear();
		let m = String(now.getMonth() + 1).padStart(2, "0");
		let d = String(now.getDate()).padStart(2, "0");
		let hh = String(now.getHours()).padStart(2, "0");
		let mm = String(now.getMinutes()).padStart(2, "0");
		
		let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		let wd = weekdays[now.getDay()];
		
		let timestamp = `${y}/${m}/${d} (${wd}) ${hh}:${mm}`;
        let serialStars = points.map(s => {
          let px = (s.pos && typeof s.pos.x !== "undefined") ? s.pos.x : 0;
          let py = (s.pos && typeof s.pos.y !== "undefined") ? s.pos.y : 0;
          let pz = (s.pos && typeof s.pos.z !== "undefined") ? s.pos.z : 0;
          return { pos: { x: px, y: py, z: pz }, emo: s.emo };
        });

        let newConstellation = {
          stars: serialStars, 
          created: timestamp
        };
        allConstellations.push(newConstellation);
        localStorage.setItem("myConstellations", JSON.stringify(allConstellations));

        state = "visual";
        addButton.hide();
        okButton.hide();
        backButton.show();
        visualStartTime = millis();
      }
    });

    backButton.mousePressed(() => {
      state = "select";
      addButton.show();
      okButton.show();
      backButton.hide();
      selectedLabel = null;
    });

    layoutDOMButtons();

    computeBtnSize();

    // gallery
    galleryButton = createButton("日記一覧");
    galleryButton.style('position', 'absolute');
    galleryButton.style('z-index', '10');
    galleryButton.position(width - 130, 20);
    galleryButton.mousePressed(() => {
	    state = "gallery";
	    addButton.hide();
	    okButton.hide();
	    backButton.show();

	    galleryStars = [];
  　 for (let i = 0; i < 400; i++) {
      　galleryStars.push({
          x: random(-2000, 2000),
		  y: random(-2000, 2000),
		  z: random(-2000, 2000),
		  twinkle: random(1000),
		  baseSize: random(1, 4)
        });
     }
  });

	function styleButton(btn) {
	  btn.style("font-family", "nicomoji_1.00");
	  btn.style("font-size", width < 600 ? "22px" : "18px");
	  btn.style("padding", width < 600 ? "14px 20px" : "12px 18px");
	
	  btn.style("color", "white");
	  btn.style("background", "rgba(120,150,255,0.35)");
	  btn.style("backdrop-filter", "blur(6px)");
	  btn.style("border", "none");
	  btn.style("border-radius", "12px");
	  btn.style("box-shadow", "0 0 12px rgba(150,180,255,0.6)");
	  btn.style("transition", "0.2s");
	
	  btn.mouseOver(() => btn.style("background", "rgba(160,180,255,0.55)"));
	  btn.mouseOut(() => btn.style("background", "rgba(120,150,255,0.35)"));
	}

	styleButton(addButton);
	styleButton(okButton);
	styleButton(backButton);
	styleButton(galleryButton);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutDOMButtons();
  computeBtnSize();
}

function layoutDOMButtons(){
  let sidePad = max(8, floor(width * 0.03));
  let bottomPad = max(10, floor(height * 0.04));
  addButton.position(sidePad, height - 80 - bottomPad);
  okButton.position(width/2 - 40, height - 60 - bottomPad);
  backButton.position(sidePad, sidePad + 6);
}

function computeBtnSize(){
  let base = min(width, height);
  btnSize = constrain(floor(base * 0.09), 40, 78); 
  padLayout.btnSize = btnSize;
  padLayout.spacing = floor(btnSize * 0.22);
}

function addPAD() {
  let p = (selectedP !== null ? selectedP : 3) / 6; 
  let a = (selectedA !== null ? selectedA : 3) / 6;
  let d = (selectedD !== null ? selectedD : 3) / 6;
  padValues.push({P: p, A: a, D: d});
  selectedP = null; selectedA = null; selectedD = null;
}

function prepareVisual() {
  points = [];
  for (let v of padValues) {
    let emo = findClosestEmotion(v.P, v.A, v.D);
    let x = map(v.P, 0, 1, -100, 100);
    let y = map(v.A, 0, 1, -100, 100);
    let z = map(v.D, 0, 1, -100, 100);
    points.push({pos:createVector(x,y,z), emo:emo});
  }
  stars = [];
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: random(-2000, 2000),
      y: random(-2000, 2000),
      z: random(-2000, 2000),
      twinkle: random(1000)
    });
  }
}

function draw() {
  background(5,5,20);

  if (state === "visual") {
    let mx = mouseX;
    let my = mouseY;

    if (touches.length > 0) {
      mx = touches[0].x;
      my = touches[0].y;
    }

    if (mouseIsPressed || touches.length > 0) {
      if (lastX !== null && lastY !== null) {
        let dx = mx - lastX;
        let dy = my - lastY;

        camRotY += dx * 0.005; 
        camRotX += dy * 0.005;  
      }
      lastX = mx;
      lastY = my;
    } else {
      lastX = null;
      lastY = null;
    }

    camera(
      sin(camRotY) * cos(camRotX) * camDistance,
      sin(camRotX) * camDistance,
      cos(camRotY) * cos(camRotX) * camDistance,
      0, 0, 0,
      0, 1, 0
    );
  }

  // ---------- 選択画面 ----------
  if (state === "select"){
    camera();
    drawPADButtons();
    return;
  }

  // ★ 星空描画
  push(); 
  noStroke();
  for (let s of stars) {
    if (random() < 0.02) s.on = !s.on;
    if (s.baseSize === undefined) s.baseSize = random(1.0, 4.0);
    let blink = (s.on ? 1 : 0);
    let pulse = 0.5 + 0.5 * sin(frameCount * 0.02 + s.twinkle);
    let intensity = blink * pulse;
    let starSize = s.baseSize + intensity * random(0.5, 2.0);
    let alpha = map(intensity, 0, 1, 10, 255);
    let r = 200 + random(-20, 20);
    let g = 200 + random(-20, 20);
    let b = 255;
    fill(r, g, b, alpha);
    push();
    translate(s.x, s.y, s.z);
    sphere(starSize);
    pop();
  }
  pop();

  if (allConstellations.length === 0) return;

  let latest = allConstellations[allConstellations.length - 1];
  let latestMonth = -1;

  if (latest?.created) {
    let m = latest.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (m) latestMonth = int(m[2]);
  }

  let sameMonthConstellations = [];
  for (let c of allConstellations) {
    if (!c.created) continue;
    let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) continue;
    if (int(m[2]) === latestMonth) sameMonthConstellations.push(c);
  }

  let displayList = [...sameMonthConstellations];
  let idx = displayList.indexOf(latest);
  if (idx !== -1) displayList.splice(idx, 1);
  displayList.push(latest);


  // ★ 星座描画
  for (let i = 0; i < displayList.length; i++) {
    let constellation = displayList[i];
    push();

    if (i === displayList.length - 1) {
      translate(0, 0, 200);
      scale(1.5);
    } else {
      let col = i % 5;
      let arow = floor(i / 5);
      translate(-600 + col * 250, -300 + arow * 250, -800);
      scale(0.6);
    }

    stroke(150, 80);
    noFill();
    box(220);

    for (let p of constellation.stars) {
      let px = p.pos?.x ?? 0;
      let py = p.pos?.y ?? 0;
      let pz = p.pos?.z ?? 0;

      push();
      translate(px, py, pz);
      let flicker = 220 + 35 * sin(frameCount*0.1 + i*37);
      fill(255, 255, 200, flicker);
      noStroke();
      sphere(8);
      pop();
    }

    if (millis() - visualStartTime > 1200) {
      push();
      stroke(180, 200, 255, 90);
      strokeWeight(2);
      blendMode(ADD);
      for (let a = 0; a < constellation.stars.length; a++) {
        for (let b = a+1; b < constellation.stars.length; b++) {
          let aPos = constellation.stars[a].pos;
          let bPos = constellation.stars[b].pos;
          if (aPos && bPos) {
            line(aPos.x, aPos.y, aPos.z, bPos.x, bPos.y, bPos.z);
          }
        }
      }
      pop();
    }

    push();
    translate(0, 120, 0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(constellation.created, 0, 0);
    pop();

    pop();
  }


  // 月名
  if (allConstellations.length > 0) {
    let latest = allConstellations[allConstellations.length - 1];
    let m = latest?.created?.match(/(\d+)\D+(\d+)\D+(\d+)/);
    let monthIndex = m ? int(m[2]) - 1 : 0;
    let monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    push();
    resetMatrix();               
    applyMatrix(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
    noLights();
    textAlign(CENTER, TOP);
    textSize(32);
    fill(255);
    text(monthNames[monthIndex], width/2, 20);
    pop();
  }

  // ギャラリー
  if (state === "gallery") {
    drawGallery2D();
    return;
  }
}

function mouseWheel(event) {
	// スクロール
	if (state === "gallery") {
	    targetScrollY -= event.delta * 0.5;
	
	    let maxScroll = 0;
	    let minScroll = -3000;
	    targetScrollY = constrain(targetScrollY, minScroll, maxScroll);
	
	    return false; 
	  }


	// ズーム
	if (state === "visual") {
	    camDistance += event.delta * 0.5;
	    camDistance = constrain(camDistance, 200, 2000);
	 }
	
    return false;
}

function drawPADButtons(){
  let cx = 0;
  let cy = 0;

  let safeW = width * 0.9;
  let safeH = height * 0.75;
  let neededW = (padLayout.btnSize + padLayout.spacing) * 7;
  let scl = 1;
  if (neededW > safeW) {
    scl = safeW / neededW;
  }
  let neededH = padLayout.btnSize * 3 + padLayout.spacing * 2 + 120;
  if (neededH * scl > safeH) {
    scl *= safeH / (neededH * scl);
  }

  padLayout.cx = cx;
  padLayout.cy = cy;
  padLayout.scl = scl; 

  push();
  scale(padLayout.scl); 
  // P 行
  for(let i=0;i<7;i++){
    let col = lerpColor(color(255,150,0), color(0,100,255), i/6);
    drawButton(cx + (i-3)*(padLayout.btnSize+padLayout.spacing), cy-120, padLayout.btnSize, col, i, selectedP===i, "rect");
  }
  // A 行
  for(let i=0;i<7;i++){
    let col = lerpColor(color(255,220,0), color(0,0,100), i/6);
    let sides = int(map(i,0,6,3,30));
    drawButton(cx + (i-3)*(padLayout.btnSize+padLayout.spacing), cy, padLayout.btnSize, col, i, selectedA===i, "polygon", sides);
  }
  // D 行
  for(let i=0;i<7;i++){
    let col = color(200);
    let sides = int(map(i,0,6,4,30));
    drawButton(cx + (i-3)*(padLayout.btnSize+padLayout.spacing), cy+120, padLayout.btnSize, col, i, selectedD===i, "polygon", sides);
  }
  pop();
}

function drawButton(x,y,btnSize_,col,index,isSelected,shapeType,sides=4){
  push();
  translate(x, y, 0);

  push();
  blendMode(ADD);
  noStroke();
  let auraAlpha = isSelected ? 100 : 40;  
  let aura = color(red(col), green(col), blue(col), auraAlpha);
  fill(aura);
  ellipse(0, 0, btnSize_ * 2.2, btnSize_ * 2.2);
  pop();

  let body = color(
    constrain(red(col) + 20, 0, 255),
    constrain(green(col) + 20, 0, 255),
    constrain(blue(col) + 20, 0, 255)
  );

  noStroke();
  fill(body);

  if (shapeType === "rect") {
    rectMode(CENTER);
    rect(0, 0, btnSize_, btnSize_, 8);
  } else if (shapeType === "polygon") {
    polygon(0, 0, btnSize_/2, sides);
  }

  pop();
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
      let sx = sp.x;
      let sy = sp.y;
      let d = dist(mouseX, mouseY, sx, sy);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    if (nearest) {
      let emo = nearest.emo || {en:"", ja:""};
      selectedLabel = emo.en + "(" + (emo.ja || "") + ")";
    }
    return;
  } 
  else if (state === "select") {
    let mx = (mouseX - width/2) / padLayout.scl;
    let my = (mouseY - height/2) / padLayout.scl;
    let cx = padLayout.cx;
    let cy = padLayout.cy;

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
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) {
        selectedA = i;
      }
    }

    // D 行 (円判定)
    for (let i = 0; i < 7; i++) {
      let bx = cx + (i-3)*(padLayout.btnSize+padLayout.spacing);
      let by = cy + 120;
      if (dist(mx, my, bx, by) < padLayout.btnSize/2) {
        selectedD = i;
      }
    }
  }
}

function polygon(x,y,r,n){
  beginShape();
  for(let i=0;i<n;i++){
    let angle = TWO_PI*i/n;
    vertex(x+cos(angle)*r,y+sin(angle)*r);
  }
  endShape(CLOSE);
}

function findClosestEmotion(p,a,d){
  let best=null, minDist=Infinity;
  for(let e of emotions){
    let dx = p - e.P;
    let dy = a - e.A;
    let dz = d - e.D;
    let dist2 = sqrt(dx*dx + dy*dy + dz*dz);
    if(dist2 < minDist){ minDist = dist2; best = e; }
  }
  return best;
}

function screenPos(x, y, z) {
  const mv = this._renderer.uMVMatrix.mat4;
  const p = this._renderer.uPMatrix.mat4;

  let v = [x, y, z, 1];

  let mv_v = [
    mv[0]*v[0] + mv[4]*v[1] + mv[8]*v[2] + mv[12]*v[3],
    mv[1]*v[0] + mv[5]*v[1] + mv[9]*v[2] + mv[13]*v[3],
    mv[2]*v[0] + mv[6]*v[1] + mv[10]*v[2] + mv[14]*v[3],
    mv[3]*v[0] + mv[7]*v[1] + mv[11]*v[2] + mv[15]*v[3]
  ];

  let clip = [
    p[0]*mv_v[0] + p[4]*mv_v[1] + p[8]*mv_v[2] + p[12]*mv_v[3],
    p[1]*mv_v[0] + p[5]*mv_v[1] + p[9]*mv_v[2] + p[13]*mv_v[3],
    p[2]*mv_v[0] + p[6]*mv_v[1] + p[10]*mv_v[2] + p[14]*mv_v[3],
    p[3]*mv_v[0] + p[7]*mv_v[1] + p[11]*mv_v[2] + p[15]*mv_v[3]
  ];

  let ndcX = clip[0] / clip[3];
  let ndcY = clip[1] / clip[3];

  let sx = map(ndcX, -1, 1, 0, width);
  let sy = map(-ndcY, -1, 1, 0, height);

  return createVector(sx, sy);
}

function drawGallery2D() {
  resetMatrix();
  camera();
	
  background(5, 5, 20); 
  push(); 
  noStroke(); 
  for (let s of galleryStars) { 
	  if (random() < 0.02) s.on = !s.on; 
	  let pulse = 0.5 + 0.5 * sin(frameCount * 0.02 + s.twinkle); 
	  let starSize = s.baseSize + pulse * random(0.5, 2); 
	  fill(200 + random(-20, 20), 200 + random(-20, 20), 255, 180); 
	  push(); 
	  translate(s.x, s.y, s.z); 
	  sphere(starSize); 
	  pop(); 
  }
	pop();
	
  translate(-width / 2, -height / 2);

  let designWidth = 430;
  let galleryScale = min(1, width / designWidth);

  // スクロール
  scrollY = lerp(scrollY, targetScrollY, 0.4);

  push();
  scale(galleryScale);
  translate(0, scrollY / galleryScale);

  let maxThumb = 160;
  let scaledWidth = width / galleryScale;

  let colCount = floor((scaledWidth - outerPad * 2) / (maxThumb + gutter));
  colCount = constrain(colCount, 1, 6);

  let totalGutter = gutter * (colCount - 1);
  let availableWidth = scaledWidth - outerPad * 2 - totalGutter;

  let thumbSize = floor(availableWidth / colCount);
  thumbSize = constrain(thumbSize, 60, maxThumb);

  // 月名
  let monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // --- 月ごとに分類 ---
  let monthLabelOffset = 20; 
  let y = topOffset;

  let grouped = {};
  for (let m = 0; m < 12; m++) grouped[m] = [];
  for (let c of allConstellations) {
    let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) continue;
    let monthIndex = int(m[2]) - 1;
    grouped[monthIndex].push(c);
  }

  for (let month = 0; month < 12; month++) {
    let list = grouped[month];
    if (list.length === 0) continue;

    fill(255);
    textSize(32);
    textAlign(LEFT, TOP);
    text(monthNames[month], monthLabelOffset, y);  
    y += 45;

    // サムネ描画
    let index = 0;
    let rows = ceil(list.length / colCount);
		 
    let rowWidth = thumbSize * colCount + gutter * (colCount - 1);
    let rowStartX = (scaledWidth - rowWidth) / 2;

    for (let cons of list) {
      let col = index % colCount;
      let row = floor(index / colCount);

      let x = rowStartX + col * (thumbSize + gutter);
      let ty = y + row * (thumbSize + 40);

      push();
      translate(x, ty);
      rectMode(CORNER);

      // サムネ背景
      fill(255, 255, 255, 25);
      noStroke();
      rect(0, 0, thumbSize, thumbSize, 10);

      // 星座サムネ
      if (!cons.thumbnail) {
		  cons.thumbnail = generateThumbnail(cons, thumbSize);
	  }

		image(cons.thumbnail, 0, 0);

      // 日付ラベル
      fill(230);
      textSize(10);
      textAlign(LEFT, TOP);
      text(cons.created, 0, thumbSize + 8);

      pop();

      index++;
    }

    y += rows * (thumbSize + 40) + 40;
  }

  pop();

  let scaledY = y * galleryScale;
  let minScroll = -max(0, scaledY - height + 40);

  targetScrollY = constrain(targetScrollY, minScroll, 0);
  scrollY = constrain(scrollY, minScroll, 0);
}

function generateThumbnail(cons, size) {
	let pg = createGraphics(size, size);
	pg.background(5, 5, 20);

	let ax = radians(-30);
	let ay = radians(30);

	// 線
	pg.push();
	pg.stroke(180, 200, 255, 90);
	pg.strokeWeight(1);
	pg.noFill();

	for (let i = 0; i < cons.stars.length; i++) {
		for (let j = 0; j < cons.stars.length; j++) {
			let a = projectPoint(cons.stars[i].pos, ax, ay, size);
			let b = projectPoint(cons.stars[j].pos, ax, ay, size);
			pg.line(a.x, a.y, b.x, b.y);
		}
	}

	// 星
	pg.noStroke();
	pg.fill(255, 240, 200, 230);
	for (let s of cons.stars) {
		let p = projectPoint(s.pos, ax, ay, size);
		pg.circle(p.x, p.y, 5);
	}

	pg.pop();
	return pg;
}

function projectPoint (pos, ax, ay, size) {
	let x = pos.x;
  let y = pos.y;
  let z = pos.z;

  let ry = y * cos(ax) - z * sin(ax);
  let rz = y * sin(ax) + z * cos(ax);

  let rx = x * cos(ay) - rz * sin(ay);
  rz = x * sin(ay) + rz * cos(ay);

  let px = map(rx, -120, 120, 10, size - 10);
  let py = map(ry, -120, 120, 10, size - 10);

  return createVector(px, py);
}
