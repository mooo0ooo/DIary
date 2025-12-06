let selectedP = null, selectedA = null, selectedD = null;

let padLayout = {
  cx: 0,
  cy: 0,
  btnSize: 50,
  spacing: 10,
  scl: 1
};

// ボタンサイズ計算
function computeBtnSize() {
  padLayout.btnSize = constrain(floor(min(width, height) * 0.10), 40, 90);
  padLayout.spacing = floor(padLayout.btnSize * 0.25);
}

// DOM ボタンのスタイル
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
  btn.style("box-shadow",
    "0 8px 26px rgba(0,0,0,0.25), inset 0 0 18px rgba(255,255,255,0.2)"
  );
  btn.style("transition", "0.25s");
}

// PAD 描画
function drawPADButtons() {
  computeBtnSize();

  const rows = 3;
  const cols = 7;

  const rawW =
    padLayout.btnSize * 7 +
    padLayout.spacing * 6;

  const rawH =
    padLayout.btnSize * 3 +
    padLayout.spacing * 2 +
    320;

  padLayout.scl = min(
    (width * 0.75) / rawW,
    (height * 0.75) / rawH,
    1
  );

  push();
  scale(padLayout.scl);
  translate(width / (2 * padLayout.scl), height / (2 * padLayout.scl));

  const cx = 0;
  const cy = 0;
  const verticalSpacing = height * 0.2;
  
  // ----- P row -----
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy - 160;
    let col = lerpColor(color(255,150,0), color(0,100,255), i/6);
    drawButton(x, y, padLayout.btnSize, col, i, selectedP === i, "rect");
  }

  // ----- A row -----
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy;
    let col = lerpColor(color(255,220,0), color(0,0,100), i / 6);
    let sides = int(map(i, 0, 6, 3, 30));
    drawButton(x, y, padLayout.btnSize, col, i, selectedA === i, "polygon", sides);
  }

  // ----- D row -----
  for (let i = 0; i < 7; i++) {
    let x = cx + (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = cy + 160;
    let col = color(200);
    let sides = int(map(i, 0, 6, 4, 30));
    drawButton(x, y, padLayout.btnSize, col, i, selectedD === i, "polygon", sides);
  }

  pop();
}

function drawButton(x,y,btnSize,col,index,isSelected,shapeType,sides=4) {
  push();
  translate(x, y);

  // オーラ
  push();
  blendMode(ADD);
  noStroke();
  let auraAlpha = isSelected ? 100 : 40;
  let aura = color(red(col), green(col), blue(col), auraAlpha);
  fill(aura);
  ellipse(0, 0, btnSize * 2.2, btnSize * 2.2);
  pop();

  // 本体
  let body = color(
    constrain(red(col)+20,0,255),
    constrain(green(col)+20,0,255),
    constrain(blue(col)+20,0,255)
  );
  noStroke();
  fill(body);

  if (shapeType === "rect") {
    rectMode(CENTER);
    rect(0, 0, btnSize, btnSize, 8);
  } else {
    polygon(0, 0, btnSize/2, sides);
  }

  pop();
}
