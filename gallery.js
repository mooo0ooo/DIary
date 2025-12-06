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

function drawGallery2D(constellations) {
  push();
  translate(-width/2, -height/2);
  
  // 背景の暗いグラデーション
  let gradient = drawingContext.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, color(5, 5, 30, 200));
  gradient.addColorStop(1, color(0, 0, 20, 200));
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
  
  // スクロール位置を更新
  scrollY += (targetScrollY - scrollY) * 0.1;
  
  // 月ごとにグループ化
  let grouped = {};
  let monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", 
                   "7月", "8月", "9月", "10月", "11月", "12月"];
  
  for (let i = 0; i < 12; i++) {
    grouped[i] = [];
  }
  
  for (let c of constellations) {
    let m = c.created ? c.created.match(/(\d+)\.\s*(\d+)\.\s*(\d+)/) : null;
    if (m) {
      let month = parseInt(m[2]) - 1;
      grouped[month].push(c);
    }
  }
  
  // ギャラリー描画
  let yPos = galleryTopOffset + scrollY;
  let thumbSize = min(150, (width - 60) / 3);
  let gap = 20;
  
  // 月ごとに表示
  for (let month = 0; month < 12; month++) {
    let monthData = grouped[month];
    if (monthData.length === 0) continue;
    
    // 月の見出し
    fill(255);
    textSize(24);
    textAlign(LEFT, 'top');
    text(monthNames[month] + "の記録", 30, yPos);
    yPos += 40;
    
    // サムネイルを描画
    let xPos = 30;
    let itemsPerRow = floor((width - 60) / (thumbSize + gap));
    itemsPerRow = max(1, min(4, itemsPerRow));
    
    for (let i = 0; i < monthData.length; i++) {
      let item = monthData[i];
      let row = floor(i / itemsPerRow);
      let col = i % itemsPerRow;
      
      let x = xPos + col * (thumbSize + gap);
      let y = yPos + row * (thumbSize + 40);
      
      // サムネイルの背景
      fill(20, 20, 40, 200);
      stroke(80, 80, 120, 100);
      strokeWeight(1);
      rect(x, y, thumbSize, thumbSize, 8);
      
      // 星座を描画
      if (item.stars && item.stars.length > 0) {
        push();
        translate(x + thumbSize/2, y + thumbSize/2);
        let scale = thumbSize * 0.4;
        
        // 星を描画
        for (let star of item.stars) {
          let x = (star.pos?.x || 0) * scale;
          let y = (star.pos?.y || 0) * scale;
          let z = (star.pos?.z || 0) * 0.5;
          let size = map(z, -100, 100, 1, 3, true);
          
          fill(255, 255, 200);
          noStroke();
          ellipse(x, y, size * 2);
        }
        
        // 線で結ぶ
        if (item.stars.length > 1) {
          stroke(100, 180, 255, 150);
          strokeWeight(1.5);
          noFill();
          beginShape();
          for (let star of item.stars) {
            let x = (star.pos?.x || 0) * scale;
            let y = (star.pos?.y || 0) * scale;
            vertex(x, y);
          }
          endShape();
        }
        pop();
      }
      
      // 日付を表示
      if (item.created) {
        fill(180);
        textSize(12);
        textAlign(CENTER, 'top');
        text(item.created, x + thumbSize/2, y + thumbSize + 5);
      }
    }
    
    // 次の月の位置を計算
    let rows = ceil(monthData.length / itemsPerRow);
    yPos += rows * (thumbSize + 40) + 30;
  }
  
  // スクロール範囲を制限
  galleryMinScroll = min(galleryMinScroll, height - yPos - 100);
  targetScrollY = constrain(targetScrollY, galleryMinScroll, 0);
  scrollY = constrain(scrollY, galleryMinScroll, 0);
  
  pop();
}
