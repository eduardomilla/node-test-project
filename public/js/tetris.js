// Tetris Game by DrywallPro
document.addEventListener('DOMContentLoaded', () => {
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
    for (let i = 1; i < colors.length; i++) {
        const gradient = ctx.createLinearGradient(0, 0, scale, scale);
        gradient.addColorStop(0, colors[i]);
        gradient.addColorStop(1, shadeColor(colors[i], -30));
        gradients[i] = gradient;
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
    
    // Inicializar la primera pieza
    playerReset();
    
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
                    context.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.2)' : gradients[value];
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
        drawMatrix(player.matrix, player.pos, ctx);
        
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

    // Mezclar el array de piezas
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Bolsa de piezas para generar secuencia aleatoria
    let pieceBag = [];
    
    // Obtener la siguiente pieza
    function getNextPiece() {
        if (pieceBag.length === 0) {
            pieceBag = ['T', 'O', 'L', 'J', 'I', 'S', 'Z'];
            shuffleArray(pieceBag);
        }
        return pieceBag.pop();
    }
    
    // Reiniciar la posición del jugador
    function playerReset() {
        const pieces = 'TOLJIZSZ';
        
        if (!player.next) {
            player.next = createPiece(getNextPiece());
        }
        
        player.matrix = player.next;
        player.next = createPiece(getNextPiece());
        
        player.pos.y = 0;
        player.pos.x = Math.floor(board[0].length / 2) - 
                      Math.floor(player.matrix[0].length / 2);
        
        // Verificar si hay colisión inmediata (game over)
        if (collide(board, player.matrix, player.pos)) {
            gameOver = true;
            paused = true;
            updateGameMessage('¡Game Over!<br>Haz clic en Reiniciar para jugar de nuevo');
        }
    }
    
    // Actualizar el mensaje del juego
    function updateGameMessage(message) {
        gameMessage.innerHTML = `<p>${message}</p>`;
        gameMessage.style.display = 'flex';
    }
    
    // Verificar colisión
    function collide(board, matrix, pos) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0 &&
                   (board[y + pos.y] &&
                    board[y + pos.y][x + pos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Fusionar la pieza con el tablero
    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Rotar la matriz (pieza)
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
    
    // Animar la eliminación de líneas
    function animateClearLines(rows) {
        const animationFrames = 5;
        let currentFrame = 0;
        
        function animate() {
            if (currentFrame >= animationFrames) {
                // Terminamos la animación, procedemos a eliminar las líneas
                clearLines(rows);
                return;
            }
            
            // Dibujar el efecto
            ctx.save();
            
            // Efecto de flash
            const alpha = (currentFrame % 2 === 0) ? 0.8 : 0.2;
            
            rows.forEach(y => {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(0, y * scale, canvas.width, scale);
            });
            
            ctx.restore();
            
            // Próximo frame
            currentFrame++;
            setTimeout(animate, 100);
        }
        
        animate();
    }
    
    // Limpiar líneas completadas
    function checkLines() {
        let linesCleared = 0;
        let rowsToRemove = [];
        
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            
            rowsToRemove.push(y);
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            // Animación
            animateClearLines(rowsToRemove);
            
            // Actualizar puntuación
            const linePoints = [40, 100, 300, 1200]; // Puntos por 1, 2, 3 o 4 líneas
            score += linePoints[linesCleared - 1] * level;
            lines += linesCleared;
            
            // Actualizar nivel (cada 10 líneas)
            level = Math.floor(lines / 10) + 1;
            
            // Actualizar la velocidad de caída basada en el nivel
            dropInterval = Math.max(100, 1000 - (level - 1) * 50);
            
            // Actualizar displays
            updateScore();
        }
    }
    
    // Eliminar líneas completas
    function clearLines(rows) {
        rows.forEach(y => {
            board.splice(y, 1);
            board.unshift(new Array(boardWidth).fill(0));
        });
    }
    
    // Mover la pieza
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player.matrix, player.pos)) {
            player.pos.x -= dir;
        }
    }
    
    // Rotar la pieza
    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        // Verificar colisión después de rotar y ajustar si es necesario
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
    
    // Mover la pieza hacia abajo
    function playerDrop() {
        player.pos.y++;
        if (collide(board, player.matrix, player.pos)) {
            player.pos.y--;
            merge(board, player);
            playerReset();
            checkLines();
        }
        dropCounter = 0;
    }
    
    // Caída rápida
    function playerHardDrop() {
        while (!collide(board, player.matrix, {x: player.pos.x, y: player.pos.y + 1})) {
            player.pos.y++;
            score += 1; // Puntos por caída rápida
        }
        
        playerDrop();
        updateScore();
    }
    
    // Actualizar la puntuación en pantalla
    function updateScore() {
        scoreDisplay.textContent = score;
        linesDisplay.textContent = lines;
        levelDisplay.textContent = level;
        
        // Añadir clase de animación
        scoreDisplay.classList.add('score-update');
        
        // Eliminar la clase después de la animación
        setTimeout(() => {
            scoreDisplay.classList.remove('score-update');
        }, 300);
    }
    
    // Actualizar el juego
    function update(time = 0) {
        if (paused || gameOver) {
            requestAnimationFrame(update);
            return;
        }
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        requestAnimationFrame(update);
    }
    
    // Iniciar o pausar el juego
    function togglePause() {
        if (gameOver) return;
        
        paused = !paused;
        
        if (paused) {
            updateGameMessage('Juego en Pausa<br>Presiona Jugar para continuar');
        } else {
            gameMessage.style.display = 'none';
            lastTime = performance.now();
            update();
        }
        
        // Actualizar texto del botón
        playButton.innerHTML = paused ? 
            '<i class="fas fa-play me-2"></i>Jugar' : 
            '<i class="fas fa-pause me-2"></i>Pausar';
    }
    
    // Reiniciar el juego
    function resetGame() {
        // Limpiar el tablero
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                board[y][x] = 0;
            }
        }
        
        // Reiniciar variables
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        paused = true;
        
        // Actualizar displays
        updateScore();
        
        // Reiniciar pieza
        playerReset();
        
        // Mostrar mensaje
        updateGameMessage('Presiona Jugar para comenzar');
        
        // Actualizar botón
        playButton.innerHTML = '<i class="fas fa-play me-2"></i>Jugar';
        
        // Dibujar el tablero inicial
        draw();
    }
    
    // Event listeners para controles
    document.addEventListener('keydown', event => {
        if (paused && !gameOver && event.keyCode === 80) { // P
            togglePause();
            return;
        }
        
        if (paused || gameOver) return;
        
        switch(event.keyCode) {
            case 37: // Izquierda
                playerMove(-1);
                break;
            case 39: // Derecha
                playerMove(1);
                break;
            case 40: // Abajo
                playerDrop();
                break;
            case 38: // Arriba (Rotar)
                playerRotate(1);
                break;
            case 32: // Espacio (Caída rápida)
                playerHardDrop();
                break;
            case 80: // P (Pausar)
                togglePause();
                break;
        }
    });
    
    // Eventos de botones
    playButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
    
    // Eventos táctiles para dispositivos móviles
    let touchStartX = null;
    let touchStartY = null;
    
    canvas.addEventListener('touchstart', event => {
        if (paused || gameOver) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        event.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', event => {
        if (paused || gameOver) return;
        if (!touchStartX || !touchStartY) return;
        
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        const diffX = touchX - touchStartX;
        const diffY = touchY - touchStartY;
        
        // Detectar si el movimiento es horizontal o vertical
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Movimiento horizontal
            if (diffX > 10) { // Derecha
                playerMove(1);
                touchStartX = touchX;
            } else if (diffX < -10) { // Izquierda
                playerMove(-1);
                touchStartX = touchX;
            }
        } else {
            // Movimiento vertical
            if (diffY > 10) { // Abajo
                playerDrop();
                touchStartY = touchY;
            } else if (diffY < -10) { // Arriba (rotar)
                playerRotate(1);
                touchStartY = touchY;
            }
        }
        
        event.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', event => {
        touchStartX = null;
        touchStartY = null;
    });
    
    // Doble tap para caída rápida
    let lastTap = 0;
    canvas.addEventListener('touchend', event => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            playerHardDrop();
            event.preventDefault();
        }
        lastTap = currentTime;
    });
    
    // Iniciar juego
    resetGame();
    draw();
}); 