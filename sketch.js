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
let camPanX = 0; 
let camPanY = 0; 
let camRotX = 0;
let camRotY = 0;
let rotVelX = 0; 
let rotVelY = 0;
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
let selectedConstellation = null;

let outerPad = 20;
let gutter = 12;
let topOffset = 40;

let zoomTarget = null;
let zoomStartTime = 0;

let closeDetailButton;

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
		let hh = now.getHours();
		let mm = String(now.getMinutes()).padStart(2, "0");
		
		let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		let wd = weekdays[now.getDay()];
		  
		let timestamp = `${y}. ${m}. ${d} (${wd}) ${hh}:${mm}`;
		  
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
		if (state === "detail") {
		    state = "gallery";
		    return;
		  }
	
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

	closeDetailButton = createButton("✕");
	closeDetailButton.style('position', 'absolute');
	closeDetailButton.style('z-index', '20');
	closeDetailButton.hide();
	closeDetailButton.mousePressed(() => {
		state = "gallery";
		closeDetailButton.hide();
	});

	function styleButton(btn) {
	  btn.style("font-family", "'nicomoji'");
	  btn.style("font-size", width < 600 ? "22px" : "18px");
	  btn.style("padding", width < 600 ? "14px 20px" : "12px 18px");

	  // ボタンデザイン
	  btn.style("color", "white");
	  btn.style("background", "rgba(255,255,255,0.15)");
	  btn.style("backdrop-filter", "blur(12px)");
	  btn.style("-webkit-backdrop-filter", "blur(12px)");
	  btn.style("border", "1px solid rgba(255,255,255,0.35)");
	  btn.style("border-radius", "14px");
	  btn.style("box-shadow", "0 8px 26px rgba(0,0,0,0.25), inset 0 0 18px rgba(255,255,255,0.2)");
	  btn.style("transition", "0.25s");
	
	  btn.mouseOver(() => {
		  btn.style("background", "rgba(255,255,255,0.25)");
		  btn.style("box-shadow", "0 8px 28px rgba(0,0,0,0.35), inset 0 0 24px rgba(255,255,255,0.3)");
		  btn.style("transform", "scale(1.05)");
	  });
	  btn.mouseOut(() => {
		  btn.style("background", "rgba(255,255,255,0.15)");
		  btn.style("box-shadow", "0 8px 26px rgba(0,0,0,0.25), inset 0 0 18px rgba(255,255,255,0.2)");
		  btn.style("transform", "scale(1.0)");
	  });
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

  if (state === "detail") {
	 closeDetailButton.show();
	 drawDetailPage();
	 return;
  }

  if (state === "visual") {
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
	  
    let mx = mouseX;
    let my = mouseY;

    if (touches.length > 0) {
      mx = touches[0].x;
      my = touches[0].y;
    }

    let isPan = (mouseButton === RIGHT) || (touches.length >= 2);

    if (mouseIsPressed || touches.length > 0) {
    if (lastX !== null && lastY !== null) {
      let dx = mx - lastX;
      let dy = my - lastY;

      if (isPan) {
        // パン移動
        camPanX += dx * 0.5;
        camPanY += dy * 0.5;
      } else {
        // 回転
        camRotY += dx * 0.005;
        camRotX += dy * 0.005;
        rotVelX = dx * 0.002;
        rotVelY = dy * 0.002;
      }
    }
      lastX = mx;
      lastY = my;
    } else {
      lastX = null;
      lastY = null;
    }

	// --- 慣性（スムーズ回転） ---
    camRotX += rotVelX;
	camRotY += rotVelY;
    rotVelX *= 0.9;
    rotVelY *= 0.9;

	// --- 角度制限（上下45°〜135°） ---
    camRotX = constrain(camRotX, -1.2, 1.2);

    // --- カメラ計算 ---
    let camX = sin(camRotY) * cos(camRotX) * camDistance;
    let camY = sin(camRotX) * camDistance;
    let camZ = cos(camRotY) * cos(camRotX) * camDistance;

    camera(
		camX + camPanX,
		camY + camPanY,
		camZ,
		camPanX, camPanY, 0,
		0, 1, 0
    );
  }

  // ---------- 選択画面 ----------
  if (state === "select"){
    camera();
    drawPADButtons();
    return;
  }

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
	    camDistance += event.delta * 0.9;
	    camDistance = constrain(camDistance, 200, 2000);
	 }
	
	if (state === "detail") {
		drawDetailPage();
		return;
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
    } else if (state === "select") {
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

	if (state === "gallery") {
		  let y = topOffset + scrollY;
		
		  let maxThumb = 160;
		  let colCount = floor((width - outerPad * 2) / (maxThumb + gutter));
		  colCount = constrain(colCount, 1, 5);
		
		  let thumbSize = floor((width - outerPad * 2 - gutter * (colCount - 1)) / colCount);
		  thumbSize = constrain(thumbSize, 60, maxThumb);
		
		  let mx = mouseX;
		  let my = mouseY;
		
		  let grouped = {};
		  for (let i=0; i<12; i++) grouped[i] = [];
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
		
		      if (mx > x && mx < x + thumbSize &&
		          my > ty && my < ty + thumbSize) {
		
		        selectedConstellation = cons;
		        zoomTarget = cons;
		        zoomStartTime = millis();
		        state = "detail";
		
		        closeDetailButton.show();
		        closeDetailButton.position(width - 60, 20);
		        return;
		      }
		
		      index++;
		    }
		
		    y += rows * (thumbSize + 35) + 40;
		  }
		
		  return;
		}


