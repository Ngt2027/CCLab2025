let faceMesh;
let video;
let faces = [];

let flowers = [];
let isSmiling = false;
let wasSmiling = false;
let emotion = "neutral";

let bgColor;
let targetColor;

let butterflies = [];
let wingAngle = 0;
let wingSpeed = 0.1;
let butterflyColor;
let particles = [];
let ashParticles = [];
let burstParticles = [];

let options = {
  maxFaces: 1,
  refineLandmarks: false,
  flipped: true
};

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  bgColor = color(100);
  targetColor = color(100);
  butterflyColor = color(100, 200, 255, 150);
  for (let i = 0; i < 2; i++) {
    butterflies.push({
      x: random(width),
      y: random(height),
      dx: random(-2, 2),
      dy: random(-2, 2)
    });
  }
}

function draw() {
  bgColor = lerpColor(bgColor, targetColor, 0.05);
  background(bgColor);

  // Mirror webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (faces.length > 0) {
    let face = faces[0];
    let keypoints = face.keypoints;

    let leftMouth = keypoints[61];
    let rightMouth = keypoints[291];
    let smileDist = dist(leftMouth.x, leftMouth.y, rightMouth.x, rightMouth.y);

    let topLip = keypoints[11];
    let bottomLip = keypoints[17];
    let mouthOpenDist = dist(topLip.x, topLip.y, bottomLip.x, bottomLip.y);

    let leftInnerBrow = keypoints[295];
    let rightInnerBrow = keypoints[65];
    let browFurrowDist = dist(leftInnerBrow.x, leftInnerBrow.y, rightInnerBrow.x, rightInnerBrow.y);

    let leftEyeTop = keypoints[386];
    let leftEyeBottom = keypoints[374];
    let rightEyeTop = keypoints[160];
    let rightEyeBottom = keypoints[144];
    let leftEyeHeight = dist(leftEyeTop.x, leftEyeTop.y, leftEyeBottom.x, leftEyeBottom.y);
    let rightEyeHeight = dist(rightEyeTop.x, rightEyeTop.y, rightEyeBottom.x, rightEyeBottom.y);
    let avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;

    // Emotion detection
    if (smileDist > 90) {
      emotion = "happy";
    } else if (mouthOpenDist > 40) {
      emotion = "surprised";
    } else if (browFurrowDist < 100) {
      emotion = "angry";
    } else if (avgEyeHeight < 10) {
      emotion = "sad";
    } else {
      emotion = "neutral";
    }

    isSmiling = emotion === "happy";

    if (isSmiling && !wasSmiling) {
      flowers = []; // Reset previous flowers

      // Calculate face bounding box
      let minX = width, maxX = 0, minY = height, maxY = 0;
      for (let pt of keypoints) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      let padding = 50;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;

      let attempts = 0;
      while (flowers.length < 3 && attempts < 50) {
        let fx = random(100, width - 100);
        let fy = random(100, height - 100);
        if (fx < minX || fx > maxX || fy < minY || fy > maxY) {
          flowers.push(new Flower(fx, fy));
        }
        attempts++;
      }

      targetColor = color(random(255), random(255), random(255));
    }

    wasSmiling = isSmiling;
    drawLandmarks(keypoints);
  }

  for (let flower of flowers) {
    flower.display();
  }

  // Angry emotion - Ash particles
  if (emotion === "angry" && frameCount % 3 === 0) {
    for (let i = 0; i < 3; i++) {
      ashParticles.push(new Ash());
    }
  }

  for (let i = ashParticles.length - 1; i >= 0; i--) {
    let a = ashParticles[i];
    a.update();
    a.display();
    if (a.isDead()) ashParticles.splice(i, 1);
  }

  // Surprised emotion - Burst particles
  if (emotion === "surprised" && frameCount % 5 === 0) {
    for (let i = 0; i < 10; i++) {
      burstParticles.push({
        x: random(width),
        y: random(height),
        vx: random(-3, 3),
        vy: random(-3, 3),
        r: random(5, 10),
        alpha: 255,
        color: color(random(200, 255), random(200, 255), random(255))
      });
    }
  }

  for (let i = burstParticles.length - 1; i >= 0; i--) {
    let p = burstParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 4;
    fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha);
    noStroke();
    ellipse(p.x, p.y, p.r);
    if (p.alpha <= 0) burstParticles.splice(i, 1);
  }

  if (emotion === "happy") {
    wingAngle += wingSpeed;
    moveButterflies();
    for (let b of butterflies) {
      drawButterfly(b.x, b.y);
    }

    if (frameCount % 5 === 0) {
      particles.push({
        x: random(width),
        y: random(height),
        r: random(5, 10),
        alpha: 255,
        color: color(random(200, 255), random(150, 255), random(200, 255))
      });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha);
      noStroke();
      ellipse(p.x, p.y, p.r);
      p.alpha -= 2;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Emotion Detected: " + emotion, 10, 10);
}

