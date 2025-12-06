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
  const minDimension = min(width, height);
  if (minDimension < 600) {
    // スマホ向け
    padLayout.btnSize = min(60, max(40, minDimension * 0.12));
  } else {
    // タブレット・デスクトップ向け
    padLayout.btnSize = min(90, max(60, minDimension * 0.08));
  }
  padLayout.spacing = padLayout.btnSize * 0.3;
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
  const padding = 20;

  const verticalSpacing = min(height * 0.18, width * 0.15);

  padLayout.cx = width/2;
  padLayout.cy = height/2;

  // スケールを計算（画面サイズに応じて調整）
  const maxWidth = (padLayout.btnSize * cols) + (padLayout.spacing * (cols - 1));
  const maxHeight = (padLayout.btnSize * rows) + (verticalSpacing * 2);

  padLayout.scl = min(
    (width - padding * 2) / maxWidth,
    (height - padding * 2) / maxHeight,
    1
  );

  push();
  translate(padLayout.cx, padLayout.cy);
  scale(padLayout.scl);
  
  // ----- P -----
  for (let i = 0; i < 7; i++) {
    let x = (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = -verticalSpacing;
    let col = lerpColor(color(255,150,0), color(0,100,255), i/6);
    drawButton(x, y, padLayout.btnSize, col, i, selectedP === i, "rect");
  }

  // ----- A -----
  for (let i = 0; i < 7; i++) {
    let x = (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = 0;
    let col = lerpColor(color(255,220,0), color(0,0,100), i / 6);
    let sides = int(map(i, 0, 6, 3, 30));
    drawButton(x, y, padLayout.btnSize, col, i, selectedA === i, "polygon", sides);
  }

  // ----- D -----
  for (let i = 0; i < 7; i++) {
    let x = (i - 3) * (padLayout.btnSize + padLayout.spacing);
    let y = verticalSpacing;
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
