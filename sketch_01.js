// Letras Góticas — sketch_01.js
// Versão simples: microfone → transcrição de texto em estilo gótico

let recognition;
let transcript = '';
let listening  = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('UnifrakturMaguntia');
  textWrap(WORD);

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'pt-PT';

    recognition.onresult = function(e) {
      transcript = '';
      for (var i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + ' ';
      }
    };
  }
}

function draw() {
  background(10, 0, 7);

  // Grade sutil
  stroke(80, 0, 20, 22);
  strokeWeight(0.5);
  for (var y = 0; y < height; y += 22) line(0, y, width, y);
  for (var x = 0; x < width;  x += 22) line(x, 0, x, height);

  // Botão
  var bw = 160, bh = 40, bx = 20, by = 16;
  noStroke();
  fill(0, 0, 0, 70);
  rect(bx + 2, by + 2, bw, bh, 5);
  if (listening) { fill(139, 0, 0); } else { fill(16, 2, 10); }
  stroke(139, 0, 0);
  strokeWeight(1);
  rect(bx, by, bw, bh, 5);
  noStroke();
  if (listening) { fill(245, 220, 224); } else { fill(192, 57, 43); }
  textSize(15);
  textAlign(CENTER, CENTER);
  text(listening ? '\u263D Sil\u00eancio' : '\u263D Escutar', bx + bw / 2, by + bh / 2);

  // Transcrição
  noStroke();
  fill(192, 57, 43);
  textAlign(LEFT, TOP);
  textSize(22);
  text(transcript, 20, 80, width - 40, height - 110);

  // Rodapé
  fill(92, 26, 26, 180);
  textSize(11);
  textAlign(CENTER, BOTTOM);
  text('~ as palavras tomam forma ~', width / 2, height - 10);
}

function mousePressed() {
  if (!recognition) return;
  var bw = 160, bh = 40, bx = 20, by = 16;
  if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
    if (!listening) {
      recognition.start();
      listening = true;
    } else {
      recognition.stop();
      listening = false;
      transcript = '';
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
