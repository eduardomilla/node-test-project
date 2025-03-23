// Tetris Game by DrywallPro
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    
    // Escala para mejorar la resolución en dispositivos de alta densidad
    const scale = window.devicePixelRatio || 1;
    
    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE = 32; // Será ajustado dinámicamente
    
    // Función para redimensionar el canvas según el tamaño disponible
    const resizeCanvas = () => {
        const gameWrapper = document.querySelector('.game-wrapper');
        const availableWidth = gameWrapper.clientWidth * 0.8; // 80% del ancho disponible
        
        // Calcular el tamaño de bloque basado en el ancho disponible
        BLOCK_SIZE = Math.floor(availableWidth / COLS);
        
        // Actualizar dimensiones del canvas (manteniendo proporción 1:2)
        canvas.width = COLS * BLOCK_SIZE;
        canvas.height = ROWS * BLOCK_SIZE;
        
        // Configurar escala para dispositivos de alta densidad
        context.scale(scale, scale);
        context.canvas.width = canvas.width * scale;
        context.canvas.height = canvas.height * scale;
        
        // Aplicar estilos CSS
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        
        // Redibujar el juego con las nuevas dimensiones
        if (arena && player) {
            draw();
        }
    };
    
    // Escuchar eventos de redimensionamiento de ventana
    window.addEventListener('resize', resizeCanvas);
    
    // Colores de las piezas
    const COLORS = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
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
    
    let score = 0;
    let dropCounter = 0;
    let lastTime = 0;
    let dropInterval = 1000; // velocidad de caída (ms)
    
    // Crear matriz de juego
    const createMatrix = (w, h) => {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    };
    
    // Crear una pieza aleatoria
    const createPiece = (type = Math.floor(Math.random() * 7) + 1) => {
        return {
            pos: {x: Math.floor(COLS / 2) - 1, y: 0},
            matrix: SHAPES[type],
            color: COLORS[type]
        };
    };
    
    // Colisiones
    const collide = (arena, player) => {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    };
    
    // Combinar jugador con arena
    const merge = (arena, player) => {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    };
    
    // Rotar pieza
    const rotate = (matrix, dir) => {
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
    };
    
    // Buscar y eliminar filas completas
    const sweepRows = (arena) => {
        let rowCount = 0;
        
        outer: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;
            rowCount++;
        }
        
        if (rowCount > 0) {
            // Añadir puntos según el número de filas eliminadas
            score += rowCount * 100 * rowCount; // Bonificación por múltiples filas
            scoreElement.textContent = score;
            
            // Aumentar velocidad a medida que sube la puntuación
            dropInterval = Math.max(200, 1000 - Math.floor(score / 500) * 100);
        }
    };
    
    // Dibujar el tablero
    const drawMatrix = (matrix, offset) => {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = COLORS[value];
                    context.fillRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                    
                    // Borde para cada bloque
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.strokeRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                    
                    // Efecto 3D
                    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    context.fillRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE / 10,
                        BLOCK_SIZE
                    );
                    context.fillRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE / 10
                    );
                }
            });
        });
    };
    
    // Dibujar el juego
    const draw = () => {
        // Limpiar canvas con fondo negro
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar cuadrícula
        context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
        drawMatrix(player.matrix, player.pos);
    };
    
    // Mover pieza
    const playerMove = (dir) => {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    };
    
    // Caída de pieza
    const playerDrop = () => {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            sweepRows(arena);
        }
        dropCounter = 0;
    };
    
    // Rotación de pieza
    const playerRotate = (dir) => {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    };
    
    // Reiniciar el juego
    const playerReset = () => {
        player = createPiece();
        // Game over
        if (collide(arena, player)) {
            // Mostrar mensaje de Game Over
            alert('¡Game Over! Tu puntuación final: ' + score);
            
            // Reiniciar el juego
            arena.forEach(row => row.fill(0));
            score = 0;
            scoreElement.textContent = score;
            dropInterval = 1000;
        }
    };
    
    // Bucle principal del juego
    const update = (time = 0) => {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        requestAnimationFrame(update);
    };
    
    // Controles de teclado
    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            playerMove(-1);
        } else if (event.key === 'ArrowRight') {
            playerMove(1);
        } else if (event.key === 'ArrowDown') {
            playerDrop();
        } else if (event.key === 'ArrowUp') {
            playerRotate(1);
        }
    });
    
    // Controles de botones
    document.getElementById('left-btn').addEventListener('click', () => playerMove(-1));
    document.getElementById('right-btn').addEventListener('click', () => playerMove(1));
    document.getElementById('down-btn').addEventListener('click', () => playerDrop());
    document.getElementById('rotate-btn').addEventListener('click', () => playerRotate(1));
    
    // Botón de reinicio
    document.getElementById('restart-btn').addEventListener('click', () => {
        // Reiniciar el juego
        arena.forEach(row => row.fill(0));
        score = 0;
        scoreElement.textContent = score;
        dropInterval = 1000;
        playerReset();
    });
    
    // Inicializar variables
    const arena = createMatrix(COLS, ROWS);
    let player = createPiece();
    
    // Ejecutar redimensionamiento inicial
    resizeCanvas();
    
    // Efecto de animación al cargar
    setTimeout(() => {
        update();
    }, 500);
}); 