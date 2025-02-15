// テトリスガイドライン https://tetris.fandom.com/wiki/Tetris_Guideline

// 乱数生成
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// テトロミノの中から重複しないように乱数を生成し、順番待ちListへ投入
// https://tetris.fandom.com/wiki/Random_Generator
function generateSequence() {
  const sequence = Object.keys(tetrominos);
  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

// 順番待ちListから次のテトロミノを取得する
function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const nextMinoName = tetrominoSequence.pop();
  const matrix = tetrominos[nextMinoName];

  // スタート列数の設定: I型とO型は中央配置でスタート、それ以外は1マス左寄せ
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  // スタート行数の設定: I型であれば21行目からスタート、それ以外は22行目からスタート
  const row = nextMinoName === "I" ? -1 : -2;

  return {
    name: nextMinoName, // テトロミノブロックの名前
    matrix: matrix, // 現在の2次元配列の状態
    row: row, // 現在の行数
    col: col, // 現在の列数
  };
}

function getAfterNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }
  const afterNextMinoName = tetrominoSequence.slice(-1)[0];
  const matrix = tetrominos[afterNextMinoName];

  return {
    name: afterNextMinoName, // テトロミノブロックの名前
    matrix: matrix, // 現在の2次元配列の状態
    row: 1,
    col: 1,
  };
}

// テトロミノを描画する
function drawTetromino(tetromino, ctx) {
  if (tetromino.name in colors) {
    ctx.fillStyle = colors[tetromino.name];
  } else {
    ctx.fillStyle = defaultColor;
  }
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        ctx.fillRect(
          (tetromino.col + col) * grid,
          (tetromino.row + row) * grid,
          grid - 1,
          grid - 1
        );
      }
    }
  }
}

// fieldを描画
function drawField(ctx, field, r, c) {
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      if (field[row][col]) {
        const name = field[row][col];
        if (name in colors) {
          ctx.fillStyle = colors[name];
        } else {
          ctx.fillStyle = defaultColor;
        }
        // 指定したgrid分を乗算して描画
        ctx.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }
}

// 90度時計回りに回転
// https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) => row.map((col, j) => matrix[N - j][i]));
  return result;
}

// テトロミノが動かせるかどうかを確認
function canMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // 枠線外に出ているかを判定
        (cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          playfield[cellRow + row][cellCol + col])
      ) {
        return false;
      }
    }
  }
  return true;
}

// テトロミノが積まれた時の関数
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        // ゲームオーバーかどうかを確認
        // tetromino.rowが現在のy軸のポジション値となるので、枠外のポジションにあるとマイナスの値を取る
        if (tetromino.row + row < 0) {
          return showGameOver();
        }

        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  // 下から上に向かって揃ったラインを確認する
  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every((cell) => cell)) {
      lineCount++; // 消されたライン数のカウント
      // 消されたラインより上を下にずらす
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r - 1][c];
        }
      }
    } else {
      row--;
    }
  }

  calculateScore(lineCount);
  tetromino = getNextTetromino();
  nextmino = getAfterNextTetromino();
}

// 消されたライン数に応じてスコアを乗算
function calculateScore(c) {
  scoreResult = c * 100;
  // スコア情報を更新
  document.getElementById("score-count").innerHTML = scoreResult;
}

// 設置しているCanvasをクリア
function clearCanvas() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
}

// ゲームオーバー画面を表示
function showGameOver() {
  cancelAnimationFrame(rAF);
  isGameOver = true;
  bgm.pause();
  bgm.currentTime = 0;
  document.getElementById("stop-button").disabled = true; // STOP非活性

  gameCtx.fillStyle = "black";
  gameCtx.globalAlpha = 0.75;
  gameCtx.fillRect(0, gameCanvas.height / 2 - 30, gameCanvas.width, 60);
  gameCtx.globalAlpha = 1;
  gameCtx.fillStyle = "white";
  gameCtx.font = "36px monospace";
  gameCtx.textAlign = "center";
  gameCtx.textBaseline = "middle";
  gameCtx.fillText("GAME OVER!", gameCanvas.width / 2, gameCanvas.height / 2);
}

// gameCanvasの初期化
const gameCanvas = document.getElementById("game");
const gameCtx = gameCanvas.getContext("2d");
// nextCanvasの初期化
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const grid = 32;
const tetrominoSequence = [];
const defaultColor = "white";

// gameCanvasに描画されるplayfieldを設定
// いくつかのテトリミノは画面外をスタート位置にしているので、画面外(row = -2)も描画
const playfield = [];
for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}
// nextfieldを描画
const nextfield = [];
for (let row = 0; row < 5; row++) {
  nextfield[row] = [];
  for (let col = 0; col < 5; col++) {
    nextfield[row][col] = 0;
  }
}