function touchStarted() {
	if (state === "gallery") {
		return mousePressed();
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
	let render = this._renderer || _renderer;
	let model = renderer.uMVMatrix.copy();
	let proj = renderer.uPMatrix.copy();

	let v = createdVector(x, y, z);
	let mv = model.applyToVector(V);

	let cx = proj.mat4[0] * mv.x + proj.mat4[4] * mv.y + proj.mat4[8]  * mv.z + proj.mat4[12];
	let cy = proj.mat4[1] * mv.x + proj.mat4[5] * mv.y + proj.mat4[9]  * mv.z + proj.mat4[13];
	let cz = proj.mat4[2] * mv.x + proj.mat4[6] * mv.y + proj.mat4[10] * mv.z + proj.mat4[14];
	let cw = proj.mat4[3] * mv.x + proj.mat4[7] * mv.y + proj.mat4[11] * mv.z + proj.mat4[15];
	
	let ndcX = cx / cw;
	let ndcY = cy / cw;

	let sx = map(ndcX, -1, 1, 0, width);
	let sy = map(-ndcY, -1, 1, 0, height);

	return createVector(sx, sy);
}

function drawGallery2D() {
    background(5, 5, 20); 

	let galleryScale = min(1, width / 430);
	
	for (let s of galleryStars) {
	    let tw = noise(s.twinkle + frameCount * 0.01);
	    let flicker = map(tw, 0, 1, 0.3, 1.2);
	    let size = s.baseSize * flicker;
	
	    fill(255, 200);
	    let sx = s.x * 0.08 + width / 2;
	    let sy = s.y * 0.08 + height / 2;
	    circle(sx, sy, size);
	  }

  // スクロール
  scrollY = lerp(scrollY, targetScrollY, 0.25);

  let y = topOffset + scrollY;

  let maxThumb = 160;
  let colCount = floor((width - outerPad * 2) / (maxThumb + gutter));
  colCount = constrain(colCount, 1, 5);

  let thumbSize = floor((width - outerPad * 2 - gutter * (colCount - 1)) / colCount);
  thumbSize = constrain(thumbSize, 60, maxThumb);

  // --- 月分類 ---
  let grouped = {};
  for (let i = 0; i < 12; i++) grouped[i] = [];

  for (let c of allConstellations) {
    let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) continue;
    grouped[int(m[2]) - 1].push(c);
  }

  let monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // 表示
  for (let month = 0; month < 12; month++) {
    let list = grouped[month];
    if (list.length === 0) continue;

    fill(255);
    textSize(26);
    textAlign(LEFT, TOP);
    text(monthNames[month], outerPad, y);
    y += 40;

    let index = 0;
    let rows = ceil(list.length / colCount);

    for (let cons of list) {
      let col = index % colCount;
      let row = floor(index / colCount);

      let x = outerPad + col * (thumbSize + gutter);
      let ty = y + row * (thumbSize + 35);

      push();
      translate(x, ty);

      stroke(150, 80);
      noFill();
      rect(0, 0, thumbSize, thumbSize, 12);

      if (!cons.thumbnail) {
        cons.thumbnail = generateThumbnail(cons, thumbSize);
      }
      image(cons.thumbnail, 0, 0, thumbSize, thumbSize);

      fill(240);
      textSize(10);
      textAlign(LEFT, TOP);
      text(cons.created, 0, thumbSize + 6);

      pop();

      index++;
    }

    y += rows * (thumbSize + 35) + 40;
  }

  // スクロール限界
  let minScroll = height - (y + 80);
  targetScrollY = constrain(targetScrollY, minScroll, 0);
  scrollY = constrain(scrollY, minScroll, 0);
}
	
