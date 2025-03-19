/*
Template for IMA's Creative Coding Lab 

Project A: Generative Creatures
CCLaboratories Biodiversity Atlas 
*/

let x1, y1, x2, y2;
let z1, w1, z2, w2;
let radius1, radius2;
let wingAngle = 0;
let wingSpeed = 0.1;
let butterflyColor;
let trails = [];
let sparkleTrails = [];
let angle = 0;
let s = 100;
let n = 0;
let flowerColors = [];
let buffer = 50;
let boundaryOffset = 50; // Allow butterfly to fly past the boundary
let pollen = [];
let sparkleMode = false;

function setup() {
  let canvas=createCanvas(800, 500);
  canvas.parent("p5-canvas-container");
  x1 = width / 2;
  y1 = height / 2;
  x2 = width / 2;
  y2 = height / 2;
  z1 = random(-2, 2);
  w1 = random(-2, 2);
  z2 = random(-2, 2);
  w2 = random(-2, 2);
  radius1 = random(20, 100);
  radius2 = random(20, 100);
  butterflyColor = color(100, 200, 255, 150);
  n = random(width);
  generateFlowerColors();
}

function draw() {
  background(240, 240, 220);
  drawFlowers();
  moveButterflies();
  checkBounds();
  drawTrails();
  drawSparkleTrails();
  wingAngle += wingSpeed;
  drawButterfly(x1, y1);
  drawButterfly(x2, y2);
  drawPollen();
  eatPollen();
}

function moveButterflies() {
  if (pollen.length > 0) {
    let target = pollen[0];
    let angle1 = atan2(target.y - y1, target.x - x1);
    let angle2 = atan2(target.y - y2, target.x - x2);
    x1 += cos(angle1) * 2;
    y1 += sin(angle1) * 2;
    x2 += cos(angle2) * 2;
    y2 += sin(angle2) * 2;
  } else {
    x1 += z1;
    y1 += w1;
    x2 += z2;
    y2 += w2;
  }
  if (sparkleMode) {
    sparkleTrails.push({ x: x1, y: y1, alpha: 255 });
    sparkleTrails.push({ x: x2, y: y2, alpha: 255 });
  }
}

function checkBounds() {
  if (x1 > width + boundaryOffset) x1 = -boundaryOffset;
  if (x1 < -boundaryOffset) x1 = width + boundaryOffset;
  if (y1 > height + boundaryOffset) y1 = -boundaryOffset;
  if (y1 < -boundaryOffset) y1 = height + boundaryOffset;
  
  if (x2 > width + boundaryOffset) x2 = -boundaryOffset;
  if (x2 < -boundaryOffset) x2 = width + boundaryOffset;
  if (y2 > height + boundaryOffset) y2 = -boundaryOffset;
  if (y2 < -boundaryOffset) y2 = height + boundaryOffset;
}

function drawButterfly(x, y) {
  push();
  translate(x, y);
  noStroke();
  fill(butterflyColor);
  let wingOffset = sin(wingAngle) * 10;
  ellipse(-15, -15 - wingOffset, 30, 60);
  ellipse(15, -15 - wingOffset, 30, 60);
  ellipse(-15, 15 + wingOffset, 30, 60);
  ellipse(15, 15 + wingOffset, 30, 60);
  fill(butterflyColor);
  ellipse(0, 0, 10, 20);
  drawAntennae();
  pop();
}

function drawAntennae() {
  stroke(50);
  line(-5, -10, -10, -20);
  line(5, -10, 10, -20);
}

//if key is pressed the trails will appear
function drawTrails() {
  for (let i = 0; i < trails.length; i++) {
    let t = trails[i];
    fill(t.r, t.g, t.b, 50);
    stroke(50);
    ellipse(t.x, t.y, 5, 5);
  }
}

function drawSparkleTrails() {
  for (let i = sparkleTrails.length - 1; i >= 0; i--) {
    let s = sparkleTrails[i];
    fill(255, 215, 0, s.alpha);
    noStroke();
    ellipse(s.x, s.y, 5, 5);
    s.alpha -= 5;
    if (s.alpha <= 0) {
      sparkleTrails.splice(i, 1);
    }
  }
}

function generateFlowerColors() {
  for (let i = 0; i < width / s; i++) {
    flowerColors[i] = [];
    for (let j = 0; j < height / s; j++) {
      flowerColors[i][j] = color(random(200, 255), random(100, 180), random(150, 220), random(80, 180));
    }
  }
}

function drawFlowers() {
  noStroke();
  for (let i = 0; i < width; i += s) {
    for (let j = 0; j < height; j += s) {
      let d = dist(mouseX, mouseY, i, j);
      let f = map(d, 0, sqrt(width * width + height * height), 0.5, 1.5);
      push();
      translate(i, j);
      if ((i + j) % n < 100) {
        fill(flowerColors[i / s][j / s]);
        drawPetalShape(0, 0, s * f * 0.8, 12);
      }
      pop();
    }
  }
}

function drawPetalShape(x, y, size, points) {
  beginShape();
  for (let i = 0; i < points; i++) {
    let angle = map(i, 0, points, 0, TWO_PI);
    let x2 = x + cos(angle) * size;
    let y2 = y + sin(angle) * size;
    curveVertex(x2, y2);
  }
  endShape(CLOSE);
}

function mousePressed() {
  butterflyColor = color(random(100, 255), random(100, 255), random(100, 255), 150);
  pollen.push({ x: mouseX, y: mouseY, size: 8 });
}

function keyPressed() {
  sparkleMode = !sparkleMode;
}

function drawPollen() {
  fill(255, 204, 0);
  noStroke();
  for (let p of pollen) {
    ellipse(p.x, p.y, p.size);
  }
}

function eatPollen() {
  pollen = pollen.filter(p => dist(x1, y1, p.x, p.y) > 10 && dist(x2, y2, p.x, p.y) > 10);
}


