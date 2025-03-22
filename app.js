const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 