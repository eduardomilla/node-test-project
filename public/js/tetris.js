// Tetris Game by DrywallPro
document.addEventListener('DOMContentLoaded', () => {
    // Obtener elementos del DOM
    const canvas = document.getElementById('tetris');
    const nextPieceCanvas = document.getElementById('nextPiece');
    const ctx = canvas.getContext('2d');
    const nextPieceCtx = nextPieceCanvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const linesDisplay = document.getElementById('linesDisplay');
    const gameMessage = document.getElementById('gameMessage');
    const playButton = document.getElementById('playButton');
    const resetButton = document.getElementById('resetButton');
    
    // Configuración
    const scale = 20;
    const boardWidth = canvas.width / scale;
    const boardHeight = canvas.height / scale;
    let dropInterval = 1000;
    let lastTime = 0;
    let dropCounter = 0;
    let paused = true;
    let gameOver = false;
    let score = 0;
    let lines = 0;
    let level = 1;
    
    // Colores de las piezas
    const colors = [
        null,
        '#FF0D72', // T - Rosa
        '#0DC2FF', // I - Azul claro
        '#0DFF72', // O - Verde claro
        '#F538FF', // L - Magenta
        '#FF8E0D', // J - Naranja
        '#FFE138', // Z - Amarillo
        '#3877FF'  // S - Azul
    ];
    
    // Gradientes para los colores de las piezas
    const gradients = [];
    
    // Función para oscurecer/aclarar colores
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }
    
    // Inicializar gradientes
    function initGradients() {
        for (let i = 1; i < colors.length; i++) {
            const gradient = ctx.createLinearGradient(0, 0, scale, scale);
            gradient.addColorStop(0, colors[i]);
            gradient.addColorStop(1, shadeColor(colors[i], -30));
            gradients[i] = gradient;
        }
    }
    
    // Matriz para el tablero
    const board = createMatrix(boardWidth, boardHeight);
    
    // Variables de la pieza actual y siguiente
    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
        next: null
    };
    
    // Crear matriz vacía para el tablero
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }
    
    // Crear piezas de Tetris
    function createPiece(type) {
        switch(type) {
            case 'T':
                return [
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'L':
                return [
                    [0, 3, 0],
                    [0, 3, 0],
                    [0, 3, 3],
                ];
            case 'J':
                return [
                    [0, 4, 0],
                    [0, 4, 0],
                    [4, 4, 0],
                ];
            case 'I':
                return [
                    [0, 0, 0, 0],
                    [5, 5, 5, 5],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0],
                ];
        }
    }

    // Dibujar la matriz (pieza o tablero)
    function drawMatrix(matrix, offset, context, isGhost = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (isGhost) {
                        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    } else if (gradients[value]) {
                        context.fillStyle = gradients[value];
                    } else {
                        context.fillStyle = colors[value];
                    }
                    
                    context.strokeStyle = '#000';
                    context.lineWidth = 1;
                    
                    // Dibujar el bloque con un efecto 3D
                    context.fillRect(
                        (x + offset.x) * scale,
                        (y + offset.y) * scale,
                        scale,
                        scale
                    );
                    
                    // Bordes para efecto 3D
                    context.strokeRect(
                        (x + offset.x) * scale,
                        (y + offset.y) * scale,
                        scale,
                        scale
                    );
                    
                    // Sombra interna (parte superior-izquierda más clara)
                    if (!isGhost) {
                        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        context.fillRect(
                            (x + offset.x) * scale,
                            (y + offset.y) * scale,
                            scale / 3,
                            scale / 3
                        );
                    }
                }
            });
        });
    }
    
    // Dibujar la pieza fantasma que muestra dónde caerá la pieza
    function drawGhostPiece() {
        if (!player.matrix) return;
        
        const ghostPosition = {x: player.pos.x, y: player.pos.y};
        
        // Encontrar la posición más baja posible
        while (!collide(board, player.matrix, {x: ghostPosition.x, y: ghostPosition.y + 1})) {
            ghostPosition.y++;
        }
        
        // Solo dibujar si la pieza fantasma no está en la misma posición que la pieza actual
        if (ghostPosition.y > player.pos.y) {
            drawMatrix(player.matrix, ghostPosition, ctx, true);
        }
    }
    
    // Dibujar el tablero
    function draw() {
        // Limpiar canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar cuadrícula
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.5;
        
        // Líneas horizontales
        for (let i = 0; i <= boardHeight; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * scale);
            ctx.lineTo(canvas.width, i * scale);
            ctx.stroke();
        }
        
        // Líneas verticales
        for (let i = 0; i <= boardWidth; i++) {
            ctx.beginPath();
            ctx.moveTo(i * scale, 0);
            ctx.lineTo(i * scale, canvas.height);
            ctx.stroke();
        }
        
        // Dibujar el tablero
        drawMatrix(board, {x: 0, y: 0}, ctx);
        
        // Dibujar la pieza fantasma
        drawGhostPiece();
        
        // Dibujar la pieza actual
        if (player.matrix) {
            drawMatrix(player.matrix, player.pos, ctx);
        }
        
        // Dibujar la siguiente pieza
        drawNextPiece();
    }
    
    // Dibujar la próxima pieza
    function drawNextPiece() {
        // Limpiar el canvas de la próxima pieza
        nextPieceCtx.fillStyle = '#000';
        nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        if (player.next) {
            // Calcular el offset para centrar la pieza
            const offset = {
                x: (nextPieceCanvas.width / scale - player.next[0].length) / 2,
                y: (nextPieceCanvas.height / scale - player.next.length) / 2
            };
            
            // Dibujar la próxima pieza
            drawMatrix(player.next, offset, nextPieceCtx);
        }
    }
    
    // Verificar colisiones
    function collide(arena, matrix, pos) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0 &&
                   (arena[y + pos.y] &&
                    arena[y + pos.y][x + pos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Fusionar la pieza con el tablero
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Mover la pieza
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player.matrix, player.pos)) {
            player.pos.x -= dir;
        }
    }
    
    // Rotar la matriz de la pieza
    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }
    
    // Rotar la pieza del jugador
    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        while (collide(board, player.matrix, player.pos)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }
    
    // Caída de la pieza
    function playerDrop() {
        player.pos.y++;
        if (collide(board, player.matrix, player.pos)) {
            player.pos.y--;
            merge(board, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }
    
    // Dejar caer la pieza hasta el fondo
    function playerDropToBottom() {
        while (!collide(board, player.matrix, {x: player.pos.x, y: player.pos.y + 1})) {
            player.pos.y++;
        }
        playerDrop();
    }
    
    // Reiniciar la pieza
    function playerReset() {
        const pieces = 'TILOJSZ';
        
        // Usar la siguiente pieza si ya está definida
        if (player.next) {
            player.matrix = player.next;
        } else {
            player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        }
        
        // Generar la próxima pieza
        player.next = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        
        // Posición inicial
        player.pos.y = 0;
        player.pos.x = Math.floor((board[0].length - player.matrix[0].length) / 2);
        
        // Verificar game over
        if (collide(board, player.matrix, player.pos)) {
            gameOver = true;
            paused = true;
            gameMessage.style.display = 'flex';
            gameMessage.innerHTML = '<p>Game Over<br>Presiona Reiniciar para jugar de nuevo</p>';
            playButton.innerHTML = '<i class="fas fa-play me-2"></i>Jugar';
        }
    }
    
    // Eliminar líneas completas
    function arenaSweep() {
        let rowCount = 0;
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Eliminar la línea completa
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y; // Para no saltarse la fila que reemplaza
            
            rowCount++;
            
            // Animación para la línea completada
            // Puedes agregar efectos más elaborados aquí
        }
        
        // Actualizar líneas y niveles
        if (rowCount > 0) {
            lines += rowCount;
            linesDisplay.textContent = lines;
            linesDisplay.classList.add('score-update');
            setTimeout(() => {
                linesDisplay.classList.remove('score-update');
            }, 300);
            
            // Actualizar nivel cada 10 líneas
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                levelDisplay.textContent = level;
                levelDisplay.classList.add('score-update');
                setTimeout(() => {
                    levelDisplay.classList.remove('score-update');
                }, 300);
                
                // Aumentar velocidad
                dropInterval = 1000 - (level - 1) * 50;
                if (dropInterval < 100) dropInterval = 100;
            }
            
            // Puntuación por líneas completadas
            // 1 línea = 100 * nivel
            // 2 líneas = 300 * nivel
            // 3 líneas = 500 * nivel
            // 4 líneas = 800 * nivel (Tetris)
            const linePoints = [0, 100, 300, 500, 800];
            score += linePoints[rowCount] * level;
            
            updateScore();
        }
    }
    
    // Actualizar la puntuación
    function updateScore() {
        scoreDisplay.textContent = score;
        scoreDisplay.classList.add('score-update');
        setTimeout(() => {
            scoreDisplay.classList.remove('score-update');
        }, 300);
    }
    
    // Actualizar el estado del juego
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        if (!paused && !gameOver) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        }
        
        draw();
        requestAnimationFrame(update);
    }
    
    // Iniciar el juego
    function startGame() {
        if (gameOver) {
            // Reiniciar el juego
            resetGame();
        }
        
        paused = !paused;
        
        if (paused) {
            playButton.innerHTML = '<i class="fas fa-play me-2"></i>Jugar';
            gameMessage.style.display = 'flex';
            gameMessage.innerHTML = '<p>Juego pausado<br>Presiona Jugar para continuar</p>';
        } else {
            playButton.innerHTML = '<i class="fas fa-pause me-2"></i>Pausar';
            gameMessage.style.display = 'none';
        }
    }
    
    // Reiniciar el juego
    function resetGame() {
        // Limpiar tablero
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                board[y][x] = 0;
            }
        }
        
        // Reiniciar valores
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        paused = true;
        
        // Actualizar displays
        scoreDisplay.textContent = score;
        linesDisplay.textContent = lines;
        levelDisplay.textContent = level;
        
        // Crear nueva pieza
        playerReset();
        
        // Mostrar mensaje inicial
        gameMessage.style.display = 'flex';
        gameMessage.innerHTML = '<p>Presiona Jugar para comenzar</p>';
        playButton.innerHTML = '<i class="fas fa-play me-2"></i>Jugar';
    }
    
    // Controles del teclado
    document.addEventListener('keydown', (event) => {
        if (gameOver) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                if (!paused) playerMove(-1);
                break;
            case 'ArrowRight':
                if (!paused) playerMove(1);
                break;
            case 'ArrowDown':
                if (!paused) playerDrop();
                break;
            case 'ArrowUp':
                if (!paused) playerRotate(1);
                break;
            case ' ':
                if (!paused) playerDropToBottom();
                break;
            case 'p':
            case 'P':
                startGame();
                break;
        }
    });
    
    // Controles de botones
    playButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    
    // Inicialización
    initGradients();
    resetGame();
    update();

    // Mostrar instrucciones con animación
    setTimeout(() => {
        const instructionsList = document.querySelector('.game-instructions ul');
        if (instructionsList) {
            instructionsList.classList.add('visible');
        }
    }, 500);
    
    // Ajustar tamaño del juego para responsive
    function adjustGameSize() {
        const container = document.querySelector('.tetris-container');
        if (!container) return;
        
        if (window.innerWidth < 576) {
            const containerWidth = container.offsetWidth - 40;
            canvas.width = Math.min(240, containerWidth);
            canvas.height = canvas.width * (400/240);
            
            // Recalcular escala y dimensiones
            const newScale = canvas.width / boardWidth;
            // No cambiamos la escala interna para evitar problemas con la lógica del juego
        } else {
            canvas.width = 240;
            canvas.height = 400;
        }
        
        // Reinicializar gradientes después de cambiar el tamaño
        initGradients();
        draw();
    }
    
    window.addEventListener('resize', adjustGameSize);
    adjustGameSize();
}); 