const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const port = process.env.PORT || 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para procesar datos del formulario
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'Inicio',
        currentPage: 'inicio'
    });
});

app.get('/servicios', (req, res) => {
    res.render('servicios', {
        pageTitle: 'Nuestros Servicios',
        currentPage: 'servicios'
    });
});

app.get('/proyectos', (req, res) => {
    res.render('proyectos', {
        pageTitle: 'Proyectos',
        currentPage: 'proyectos'
    });
});

app.get('/tetris', (req, res) => {
    res.render('tetris', {
        pageTitle: 'Juega Tetris',
        currentPage: 'tetris',
        scripts: '<script src="/js/tetris.js"></script>'
    });
});

app.get('/nosotros', (req, res) => {
    res.render('nosotros', {
        pageTitle: 'Sobre Nosotros',
        currentPage: 'nosotros'
    });
});

app.get('/contacto', (req, res) => {
    res.render('contacto', {
        pageTitle: 'Contáctanos',
        currentPage: 'contacto',
        scripts: '<script src="/js/contact.js"></script>'
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render('404', {
        pageTitle: 'Página no encontrada',
        currentPage: ''
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 