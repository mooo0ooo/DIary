let selectedP = null, selectedA = null, selectedD = null;
let padLayout = { cx:0, cy:0, btnSize:50, spacing:10, scl:1 };

function computeBtnSize() {
  let base = min(width, height);
  padLayout.btnSize = constrain(floor(min(width, height) * 0.09), 40, 78);
  padLayout.spacing = floor(padLayout.btnSize * 0.22);
}

function layoutDOMButtons(addButton, okButton, backButton) {
  let sidePad = max(8, floor(width * 0.03));
  let bottomPad = max(10, floor(height * 0.04));
  addButton.position(sidePad, height - 80 - bottomPad);
  okButton.position(width/2 - 40, height - 60 - bottomPad);
  backButton.position(sidePad, sidePad + 6);
}

function styleButton(btn) {
  btn.style("font-family", "'nicomoji'");
  btn.style("font-size", width < 600 ? "22px" : "18px");
  btn.style("padding", width < 600 ? "14px 20px" : "12px 18px");
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

function drawPADButtons() {

  computeBtnSize();

  const rows = 3;
  const cols = 7;

  const rawW = cols * (padLayout.btnSize + padLayout.spacing);
  const rawH = rows * (padLayout.btnSize + padLayout.spacing) + 200; // 120→200 に拡大

  padLayout.scl = min(
    (width * 0.9) / rawW,
    (height * 0.85) / rawH,
    1
  );

  push();
  translate(width / 2, height / 2);
  scale(padLayout.scl);

  padLayout.cx = 0;
  padLayout.cy = 0;

  const cx = padLayout.cx;
  const cy = padLayout.cy;

  // === P ===
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy - 160; 
    let col = lerpColor(color(255,150,0), color(0,100,255), i / 6);
    drawButton(x, y, padLayout.btnSize, col, i, selectedP === i, "rect");
  }

  // === A ===
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy;
    let col = lerpColor(color(255,220,0), color(0,0,100), i / 6);
    let sides = int(map(i, 0, 6, 3, 30));
    drawButton(x, y, padLayout.btnSize, col, i, selectedA === i, "polygon", sides);
  }

  // === D ===
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy + 160; 
    let col = color(200);
    let sides = int(map(i, 0, 6, 4, 30));
    drawButton(x, y, padLayout.btnSize, col, i, selectedD === i, "polygon", sides);
  }

  pop();
}

function drawButton(x,y,btnSize_,col,index,isSelected,shapeType,sides=4) {
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

  let body = color(constrain(red(col)+20,0,255), constrain(green(col)+20,0,255), constrain(blue(col)+20,0,255));
  noStroke(); fill(body);
  if (shapeType === "rect") {
    rectMode(CENTER); rect(0,0,btnSize_, btnSize_, 8);
  } else {
    polygon(0,0,btnSize_/2, sides);
  }
  pop();
}
