let outerPad = 20, gutter = 12, topOffset = 40;

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

  let w = max(1e-6, maxX - minX), h = max(1e-6, maxY - minY);
  let margin = size * 0.12;
  let scaleFactor = (size - margin*2) / max(w,h);

  pg.push();
  pg.translate(size/2, size/2);
  pg.scale(scaleFactor);
  pg.translate(- (minX + maxX)/2, - (minY + maxY)/2);

  pg.stroke(180,200,255,90);
  pg.strokeWeight(1/scaleFactor);
  pg.noFill();

  for (let i = 0; i < projected.length; i++) {
    let dists = [];
    for (let j = 0; j < projected.length; j++) {
      if (i === j) continue;
      let dx = projected[i].x - projected[j].x;
      let dy = projected[i].y - projected[j].y;
      dists.push({ idx: j, d: dx*dx + dy*dy });
    }
    dists.sort((a,b) => a.d - b.d);
    for (let n = 0; n < min(2, dists.length); n++) {
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

function drawGallery2D(allConstellations, galleryButton) {
  if (galleryStars.length === 0) {
    for (let i = 0; i < 400; i++) {
      galleryStars.push({
        x: random(-2000,2000),
        y: random(-2000,2000),
        z: random(-2000,2000),
        twinkle: random(1000),
        baseSize: random(1,4)
      });
    }
  }

  background(5,5,20);

  for (let s of galleryStars) {
    let tw = noise(s.twinkle + frameCount*0.01);
    let size = s.baseSize * map(tw, 0, 1, 0.3, 1.2);
    fill(255,200);
    circle(s.x * 0.08 + width/2, s.y * 0.08 + height/2, size);
  }

  // スクロール
  scrollY = lerp(scrollY, targetScrollY, 0.25);
  let y = topOffset + scrollY;

  let maxThumb = 180;
  let minThumb = 60;
  let colCount = 1;
  for (let c = 4; c >= 1; c--) {
    let possibleSize = (width - outerPad * 2 - gutter * (c - 1) / c;
    if (possibleSize >= minThumb) {
      colCount = c;
      break;
    }
  }

  let thumbSize = (width - outerPad * 2 - gutter * (colCount - 1)) / colCount;
  thumbSize = constrain(thumbSize, minThumb, maxThumb);

  // 月ごとに分類
  let grouped = {};
  for (let i = 0; i < 12; i++) grouped[i] = [];
  for (let c of allConstellations) {
    let m = c.created.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) continue;
    grouped[int(m[2]) - 1].push(c);
  }

  let monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  let contentBottom = 0;

  for (let month = 0; month < 12; month++) {
    let list = grouped[month];
    if (list.length === 0) continue;

    fill(255); textSize(26); textAlign(LEFT, TOP);
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
      stroke(150,80); noFill();
      rect(0,0,thumbSize,thumbSize,12);

      if (!cons.thumbnail) cons.thumbnail = generateThumbnail(cons, thumbSize);
      image(cons.thumbnail, 0, 0, thumbSize, thumbSize);

      fill(240); textSize(10); textAlign(LEFT, TOP);
      text(cons.created, 0, thumbSize + 6);
      pop();

      index++;
    }

    y += rows * (thumbSize + 35) + 40;
    contentBottom = y;
  }

  let minScroll = height - (contentBottom + 60);
  targetScrollY = constrain(targetScrollY, minScroll, 0);
  scrollY     = constrain(scrollY,     minScroll, 0);
}
