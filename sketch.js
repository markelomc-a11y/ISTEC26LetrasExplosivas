// Letras Góticas — sketch.js
// Voz → letras flutuantes com tema gótico
// Efeitos: trilho / rastro + explosão ao clicar
// Adições: slider de gravidade, interação por teclado, layout responsivo

let recognition;
let listening = false;
let falling   = false;
let letters   = [];
let particles = [];

// Gravidade global (controlada por slider)
let gravityForce = 0.28;
let gravitySlider;

// Paleta de cores
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

  // Slider de gravidade (responsivo, posição atualizada no resize)
  gravitySlider = createSlider(0.1, 0.8, 0.28, 0.01);
  gravitySlider.style('width', '150px');
  gravitySlider.input(() => {
    gravityForce = gravitySlider.value();
  });

  // Inicializar reconhecimento de voz
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = false;
    recognition.lang           = 'pt-PT';

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const words = e.results[i][0].transcript.trim();
          for (let j = 0; j < words.length; j++) {
            const ch = words[j];
            if (ch !== ' ') letters.push(new Letter(ch));
          }
        }
      }
    };

    recognition.onend = () => {
      if (listening) recognition.start();
    };
  }

  updateControlsPosition();
}

// ── draw ─────────────────────────────────────────────────────────────────────
function draw() {
  // Fundo com fade suave (deixa rastro)
  noStroke();
  fill(10, 0, 7, 40);
  rect(0, 0, width, height);

  // Grade sutil
  stroke(80, 0, 20, 18);
  strokeWeight(0.5);
  for (let gy = 0; gy < height; gy += 22) line(0, gy, width, gy);
  for (let gx = 0; gx < width;  gx += 22) line(gx, 0, gx, height);

  // Partículas de explosão
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  // Letras
  for (let k = 0; k < letters.length; k++) {
    letters[k].update();
    letters[k].display();
  }

  // Interface gráfica (botões + textos responsivos)
  drawUI();
}

// ── interface responsiva ─────────────────────────────────────────────────────
function drawUI() {
  // Dimensões responsivas dos botões
  const btnH = 38;
  const btnY = 14;
  const maxBtnW = 150;
  const minBtnW = 100;
  const spacing = 10;
  let btnW = (width - 60) / 3 - spacing;
  btnW = constrain(btnW, minBtnW, maxBtnW);
  const startX = 20;

  const btns = [
    { label: listening ? '\u263D Sil\u00eancio' : '\u263D Invocar', active: listening },
    { label: falling   ? '\u2726 Flutuar'      : '\u2726 Cair',    active: falling },
    { label: '\u2620 Limpar', active: false }
  ];

  for (let i = 0; i < btns.length; i++) {
    const btn = btns[i];
    const x = startX + i * (btnW + spacing);
    // sombra
    noStroke();
    fill(0, 0, 0, 80);
    rect(x + 2, btnY + 2, btnW, btnH, 5);
    // fundo
    if (btn.active) fill(139, 0, 0);
    else fill(16, 2, 10);
    stroke(139, 0, 0);
    strokeWeight(1);
    rect(x, btnY, btnW, btnH, 5);
    // texto
    noStroke();
    fill(btn.active ? 245 : 192, btn.active ? 220 : 57, btn.active ? 224 : 43);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btn.label, x + btnW / 2, btnY + btnH / 2);
  }

  // Slider e label da gravidade
  const sliderY = btnY + btnH + 8;
  fill(16, 2, 10, 200);
  noStroke();
  rect(startX - 3, sliderY - 2, 210, 28, 4);
  fill(192, 57, 43);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`Gravidade: ${gravityForce.toFixed(2)}`, startX, sliderY + 12);
  // O slider HTML já está posicionado em updateControlsPosition()

  // Mensagem de estado (inferior)
  noStroke();
  fill(92, 26, 26, 190);
  textSize(11);
  textAlign(CENTER, BOTTOM);
  const msg = listening
    ? '~ a escutar os sussurros ~'
    : '~ fala para invocar as letras  ·  clica para destruir ~';
  text(msg, width / 2, height - 10);
}

// Atualiza posição do slider ao redimensionar
function updateControlsPosition() {
  if (!gravitySlider) return;
  const btnH = 38;
  const btnY = 14;
  const startX = 20;
  const sliderY = btnY + btnH + 8;
  gravitySlider.position(startX + 85, sliderY);
  gravitySlider.style('width', '120px');
}