function gotFaces(results) {
  faces = results;
}

function drawLandmarks(keypoints) {
  push();
  fill('rgb(240,250,240)');
  noStroke();
  for (let i = 0; i < keypoints.length; i++) {
    circle(keypoints[i].x, keypoints[i].y, 4);
  }
  pop();
}

function moveButterflies() {
  for (let b of butterflies) {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < 0 || b.x > width) b.dx *= -1;
    if (b.y < 0 || b.y > height) b.dy *= -1;
  }
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
  ellipse(0, 0, 10, 20);
  drawAntennae();
  pop();
}

function drawAntennae() {
  stroke(50);
  line(-5, -10, -10, -20);
  line(5, -10, 10, -20);
}

class Ash {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3);
    this.alpha = random(100, 200);
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.2, 0.2);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.2;
  }

  display() {
    fill(80, this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

class Petal {
  constructor(x, y, color, mode = "fall") {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = random(10, 20);
    this.alpha = 255;
    this.mode = mode;

    if (mode === "fall") {
      this.vx = random(-0.5, 0.5);
      this.vy = random(1, 2);
    } else if (mode === "explode") {
      this.vx = random(-3, 3);
      this.vy = random(-3, 3);
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 3;
  }

  display() {
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size / 2);
  }

  offScreen() {
    return this.alpha <= 0 || this.y > height || this.x < 0 || this.x > width;
  }
}

class Flower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.petalColor = color(random(200, 255), random(100, 200), random(150, 255));
    this.centerColor = color(255, 204, 0);
    this.grayscale = color(100);
    this.petals = [];
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();

    let petalCol = (emotion === "happy") ? this.petalColor :
                   (emotion === "neutral" || emotion === "sad") ? this.grayscale :
                   (emotion === "angry") ? color(120) : this.petalColor;

    let centerCol = (emotion === "happy") ? this.centerColor :
                    (emotion === "neutral" || emotion === "sad") ? color(100) :
                    (emotion === "angry") ? color(80) : this.centerColor;

    fill(petalCol);
    for (let i = 0; i < 8; i++) {
      ellipse(20, 0, 30, 15);
      rotate(PI / 4);
    }

    fill(centerCol);
    ellipse(0, 0, 20);
    pop();

    if (emotion === "angry") {
      push();
      translate(this.x, this.y);
      for (let i = 0; i < 5; i++) {
        let flameX = random(-10, 10);
        let flameY = random(-50, -20);
        fill(random(200, 255), random(50, 100), 0, 150);
        ellipse(flameX, flameY, random(10, 20), random(20, 40));
      }
      pop();
    }

    if (emotion === "sad" && frameCount % 10 === 0) {
      this.petals.push(new Petal(this.x + random(-20, 20), this.y, this.petalColor, "fall"));
    }

    if (emotion === "surprised" && frameCount % 5 === 0) {
      for (let i = 0; i < 3; i++) {
        this.petals.push(new Petal(this.x, this.y, this.petalColor, "explode"));
      }
    }

    for (let i = this.petals.length - 1; i >= 0; i--) {
      let p = this.petals[i];
      p.update();
      p.display();
      if (p.offScreen()) {
        this.petals.splice(i, 1);
      }
    }
  }
}
