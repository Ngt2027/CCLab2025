let faceMesh;
let video;
let faces = [];

let flower = null;
let isSmiling = false;
let wasSmiling = false;
let emotion = "neutral";

let bgColor;
let targetColor;

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

    // Happy
    let leftMouth = keypoints[61];
    let rightMouth = keypoints[291];
    let smileDist = dist(leftMouth.x, leftMouth.y, rightMouth.x, rightMouth.y);

    // Surprised
    let topLip = keypoints[11];
    let bottomLip = keypoints[17];
    let mouthOpenDist = dist(topLip.x, topLip.y, bottomLip.x, bottomLip.y);

    // Angry
    let leftInnerBrow = keypoints[295];
    let rightInnerBrow = keypoints[65];
    let browFurrowDist = dist(leftInnerBrow.x, leftInnerBrow.y, rightInnerBrow.x, rightInnerBrow.y);

    // Sad
    let leftEyeTop = keypoints[386];
    let leftEyeBottom = keypoints[374];
    let rightEyeTop = keypoints[160];
    let rightEyeBottom = keypoints[144];
    let leftEyeHeight = dist(leftEyeTop.x, leftEyeTop.y, leftEyeBottom.x, leftEyeBottom.y);
    let rightEyeHeight = dist(rightEyeTop.x, rightEyeTop.y, rightEyeBottom.x, rightEyeBottom.y);
    let avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
    
        // Log distances for debugging (moved to bottom)
    console.log("Smile Distance:", smileDist);
    console.log("Mouth Open Distance:", mouthOpenDist);
    console.log("Brow Furrow Distance:", browFurrowDist);
    console.log("Left Eye Height:", leftEyeHeight);
    console.log("Right Eye Height:", rightEyeHeight);
    console.log("Avg Eye Height:", avgEyeHeight);

    drawLandmarks(keypoints);


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
      flower = new Flower(random(100, width - 100), random(100, height - 100));
      targetColor = color(random(255), random(255), random(255));
    }

    wasSmiling = isSmiling;
    drawLandmarks(keypoints);
  }

  if (flower) {
    flower.display();
  }

  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Emotion: " + emotion, 10, 10);
}

function gotFaces(results) {
  faces = results;
}

function drawLandmarks(keypoints) {
  push();
  fill('lime');
  noStroke();
  for (let i = 0; i < keypoints.length; i++) {
    circle(keypoints[i].x, keypoints[i].y, 4);
  }
  pop();
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

// Flower class
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

    // Emotion-based colors
    let petalCol = (emotion === "happy") ? this.petalColor :
                   (emotion === "neutral" || emotion === "sad") ? this.grayscale :
                   (emotion === "angry") ? color(120) : this.petalColor;

    let centerCol = (emotion === "happy") ? this.centerColor :
                    (emotion === "neutral" || emotion === "sad") ? color(100) :
                    (emotion === "angry") ? color(80) : this.centerColor;

    // Draw petals
    fill(petalCol);
    for (let i = 0; i < 8; i++) {
      ellipse(20, 0, 30, 15);
      rotate(PI / 4);
    }
    fill(centerCol);
    ellipse(0, 0, 20);
    pop();

    // Angry:  fire
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

    // Sad: falling petals
    if (emotion === "sad" && frameCount % 10 === 0) {
      this.petals.push(new Petal(this.x + random(-20, 20), this.y, this.petalColor, "fall"));
    }

    // Surprised: exploding petals
    if (emotion === "surprised" && frameCount % 5 === 0) {
      for (let i = 0; i < 3; i++) {
        this.petals.push(new Petal(this.x, this.y, this.petalColor, "explode"));
      }
    }

    // Update and display petals
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
