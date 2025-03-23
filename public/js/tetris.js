// Tetris Game by DrywallPro
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const restartBtn = document.getElementById('restart-btn');
    const pausePlayBtn = document.getElementById('pause-play-btn');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    
    // Variables de juego
    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE = 32; // Será ajustado dinámicamente
    let gameStarted = false;
    let gamePaused = false;
    let gameOver = false;
    let requestId = null;
    
    // Escala para mejorar la resolución en dispositivos de alta densidad
    const scale = window.devicePixelRatio || 1;
    
    // Función para redimensionar el canvas según el tamaño disponible
    const resizeCanvas = () => {
        const gameWrapper = document.querySelector('.game-wrapper');
        const availableWidth = gameWrapper.clientWidth * 0.9; // 90% del ancho disponible
        
        // Calcular el tamaño de bloque basado en el ancho disponible
        BLOCK_SIZE = Math.floor(availableWidth / COLS);
        
        // Actualizar dimensiones del canvas (manteniendo proporción 1:2)
        canvas.width = COLS * BLOCK_SIZE;
        canvas.height = ROWS * BLOCK_SIZE;
        
        // Configurar escala para dispositivos de alta densidad
        context.scale(1, 1); // Resetear escala
        context.canvas.width = canvas.width;
        context.canvas.height = canvas.height;
        
        // Aplicar estilos CSS
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        
        // Redibujar el juego con las nuevas dimensiones
        if (arena && player) {
            draw();
        }
    };
    
    // Colores de las piezas con gradientes más atractivos
    const COLORS = [
        null,
        ['#FF0D72', '#FF5E9B'], // I - Rosa
        ['#0DC2FF', '#66D9FF'], // J - Azul claro
        ['#0DFF72', '#66FFAA'], // L - Verde
        ['#F538FF', '#FA8FFF'], // O - Púrpura
        ['#FF8E0D', '#FFBC66'], // S - Naranja
        ['#FFE138', '#FFF394'], // T - Amarillo
        ['#3877FF', '#66A3FF']  // Z - Azul
    ];
    
    // Formas de las piezas
    const SHAPES = [
        null,
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
        [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                        // J
        [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                        // L
        [[0, 4, 4], [0, 4, 4], [0, 0, 0]],                        // O
        [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                        // S
        [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                        // T
        [[7, 7, 0], [0, 7, 7], [0, 0, 0]]                         // Z
    ];
    
    // Variables de estado
    let score = 0;
    let level = 1;
    let lines = 0;
    let dropCounter = 0;
    let lastTime = 0;
    let dropInterval = 1000; // velocidad de caída (ms)
    let arena = createMatrix(COLS, ROWS);
    let player = null;
    
    // Crear matriz de juego
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }
    
    // Crear una pieza aleatoria
    function createPiece(type = Math.floor(Math.random() * 7) + 1) {
        return {
            pos: {x: Math.floor(COLS / 2) - 1, y: 0},
            matrix: JSON.parse(JSON.stringify(SHAPES[type])),
            color: COLORS[type],
            type: type
        };
    }
    
    // Colisiones
    function collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] === undefined || 
                     arena[y + o.y][x + o.x] === undefined ||
                     arena[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Combinar jugador con arena
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Rotar pieza
    function rotate(matrix, dir) {
        // Hacer una copia profunda para evitar modificar el original
        const newMatrix = JSON.parse(JSON.stringify(matrix));
        
        for (let y = 0; y < newMatrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    newMatrix[x][y],
                    newMatrix[y][x],
                ] = [
                    newMatrix[y][x],
                    newMatrix[x][y],
                ];
            }
        }
        
        if (dir > 0) {
            newMatrix.forEach(row => row.reverse());
        } else {
            newMatrix.reverse();
        }
        
        return newMatrix;
    }
    
    // Buscar y eliminar filas completas con efectos visuales
    function sweepRows(arena) {
        let rowCount = 0;
        let completedRows = [];
        
        // Identificar filas completas
        outer: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }
            completedRows.push(y);
            rowCount++;
        }
        
        if (rowCount > 0) {
            // Efecto visual para filas completadas
            flashRows(completedRows, () => {
                // Eliminar filas después del efecto
                completedRows.forEach(y => {
                    arena.splice(y, 1);
                    arena.unshift(new Array(COLS).fill(0));
                });
                
                // Actualizar puntuación
                lines += rowCount;
                score += rowCount * 100 * Math.pow(2, rowCount - 1); // Bonificación por múltiples filas
                
                // Actualizar nivel cada 10 líneas
                level = Math.floor(lines / 10) + 1;
                
                // Aumentar velocidad según el nivel
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                
                // Actualizar interfaz
                scoreElement.textContent = score;
                levelElement.textContent = level;
                linesElement.textContent = lines;
                
                // Animación para la puntuación
                animateScore();
            });
        }
    }
    
    // Efecto de destello para filas completadas
    function flashRows(rows, callback) {
        let flashes = 3;
        let visible = false;
        
        const flashInterval = setInterval(() => {
            visible = !visible;
            rows.forEach(y => {
                for (let x = 0; x < COLS; x++) {
                    if (arena[y][x] !== 0) {
                        arena[y][x] = visible ? arena[y][x] : -1;
                    }
                }
            });
            
            draw();
            flashes--;
            
            if (flashes <= 0) {
                clearInterval(flashInterval);
                rows.forEach(y => {
                    for (let x = 0; x < COLS; x++) {
                        if (arena[y][x] === -1) {
                            arena[y][x] = 0;
                        }
                    }
                });
                if (callback) callback();
            }
        }, 100);
    }
    
    // Animación para la puntuación
    function animateScore() {
        const scoreDisplay = document.getElementById('score');
        scoreDisplay.classList.add('score-flash');
        setTimeout(() => {
            scoreDisplay.classList.remove('score-flash');
        }, 500);
    }
    
    // Dibujar el tablero con efectos mejorados
    function drawMatrix(matrix, offset, isPlayer = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const posX = (x + offset.x) * BLOCK_SIZE;
                    const posY = (y + offset.y) * BLOCK_SIZE;
                    
                    // Crear gradiente para cada bloque
                    const gradient = context.createLinearGradient(
                        posX, posY, 
                        posX + BLOCK_SIZE, posY + BLOCK_SIZE
                    );
                    
                    gradient.addColorStop(0, COLORS[value][0]);
                    gradient.addColorStop(1, COLORS[value][1]);
                    
                    // Dibujar con el gradiente
                    context.fillStyle = gradient;
                    context.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    // Borde para cada bloque
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.strokeRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    // Efecto 3D
                    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    context.fillRect(posX, posY, BLOCK_SIZE / 10, BLOCK_SIZE);
                    context.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE / 10);
                    
                    // Brillo central
                    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    context.beginPath();
                    context.arc(
                        posX + BLOCK_SIZE/2, 
                        posY + BLOCK_SIZE/2, 
                        BLOCK_SIZE/4, 
                        0, 
                        Math.PI * 2
                    );
                    context.fill();
                    
                    // Sombra para la pieza actual
                    if (isPlayer) {
                        context.shadowColor = COLORS[value][0];
                        context.shadowBlur = 10;
                    }
                } else if (value === -1) {
                    // Para el efecto de flash en filas completadas
                    context.fillStyle = 'white';
                    context.fillRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                }
            });
        });
        
        // Resetear sombras
        context.shadowBlur = 0;
    }
    
    // Dibujar previsualización de la caída
    function drawGhost() {
        // Crear una copia del jugador para simular la caída
        const ghost = {
            pos: {x: player.pos.x, y: player.pos.y},
            matrix: player.matrix,
            color: player.color
        };
        
        // Mover la pieza fantasma hacia abajo hasta que colisione
        while (!collide(arena, ghost)) {
            ghost.pos.y++;
        }
        
        // Retroceder una posición para mostrar dónde caerá la pieza
        ghost.pos.y--;
        
        // Dibujar la pieza fantasma con transparencia
        ghost.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    context.fillRect(
                        (x + ghost.pos.x) * BLOCK_SIZE,
                        (y + ghost.pos.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                    
                    // Borde para cada bloque fantasma
                    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    context.lineWidth = 1;
                    context.strokeRect(
                        (x + ghost.pos.x) * BLOCK_SIZE,
                        (y + ghost.pos.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                }
            });
        });
    }
    
    // Dibujar el juego
    function draw() {
        // Limpiar canvas con fondo negro
        context.fillStyle = 'rgb(15, 15, 25)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar cuadrícula
        context.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        context.lineWidth = 1;
        
        for (let x = 0; x <= COLS; x++) {
            context.beginPath();
            context.moveTo(x * BLOCK_SIZE, 0);
            context.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            context.stroke();
        }
        
        for (let y = 0; y <= ROWS; y++) {
            context.beginPath();
            context.moveTo(0, y * BLOCK_SIZE);
            context.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            context.stroke();
        }
        
        // Dibujar bloques
        drawMatrix(arena, {x: 0, y: 0});
        
        // Dibujar previsualización de caída si el juego está activo
        if (player && gameStarted && !gamePaused && !gameOver) {
            drawGhost();
        }
        
        // Dibujar pieza actual
        if (player) {
            drawMatrix(player.matrix, player.pos, true);
        }
        
        // Mostrar mensaje de inicio si no ha empezado el juego
        if (!gameStarted && !gameOver) {
            drawCenteredText('¡Presiona PLAY para comenzar!', canvas.height / 2 - 30);
        }
        
        // Mostrar mensaje de pausa
        if (gamePaused) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            drawCenteredText('PAUSA', canvas.height / 2 - 30);
            drawCenteredText('Presiona PLAY para continuar', canvas.height / 2 + 10, '20px Arial');
        }
        
        // Mostrar mensaje de Game Over
        if (gameOver) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            drawCenteredText('GAME OVER', canvas.height / 2 - 30);
            drawCenteredText(`Puntuación: ${score}`, canvas.height / 2 + 10, '20px Arial');
            drawCenteredText('Presiona REINICIAR para jugar de nuevo', canvas.height / 2 + 50, '16px Arial');
        }
    }
    
    // Dibujar texto centrado
    function drawCenteredText(text, y, font = '30px Arial') {
        context.font = font;
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, y);
    }
    
    // Mover pieza
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
            return false;
        }
        return true;
    }
    
    // Caída dura (espacio)
    function playerHardDrop() {
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        sweepRows(arena);
    }
    
    // Caída de pieza
    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            sweepRows(arena);
        }
        dropCounter = 0;
    }
    
    // Rotar pieza con ajuste de posición si colisiona
    function playerRotate(dir) {
        const originalPos = player.pos.x;
        const newMatrix = rotate(player.matrix, dir);
        
        // Guardar la matriz original
        const originalMatrix = player.matrix;
        
        // Probar la rotación
        player.matrix = newMatrix;
        
        // Si hay colisión, intentar ajustar la posición
        let offset = 1;
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1)); // 1, -2, 3, -4, ...
            
            // Si el desplazamiento es demasiado grande, revertir rotación
            if (offset > 5) {
                player.matrix = originalMatrix;
                player.pos.x = originalPos;
                return;
            }
        }
        
        // Sonido de rotación (se puede implementar más adelante)
    }
    
    // Crear nueva pieza o terminar juego
    function playerReset() {
        // Crear nueva pieza
        player = createPiece();
        
        // Verificar Game Over
        if (collide(arena, player)) {
            gameOver = true;
            gameStarted = false;
            cancelAnimationFrame(requestId);
            requestId = null;
            updatePausePlayButton();
            draw();
        }
    }
    
    // Actualizar estado del juego
    function update(time = 0) {
        if (gamePaused || gameOver) return;
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        requestId = requestAnimationFrame(update);
    }
    
    // Iniciar juego
    function startGame() {
        if (requestId) {
            cancelAnimationFrame(requestId);
        }
        
        // Resetear variables
        arena = createMatrix(COLS, ROWS);
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        lastTime = 0;
        
        // Actualizar interfaz
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        
        // Crear pieza inicial
        playerReset();
        
        // Actualizar estado
        gameStarted = true;
        gamePaused = false;
        gameOver = false;
        
        // Iniciar animación
        update();
        
        // Actualizar botón
        updatePausePlayButton();
    }
    
    // Pausar/reanudar juego
    function togglePause() {
        if (!gameStarted || gameOver) {
            startGame();
            return;
        }
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            cancelAnimationFrame(requestId);
            requestId = null;
            draw(); // Dibujar mensaje de pausa
        } else {
            lastTime = performance.now();
            requestId = requestAnimationFrame(update);
        }
        
        updatePausePlayButton();
    }
    
    // Actualizar icono del botón de pausa/play
    function updatePausePlayButton() {
        const icon = pausePlayBtn.querySelector('i');
        
        if (gamePaused || !gameStarted || gameOver) {
            icon.className = 'fas fa-play';
        } else {
            icon.className = 'fas fa-pause';
        }
    }
    
    // Inicializar el juego
    function init() {
        // Configurar el canvas
        resizeCanvas();
        
        // Crear arena y jugador inicial
        arena = createMatrix(COLS, ROWS);
        player = createPiece();
        
        // Dibujar estado inicial
        draw();
        
        // Configurar botones
        document.getElementById('left-btn').addEventListener('click', () => {
            if (gameStarted && !gamePaused && !gameOver) playerMove(-1);
            draw();
        });
        
        document.getElementById('right-btn').addEventListener('click', () => {
            if (gameStarted && !gamePaused && !gameOver) playerMove(1);
            draw();
        });
        
        document.getElementById('down-btn').addEventListener('click', () => {
            if (gameStarted && !gamePaused && !gameOver) playerDrop();
            draw();
        });
        
        document.getElementById('rotate-btn').addEventListener('click', () => {
            if (gameStarted && !gamePaused && !gameOver) playerRotate(1);
            draw();
        });
        
        document.getElementById('hard-drop-btn').addEventListener('click', () => {
            if (gameStarted && !gamePaused && !gameOver) playerHardDrop();
            draw();
        });
        
        pausePlayBtn.addEventListener('click', togglePause);
        
        restartBtn.addEventListener('click', startGame);
        
        // Controles de teclado
        document.addEventListener('keydown', event => {
            if (!gameStarted || gamePaused || gameOver) {
                if (event.key === 'Enter' || event.key === ' ') {
                    togglePause();
                }
                return;
            }
            
            switch (event.key) {
                case 'ArrowLeft':
                    playerMove(-1);
                    break;
                case 'ArrowRight':
                    playerMove(1);
                    break;
                case 'ArrowDown':
                    playerDrop();
                    break;
                case 'ArrowUp':
                    playerRotate(1);
                    break;
                case ' ':
                    playerHardDrop();
                    break;
                case 'p':
                    togglePause();
                    break;
            }
            
            draw();
        });
        
        // Eventos de redimensionamiento
        window.addEventListener('resize', resizeCanvas);
    }
    
    // Iniciar todo
    init();
}); 