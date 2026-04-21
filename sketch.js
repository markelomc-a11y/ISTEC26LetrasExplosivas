// Letras Góticas — sketch.js
// Voz → letras flutuantes com tema gótico
// Efeitos: trilho / rastro + explosão ao clicar

let recognition;
let listening = false;
let falling   = false;
let letters   = [];
let particles = [];

// Paleta: cores como strings hex, convertidas em p5.color no construtor
const PALETTE_HEX = [
  '#8b0000', '#c0392b', '#7b1fa2',
  '#4a148c', '#880e4f', '#b71c1c',
  '#d32f2f', '#9c27b0', '#6b0505'
];

const BURST_CHARS = ['✦', '·', '†', '✝', '☽', '★', '⁕', '⸸'];

// ── setup ────────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  textFont('UnifrakturMaguntia');

  // Inicializar reconhecimento de voz
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = false;
    recognition.lang           = 'pt-PT';

    recognition.onresult = function(e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          var words = e.results[i][0].transcript.trim();
          for (var j = 0; j < words.length; j++) {
            var ch = words[j];
            if (ch !== ' ') {
              letters.push(new Letter(ch));
            }
          }
        }
      }
    };

    recognition.onend = function() {
      if (listening) recognition.start();
    };
  }
}

// ── draw ─────────────────────────────────────────────────────────────────────
function draw() {
  // Fundo com fade suave (deixa rastro no fundo)
  noStroke();
  fill(10, 0, 7, 40);
  rect(0, 0, width, height);

  // Grade sutil
  stroke(80, 0, 20, 18);
  strokeWeight(0.5);
  for (var gy = 0; gy < height; gy += 22) line(0, gy, width, gy);
  for (var gx = 0; gx < width;  gx += 22) line(gx, 0, gx, height);

  // Partículas de explosão
  for (var i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  // Letras
  for (var k = 0; k < letters.length; k++) {
    letters[k].update();
    letters[k].display();
  }

  // Interface
  drawUI();
}

// ── interface ─────────────────────────────────────────────────────────────────
function drawUI() {
  var btns = [
    { x: 20,  w: 150, label: listening ? '\u263D Sil\u00eancio' : '\u263D Invocar',  active: listening },
    { x: 180, w: 150, label: falling   ? '\u2726 Flutuar'      : '\u2726 Cair',     active: falling   },
    { x: 340, w: 150, label: '\u2620 Limpar',                                        active: false     }
  ];

  for (var b = 0; b < btns.length; b++) {
    var btn = btns[b];
    var bh = 40, by = 14;

    // sombra
    noStroke();
    fill(0, 0, 0, 80);
    rect(btn.x + 2, by + 2, btn.w, bh, 5);

    // fundo
    if (btn.active) {
      fill(139, 0, 0);
    } else {
      fill(16, 2, 10);
    }
    stroke(139, 0, 0);
    strokeWeight(1);
    rect(btn.x, by, btn.w, bh, 5);

    // texto
    noStroke();
    if (btn.active) {
      fill(245, 220, 224);
    } else {
      fill(192, 57, 43);
    }
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x + btn.w / 2, by + bh / 2);
  }

  // Mensagem de estado em baixo
  noStroke();
  fill(92, 26, 26, 190);
  textSize(11);
  textAlign(CENTER, BOTTOM);
  var msg = listening
    ? '~ a escutar os suss\u00farros ~'
    : '~ fala para invocar as letras  \u00b7  clica para destruir ~';
  text(msg, width / 2, height - 10);
}