// テトロミノを二次元配列で設定
// https://tetris.fandom.com/wiki/SRS
const tetrominos = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// テトロミノの色を設定
const colors = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  Z: "red",
  J: "blue",
  L: "orange",
};

let dropCount = 0;
let tetromino = getNextTetromino();
let nextmino = getAfterNextTetromino();
let rAF = null;
let isGameOver = false;
let isPause = false;
let lineCount = 0; // 消したライン合計数
let scoreResult = 0; // スコアの合計数
let bgm = new Audio(
  "https://drive.google.com/uc?id=1oiDiUZIGqQVO4YAuzZzSYcTwjOTVJW9L"
);
bgm.volume = 0.1; // 音量を裁定まで下げる

// ゲームオーバーまでループ
function loop() {
  rAF = requestAnimationFrame(loop);
  clearCanvas();

  // draw the playfield
  drawField(gameCtx, playfield, 20, 10);
  // draw the nextfield
  drawField(nextCtx, nextfield, 5, 6);

  if (tetromino) {
    // テトロミノを35フレームで落下させる
    if (++dropCount >= 35) {
      tetromino.row++;
      dropCount = 0;

      // テトロミノが設置された(動かなくなった)とき
      if (!canMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    // テトロミノの描画(playfieldとnextfieldそれぞれに)
    drawTetromino(nextmino, nextCtx);
    drawTetromino(tetromino, gameCtx);
  }
}

// キーボード入力イベントのリッスン
document.addEventListener("keydown", function (e) {
  // ゲームオーバーとpause時はkeydown event無効
  if (isGameOver) return;
  if (isPause) return;

  switch (e.which) {
    // 左、右キー (移動)
    case 37:
    case 39: {
      const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
      if (canMove(tetromino.matrix, tetromino.row, col)) {
        tetromino.col = col;
      }
      break;
    }

    case 32: {
      // スペースキー(回転)
      const matrix = rotate(tetromino.matrix);
      if (canMove(matrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = matrix;
      }
      break;
    }

    case 40: {
      // 下キー(落下)
      const row = tetromino.row + 1;
      if (!canMove(tetromino.matrix, row, tetromino.col)) {
        tetromino.row = row - 1;
        placeTetromino();
        return;
      }
      tetromino.row = row;
      break;
    }

    case 38: {
      // 上キー(ハードドロップ)
      while (canMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
        tetromino.row++;
      }
      break;
    }
  }
});

// STOPボタン押下時の動作
document.getElementById("stop-button").onclick = function () {
  document.getElementById("start-button").disabled = false; // START活性
  document.getElementById("stop-button").disabled = true; // STOP非活性
  isPause = true;
  bgm.pause();
  cancelAnimationFrame(rAF);

  gameCtx.fillStyle = "yellow";
  gameCtx.globalAlpha = 0.2;
  gameCtx.fillRect(0, gameCanvas.height / 2 - 30, gameCanvas.width, 60);
  gameCtx.globalAlpha = 1;
  gameCtx.fillStyle = "white";
  gameCtx.font = "36px monospace";
  gameCtx.textAlign = "center";
  gameCtx.textBaseline = "middle";
  gameCtx.fillText("PAUSE", gameCanvas.width / 2, gameCanvas.height / 2);
};

// STARTボタン押下時の動作
document.getElementById("start-button").onclick = function () {
  document.getElementById("start-button").disabled = true; // START非活性
  document.getElementById("stop-button").disabled = false; // STOP活性
  isPause = false;
  rAF = requestAnimationFrame(loop);
  // bgmを流す
  bgm.play();
};

// REFRESHボタン押下時の動作
document.getElementById("refresh-button").onclick = function () {
  clearCanvas();
  cancelAnimationFrame(rAF);
  bgm.pause();
  bgm.currentTime = 0;
  isPause = false;
  isGameOver = false;
  lineCount = 0;
  scoreResult = 0;
  calculateScore(lineCount);
  document.getElementById("start-button").disabled = false; // START活性
  document.getElementById("stop-button").disabled = true; // START非活性

  // playfield 0うめ
  for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }
  for (let row = 0; row < 5; row++) {
    nextfield[row] = [];
    for (let col = 0; col < 5; col++) {
      nextfield[row][col] = 0;
    }
  }

  // テトロミノ初期化
  tetromino = getNextTetromino();
  nextmino = getAfterNextTetromino();
};
