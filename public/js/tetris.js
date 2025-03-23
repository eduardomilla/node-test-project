// Tetris Game by DrywallPro
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const pausePlayBtn = document.getElementById('pause-play-btn');
    const restartBtn = document.getElementById('restart-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const downBtn = document.getElementById('down-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const hardDropBtn = document.getElementById('hard-drop-btn');
    
    // Configuración del juego
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const EMPTY_COLOR = '#111';
    const BORDER_COLOR = '#333';
    const BORDER_WIDTH = 2;
    
    // Colores de las piezas con gradientes
    const COLORS = [
        null,
        createGradient('#FF416C', '#FF4B2B'), // I - Rojo
        createGradient('#4776E6', '#8E54E9'), // J - Púrpura
        createGradient('#56CCF2', '#2F80ED'), // L - Azul
        createGradient('#38ef7d', '#11998e'), // O - Verde
        createGradient('#FF8008', '#FFC837'), // S - Naranja
        createGradient('#FC5C7D', '#6A82FB'), // T - Rosa
        createGradient('#FFAFBD', '#ffc3a0')  // Z - Melocotón
    ];
    
    // Crear gradientes para las piezas
    function createGradient(color1, color2) {
        return {
            color1: color1,
            color2: color2
        };
    }
    
    // Definiciones de las piezas (matrices)
    const PIECES = [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        [
            [4, 4],
            [4, 4]
        ],
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // Variables del juego
    let board = createBoard();
    let piece = null;
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropCounter = 0;
    let dropInterval = 1000; // Inicia con 1 segundo
    let lastTime = 0;
    let gameOver = false;
    let paused = true;
    let animatingLines = false;
    let linesToRemove = [];
    
    // Ajustar el tamaño del canvas para ser responsivo
    function resizeCanvas() {
        const gameWrapper = document.querySelector('.game-wrapper');
        const maxWidth = gameWrapper.clientWidth - 40; // Restar el padding
        const maxBlockSize = Math.floor(maxWidth / COLS);
        
        const newBlockSize = Math.min(BLOCK_SIZE, maxBlockSize);
        canvas.width = newBlockSize * COLS;
        canvas.height = newBlockSize * ROWS;
        
        // Actualizar el tamaño del bloque
        return newBlockSize;
    }
    
    let currentBlockSize = resizeCanvas();
    
    // Crear tablero inicial (matriz)
    function createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    // Inicializar el juego
    function initGame() {
        board = createBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        paused = true;
        updateScore();
        generatePiece();
        
        // Actualizar el botón de pausa/play
        updatePausePlayButton();
        
        // Iniciar la animación del juego
        requestAnimationFrame(update);
    }
    
    // Actualizar visualmente la puntuación, nivel y líneas
    function updateScore() {
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
    
    // Animar la puntuación cuando cambia
    function animateScore() {
        scoreElement.classList.add('score-flash');
        setTimeout(() => {
            scoreElement.classList.remove('score-flash');
        }, 500);
    }
    
    // Generar una nueva pieza
    function generatePiece() {
        if (nextPiece === null) {
            const pieceIndex = Math.floor(Math.random() * PIECES.length);
            nextPiece = {
                matrix: PIECES[pieceIndex],
                position: { x: Math.floor(COLS / 2) - Math.floor(PIECES[pieceIndex][0].length / 2), y: 0 }
            };
        }
        
        piece = nextPiece;
        
        // Generar la siguiente pieza
        const pieceIndex = Math.floor(Math.random() * PIECES.length);
        nextPiece = {
            matrix: PIECES[pieceIndex],
            position: { x: Math.floor(COLS / 2) - Math.floor(PIECES[pieceIndex][0].length / 2), y: 0 }
        };
        
        // Comprobar si el juego ha terminado
        if (collision(board, piece)) {
            gameOver = true;
            paused = true;
            updatePausePlayButton();
            
            // Animar game over
            animateGameOver();
        }
    }
    
    // Animación de Game Over
    function animateGameOver() {
        // Efecto visual de game over (hacer que el tablero parpadee)
        let flashes = 0;
        const flashInterval = setInterval(() => {
            ctx.fillStyle = flashes % 2 === 0 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashes++;
            
            if (flashes > 6) {
                clearInterval(flashInterval);
                drawBoard();
                drawText("GAME OVER", canvas.width / 2, canvas.height / 2);
                drawText("Presiona REINICIAR", canvas.width / 2, canvas.height / 2 + 40);
            }
        }, 200);
    }
    
    // Dibujar texto centrado
    function drawText(text, x, y) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    }
    
    // Comprobar colisiones
    function collision(board, piece) {
        const matrix = piece.matrix;
        const pos = piece.position;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0 &&
                    (board[y + pos.y] === undefined ||
                     board[y + pos.y][x + pos.x] === undefined ||
                     board[y + pos.y][x + pos.x] !== 0)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Mover la pieza
    function movePiece(direction) {
        if (paused || gameOver || animatingLines) return;
        
        piece.position.x += direction;
        
        if (collision(board, piece)) {
            piece.position.x -= direction;
        }
        
        drawBoard();
    }
    
    // Rotación de la pieza
    function rotatePiece() {
        if (paused || gameOver || animatingLines) return;
        
        const originalMatrix = piece.matrix;
        const originalPosition = { ...piece.position };
        
        // Hacer una copia profunda de la matriz
        const matrix = piece.matrix.map(row => [...row]);
        
        // Tamaño de la matriz
        const n = matrix.length;
        
        // Crear una nueva matriz para la rotación
        const rotated = Array.from({ length: n }, () => Array(n).fill(0));
        
        // Rotación de 90 grados
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                rotated[x][n - 1 - y] = matrix[y][x];
            }
        }
        
        // Actualizar la matriz de la pieza
        piece.matrix = rotated;
        
        // Comprobar colisiones después de la rotación
        if (collision(board, piece)) {
            // Intentar mover a la izquierda o derecha (wall kick)
            const wallKickOffsets = [-1, 1, -2, 2];
            
            let wallKickSuccess = false;
            
            for (const offset of wallKickOffsets) {
                piece.position.x += offset;
                
                if (!collision(board, piece)) {
                    wallKickSuccess = true;
                    break;
                }
                
                piece.position.x -= offset;
            }
            
            // Si no se puede colocar la pieza, revertir la rotación
            if (!wallKickSuccess) {
                piece.matrix = originalMatrix;
                piece.position = originalPosition;
            }
        }
        
        drawBoard();
    }
    
    // Bajar la pieza
    function dropPiece() {
        if (paused || gameOver || animatingLines) return;
        
        piece.position.y++;
        
        if (collision(board, piece)) {
            piece.position.y--;
            mergePiece();
            checkLines();
            generatePiece();
        }
        
        drawBoard();
    }
    
    // Caída rápida (hard drop)
    function hardDrop() {
        if (paused || gameOver || animatingLines) return;
        
        while (!collision(board, piece)) {
            piece.position.y++;
            score += 1; // Suma 1 punto por cada celda que baja
        }
        
        piece.position.y--;
        mergePiece();
        checkLines();
        generatePiece();
        updateScore();
        animateScore();
        drawBoard();
    }
    
    // Fusionar la pieza con el tablero
    function mergePiece() {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + piece.position.y][x + piece.position.x] = value;
                }
            });
        });
    }
    
    // Comprobar si hay líneas completas
    function checkLines() {
        linesToRemove = [];
        
        // Comprobar cada fila del tablero
        for (let y = ROWS - 1; y >= 0; y--) {
            let lineIsFull = true;
            
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] === 0) {
                    lineIsFull = false;
                    break;
                }
            }
            
            if (lineIsFull) {
                linesToRemove.push(y);
            }
        }
        
        // Si hay líneas para eliminar, iniciar la animación
        if (linesToRemove.length > 0) {
            animatingLines = true;
            animateLineRemoval();
        }
    }
    
    // Animar la eliminación de líneas
    function animateLineRemoval() {
        let flashCount = 0;
        const maxFlashes = 3;
        
        const flashInterval = setInterval(() => {
            flashCount++;
            drawBoard(flashCount % 2 === 0);
            
            if (flashCount >= maxFlashes * 2) {
                clearInterval(flashInterval);
                removeLines();
                animatingLines = false;
            }
        }, 100);
    }
    
    // Eliminar líneas completas
    function removeLines() {
        const linesRemoved = linesToRemove.length;
        
        // Eliminar cada línea
        linesToRemove.forEach(lineY => {
            board.splice(lineY, 1);
            board.unshift(Array(COLS).fill(0));
        });
        
        // Actualizar la puntuación según el número de líneas eliminadas
        let lineScore = 0;
        switch (linesRemoved) {
            case 1: lineScore = 100 * level; break;
            case 2: lineScore = 300 * level; break;
            case 3: lineScore = 500 * level; break;
            case 4: lineScore = 800 * level; break; // Tetris!
        }
        
        score += lineScore;
        lines += linesRemoved;
        
        // Aumentar el nivel cada 10 líneas
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100); // Acelerar la caída
        }
        
        updateScore();
        animateScore();
        drawBoard();
        
        // Limpiar las líneas a eliminar
        linesToRemove = [];
    }
    
    // Actualizar y manejar la lógica del juego
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        if (!paused && !gameOver && !animatingLines) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                dropPiece();
                dropCounter = 0;
            }
        }
        
        drawBoard();
        requestAnimationFrame(update);
    }
    
    // Dibujar un bloque con gradiente
    function drawBlock(x, y, color, size = currentBlockSize) {
        const gradient = ctx.createLinearGradient(
            x * size, 
            y * size, 
            x * size + size, 
            y * size + size
        );
        
        gradient.addColorStop(0, color.color1);
        gradient.addColorStop(1, color.color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x * size, y * size, size, size);
        
        // Borde más oscuro
        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = BORDER_WIDTH;
        ctx.strokeRect(x * size, y * size, size, size);
        
        // Brillo (esquina superior izquierda)
        ctx.beginPath();
        ctx.moveTo(x * size, y * size);
        ctx.lineTo(x * size + size, y * size);
        ctx.lineTo(x * size + size - size/4, y * size + size/4);
        ctx.lineTo(x * size + size/4, y * size + size/4);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
        
        // Sombra (esquina inferior derecha)
        ctx.beginPath();
        ctx.moveTo(x * size + size, y * size + size);
        ctx.lineTo(x * size, y * size + size);
        ctx.lineTo(x * size + size/4, y * size + size - size/4);
        ctx.lineTo(x * size + size - size/4, y * size + size - size/4);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fill();
    }
    
    // Dibujar el tablero y la pieza actual
    function drawBoard(flash = false) {
        // Limpiar el canvas
        ctx.fillStyle = EMPTY_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar el tablero
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] !== 0) {
                    // Verificar si esta línea debe parpadear (está siendo eliminada)
                    if (flash && linesToRemove.includes(y)) {
                        // Bloque blanco para efecto de flash
                        ctx.fillStyle = '#FFF';
                        ctx.fillRect(x * currentBlockSize, y * currentBlockSize, currentBlockSize, currentBlockSize);
                    } else {
                        // Dibujar el bloque normalmente
                        drawBlock(x, y, COLORS[board[y][x]]);
                    }
                }
            }
        }
        
        // Dibujar la pieza actual
        if (piece !== null && !gameOver) {
            piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        drawBlock(x + piece.position.x, y + piece.position.y, COLORS[value]);
                    }
                });
            });
            
            // Dibujar la sombra de la pieza (ghost piece)
            if (!paused && !animatingLines) {
                const ghostPiece = {
                    matrix: piece.matrix,
                    position: { x: piece.position.x, y: piece.position.y }
                };
                
                // Encontrar la posición más baja posible
                while (!collision(board, ghostPiece)) {
                    ghostPiece.position.y++;
                }
                
                // Retroceder una posición ya que la última colisiona
                ghostPiece.position.y--;
                
                // Solo dibujar si la pieza fantasma está por debajo de la pieza actual
                if (ghostPiece.position.y > piece.position.y) {
                    ghostPiece.matrix.forEach((row, y) => {
                        row.forEach((value, x) => {
                            if (value !== 0) {
                                // Dibujar un bloque transparente para la pieza fantasma
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.fillRect(
                                    (x + ghostPiece.position.x) * currentBlockSize, 
                                    (y + ghostPiece.position.y) * currentBlockSize, 
                                    currentBlockSize, 
                                    currentBlockSize
                                );
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                                ctx.lineWidth = 1;
                                ctx.strokeRect(
                                    (x + ghostPiece.position.x) * currentBlockSize, 
                                    (y + ghostPiece.position.y) * currentBlockSize, 
                                    currentBlockSize, 
                                    currentBlockSize
                                );
                            }
                        });
                    });
                }
            }
        }
        
        // Mensaje de pausa
        if (paused && !gameOver) {
            drawPausedOverlay();
        }
    }
    
    // Dibujar el overlay de pausa
    function drawPausedOverlay() {
        if (!gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Presiona PLAY para continuar', canvas.width / 2, canvas.height / 2 + 30);
        }
    }
    
    // Actualizar el botón de pausa/play
    function updatePausePlayButton() {
        if (paused) {
            pausePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            pausePlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    // Manejar eventos del ratón para los botones de control
    pausePlayBtn.addEventListener('click', () => {
        if (!gameOver) {
            paused = !paused;
            updatePausePlayButton();
            drawBoard();
        }
    });
    
    restartBtn.addEventListener('click', () => {
        initGame();
    });
    
    leftBtn.addEventListener('click', () => {
        movePiece(-1);
    });
    
    rightBtn.addEventListener('click', () => {
        movePiece(1);
    });
    
    downBtn.addEventListener('click', () => {
        dropPiece();
    });
    
    rotateBtn.addEventListener('click', () => {
        rotatePiece();
    });
    
    hardDropBtn.addEventListener('click', () => {
        hardDrop();
    });
    
    // Manejar eventos del teclado
    document.addEventListener('keydown', (e) => {
        if (gameOver) {
            // Solo permitir reiniciar si el juego ha terminado
            if (e.key === 'r' || e.key === 'R') {
                initGame();
            }
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
                movePiece(-1);
                break;
            case 'ArrowRight':
                movePiece(1);
                break;
            case 'ArrowDown':
                dropPiece();
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ':
                hardDrop();
                break;
            case 'p':
            case 'P':
                paused = !paused;
                updatePausePlayButton();
                drawBoard();
                break;
            case 'r':
            case 'R':
                initGame();
                break;
        }
    });
    
    // Manejar el redimensionamiento de la ventana
    window.addEventListener('resize', () => {
        currentBlockSize = resizeCanvas();
        drawBoard();
    });
    
    // Iniciar el juego
    initGame();
}); 