// ── interação ─────────────────────────────────────────────────────────────────
function mousePressed() {
  var bh = 40, by = 14;

  // Botão Invocar
  if (mouseX > 20 && mouseX < 170 && mouseY > by && mouseY < by + bh) {
    toggleMic();
    return;
  }
  // Botão Cair
  if (mouseX > 180 && mouseX < 330 && mouseY > by && mouseY < by + bh) {
    toggleFall();
    return;
  }
  // Botão Limpar
  if (mouseX > 340 && mouseX < 490 && mouseY > by && mouseY < by + bh) {
    clearAll();
    return;
  }

  // Clicar em letra → explodir
  var hit = false;
  for (var i = letters.length - 1; i >= 0; i--) {
    var l = letters[i];
    if (dist(mouseX, mouseY, l.x, l.y) < l.sz * 1.4) {
      spawnExplosion(l.x, l.y, l.col);
      letters.splice(i, 1);
      hit = true;
      break;
    }
  }

  // Clique em espaço vazio → faísca
  if (!hit) {
    for (var j = 0; j < 5; j++) {
      particles.push(new Particle(mouseX, mouseY, color(139, 0, 0), '·', true));
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ── helpers ───────────────────────────────────────────────────────────────────
function toggleMic() {
  if (!recognition) return;
  if (!listening) {
    recognition.start();
    listening = true;
  } else {
    recognition.stop();
    listening = false;
  }
}

function toggleFall() {
  falling = !falling;
  for (var i = 0; i < letters.length; i++) {
    letters[i].setFalling(falling);
  }
}

function clearAll() {
  for (var i = 0; i < letters.length; i++) {
    spawnExplosion(letters[i].x, letters[i].y, letters[i].col);
  }
  letters = [];
}

function spawnExplosion(x, y, col) {
  for (var i = 0; i < 20; i++) {
    var ch = BURST_CHARS[floor(random(BURST_CHARS.length))];
    particles.push(new Particle(x, y, col, ch, false));
  }
}

function randomPaletteColor() {
  return color(PALETTE_HEX[floor(random(PALETTE_HEX.length))]);
}

// ── classe Letter ─────────────────────────────────────────────────────────────
function Letter(ch) {
  this.ch       = ch;
  this.x        = random(30, width - 30);
  this.y        = random(70, height - 50);
  this.vx       = random(-1.2, 1.2);
  this.vy       = random(-1.2, 1.2);
  this.col      = randomPaletteColor();
  this.sz       = random(18, 38);
  this.falling  = false;
  this.grounded = false;
  this.gravity  = 0.28;
  this.rot      = 0;
  this.rotSpd   = random(-0.025, 0.025);
  this.pulse    = random(TWO_PI);
  this.trail    = [];
  this.tick     = 0;
}

Letter.prototype.setFalling = function(f) {
  if (this.grounded) return;
  this.falling = f;
  if (!f) {
    this.vy = random(-1.2, 1.2);
    this.vx = random(-1.2, 1.2);
    this.grounded = false;
  }
};

Letter.prototype.update = function() {
  this.pulse += 0.035;
  this.tick++;

  // Adicionar ponto ao trilho a cada 2 frames
  if (this.tick % 2 === 0 && !this.grounded) {
    this.trail.push({ x: this.x, y: this.y, a: 0.5, sz: this.sz * 0.7, rot: this.rot });
    if (this.trail.length > 12) this.trail.shift();
  }
  for (var i = 0; i < this.trail.length; i++) {
    this.trail[i].a -= 0.04;
  }
  // limpar pontos mortos
  var alive = [];
  for (var j = 0; j < this.trail.length; j++) {
    if (this.trail[j].a > 0) alive.push(this.trail[j]);
  }
  this.trail = alive;

  if (this.grounded) return;

  if (this.falling) {
    this.vy += this.gravity;
    this.x  += this.vx * 0.3;
    this.y  += this.vy;
    this.rot += this.rotSpd * 1.5;
    if (this.y >= height - this.sz - 8) {
      this.y   = height - this.sz - 8;
      this.vy *= -0.22;
      this.vx *= 0.65;
      if (abs(this.vy) < 0.5) {
        this.vy = 0; this.vx = 0;
        this.grounded = true;
      }
    }
  } else {
    this.x  += this.vx;
    this.y  += this.vy;
    this.rot += this.rotSpd;
    if (this.x < 14 || this.x > width  - 14) this.vx *= -1;
    if (this.y < 58 || this.y > height - 14) this.vy *= -1;
  }
};

Letter.prototype.display = function() {
  var displaySz = this.sz * (1 + sin(this.pulse) * 0.045);

  // Trilho
  for (var i = 0; i < this.trail.length; i++) {
    var t = this.trail[i];
    push();
    translate(t.x, t.y);
    rotate(t.rot);
    noStroke();
    this.col.setAlpha(t.a * 255);
    fill(this.col);
    textSize(t.sz);
    textAlign(CENTER, CENTER);
    text(this.ch, 0, 0);
    pop();
  }
  this.col.setAlpha(255);

  // Sombra
  push();
  translate(this.x + 2, this.y + 2);
  rotate(this.rot);
  noStroke();
  fill(0, 0, 0, 90);
  textSize(displaySz);
  textAlign(CENTER, CENTER);
  text(this.ch, 0, 0);
  pop();

  // Letra
  push();
  translate(this.x, this.y);
  rotate(this.rot);
  noStroke();
  fill(this.col);
  textSize(displaySz);
  textAlign(CENTER, CENTER);
  text(this.ch, 0, 0);
  pop();
};

// ── classe Particle ───────────────────────────────────────────────────────────
function Particle(x, y, col, ch, subtle) {
  this.x   = x;
  this.y   = y;
  this.col = col;
  this.ch  = ch;
  var spd  = subtle ? random(0.5, 1.5) : random(2, 5.5);
  var ang  = random(TWO_PI);
  this.vx  = cos(ang) * spd;
  this.vy  = sin(ang) * spd - (subtle ? 0 : 1);
  this.life = 1;
  this.sz  = subtle ? random(8, 14) : random(12, 26);
  this.rot = random(TWO_PI);
  this.rotSpd = random(-0.08, 0.08);
}

Particle.prototype.update = function() {
  this.x    += this.vx;
  this.y    += this.vy;
  this.vy   += 0.09;
  this.vx   *= 0.97;
  this.life -= 0.028;
  this.sz   *= 0.975;
  this.rot  += this.rotSpd;
};

Particle.prototype.display = function() {
  if (this.life <= 0) return;
  push();
  translate(this.x, this.y);
  rotate(this.rot);
  noStroke();
  this.col.setAlpha(this.life * 220);
  fill(this.col);
  textSize(this.sz);
  textAlign(CENTER, CENTER);
  text(this.ch, 0, 0);
  pop();
};

Particle.prototype.isDead = function() {
  return this.life <= 0;
};