// ── interação mouse (responsiva) ─────────────────────────────────────────────
function mousePressed() {
  // Verifica clique nos botões dinâmicos
  const btnH = 38;
  const btnY = 14;
  const spacing = 10;
  const maxBtnW = 150;
  const minBtnW = 100;
  let btnW = (width - 60) / 3 - spacing;
  btnW = constrain(btnW, minBtnW, maxBtnW);
  const startX = 20;

  // Botão Invocar (índice 0)
  let x = startX;
  if (mouseX > x && mouseX < x + btnW && mouseY > btnY && mouseY < btnY + btnH) {
    toggleMic();
    return;
  }
  // Botão Cair (índice 1)
  x = startX + (btnW + spacing);
  if (mouseX > x && mouseX < x + btnW && mouseY > btnY && mouseY < btnY + btnH) {
    toggleFall();
    return;
  }
  // Botão Limpar (índice 2)
  x = startX + 2 * (btnW + spacing);
  if (mouseX > x && mouseX < x + btnW && mouseY > btnY && mouseY < btnY + btnH) {
    clearAll();
    return;
  }

  // Clicar em letra → explodir
  let hit = false;
  for (let i = letters.length - 1; i >= 0; i--) {
    const l = letters[i];
    if (dist(mouseX, mouseY, l.x, l.y) < l.sz * 1.4) {
      spawnExplosion(l.x, l.y, l.col);
      letters.splice(i, 1);
      hit = true;
      break;
    }
  }

  // Clique em espaço vazio → faísca sutil
  if (!hit) {
    for (let j = 0; j < 5; j++) {
      particles.push(new Particle(mouseX, mouseY, color(139, 0, 0), '·', true));
    }
  }
}

// ── interação teclado (adicional) ───────────────────────────────────────────
function keyPressed() {
  switch (key.toLowerCase()) {
    case 'c': // limpar tudo
      clearAll();
      break;
    case 'f': // alternar cair/flutuar
      toggleFall();
      break;
    case 'm': // alternar microfone
      toggleMic();
      break;
    case 'l': // criar letra aleatória manualmente
      const randomChar = String.fromCharCode(65 + floor(random(26))); // A-Z
      letters.push(new Letter(randomChar));
      break;
    default: return;
  }
  // Evita comportamento padrão (ex: atalhos do navegador)
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateControlsPosition();
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
  for (let i = 0; i < letters.length; i++) {
    letters[i].setFalling(falling);
  }
}

function clearAll() {
  for (let i = 0; i < letters.length; i++) {
    spawnExplosion(letters[i].x, letters[i].y, letters[i].col);
  }
  letters = [];
}

function spawnExplosion(x, y, col) {
  for (let i = 0; i < 20; i++) {
    const ch = BURST_CHARS[floor(random(BURST_CHARS.length))];
    particles.push(new Particle(x, y, col, ch, false));
  }
}

function randomPaletteColor() {
  return color(PALETTE_HEX[floor(random(PALETTE_HEX.length))]);
}

// ── classe Letter (modificada: usa gravityForce global) ──────────────────────
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

  // Rastro (trail)
  if (this.tick % 2 === 0 && !this.grounded) {
    this.trail.push({ x: this.x, y: this.y, a: 0.5, sz: this.sz * 0.7, rot: this.rot });
    if (this.trail.length > 12) this.trail.shift();
  }
  for (let i = 0; i < this.trail.length; i++) {
    this.trail[i].a -= 0.04;
  }
  this.trail = this.trail.filter(t => t.a > 0);

  if (this.grounded) return;

  if (this.falling) {
    // usa a gravidade global controlada pelo slider
    this.vy += gravityForce;
    this.x  += this.vx * 0.3;
    this.y  += this.vy;
    this.rot += this.rotSpd * 1.5;
    if (this.y >= height - this.sz - 8) {
      this.y   = height - this.sz - 8;
      this.vy *= -0.22;
      this.vx *= 0.65;
      if (abs(this.vy) < 0.5) {
        this.vy = 0;
        this.vx = 0;
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
  const displaySz = this.sz * (1 + sin(this.pulse) * 0.045);

  // Trilho (rastro)
  for (let i = 0; i < this.trail.length; i++) {
    const t = this.trail[i];
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

  // Letra principal
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

// ── classe Particle (inalterada) ─────────────────────────────────────────────
function Particle(x, y, col, ch, subtle) {
  this.x   = x;
  this.y   = y;
  this.col = col;
  this.ch  = ch;
  const spd = subtle ? random(0.5, 1.5) : random(2, 5.5);
  const ang = random(TWO_PI);
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