function generateThumbnail(cons, size) {
	let pg = createGraphics(size, size);
	pg.background(5, 5, 20);

	let ax = radians(-30);
	let ay = radians(30);

	let projected = [];
	let minX = 9999, maxX = -9999;
	let minY = 9999, maxY = -9999;

	for (let s of cons.stars) {
		let p = projectPoint(s.pos, ax, ay, 300);
		projected.push(p);

		minX = min(minX, p.x);
		maxX = max(maxX, p.x);
		minY = min(minY, p.y);
		maxY = max(maxY, p.y);
	}

	let w = maxX - minX;
	let h = maxY - minY;
	let margin = 20;
	let scaleFactor = (size - margin) / max(w, h);

	pg.push();
	pg.translate(size / 2, size / 2);
	pg.scale(scaleFactor);

	pg.translate(- (minX + maxX) / 2, -(minY + maxY) / 2);

	// 線
	pg.stroke(180, 200, 255, 90);
	pg.strokeWeight(1 / scaleFactor);
	pg.noFill();

	for (let i = 0; i < cons.stars.length; i++) {
	    for (let j = i + 1; j < cons.stars.length; j++) {
	        let a = projected[i];
	        let b = projected[j];
	        pg.line(a.x, a.y, b.x, b.y);
	    }
	}

	// 星
	pg.noStroke();
	pg.fill(255, 240, 200, 230);
	for (let p of projected) {
	    pg.circle(p.x, p.y, 5 / scaleFactor);
	}
	
	pg.pop();
    return pg;
}

function projectPoint(pos, ax, ay, size) {
	  let x = pos.x;
	  let y = pos.y;
	  let z = pos.z;
	
	  let ry = y * cos(ax) - z * sin(ax);
	  let rz = y * sin(ax) + z * cos(ax);
	
	  let rx = x * cos(ay) - rz * sin(ay);
	  rz = x * sin(ay) + rz * cos(ay);
	
	  let px = rx;
	  let py = ry;
	
	  return createVector(px, py);
}

function drawDetailPage() {
	background(5, 5, 20);
    if (!selectedConstellation) return;

    let t = (millis() - zoomStartTime) * 0.002;
    let ease = min(1, t);
    let scaleAnim = 0.5 + ease * 0.7 + 0.04 * sin(frameCount * 0.05);

    push();
    translate(width/2, height/2);
    scale(scaleAnim);

	let ax = radians(-30);
	let ay = radians(30);

	let projected = selectedConstellation.stars.map(s => projectPoint(s.pos, ax, ay));

	let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
	for (let p of projected) {
	  minX = min(minX, p.x);
	  maxX = max(maxX, p.x);
	  minY = min(minY, p.y);
	  maxY = max(maxY, p.y);
	}
	
	let w = maxX - minX;
	let h = maxY - minY;
	
	let drawingSize = 240;
	let scaleFactor = drawingSize / max(w, h);
	
	translate(-(minX + maxX) / 2 * scaleFactor, -(minY + maxY) / 2 * scaleFactor);
	scale(scaleFactor);

	// 枠
	stroke(150, 80);
	strokeWeight(2);
	noFill();
	rectMode(CENTER);
	rect(0, 0, 300, 300, 16);
	let offsetX = -150;
	let offsetY = -150;

	// 星
    noStroke();
	fill(255, 255, 200, 230);
	for (let p of projected) {
	  circle(p.x, p.y, 12 / scaleFactor + random(-0.5, 0.5));
	}

    // 線
    stroke(180, 200, 255, 100);
	strokeWeight(2 / scaleFactor);
	for (let i = 0; i < projected.length; i++) {
	  for (let j = i + 1; j < projected.length; j++) {
	    line(projected[i].x, projected[i].y, projected[j].x, projected[j].y);
	  }
	}
	
	  pop();

	// 日付ラベル
	fill(255);
	textAlign(CENTER, TOP);
	textSize(20);
	text(selectedConstellation.created, width/2, 40);
}
