# DrywallPro - Sitio Web Empresarial

Un sitio web profesional para una empresa de instalación y reparación de drywall, desarrollado con Node.js y Express.

## Características

- Diseño responsivo adaptado para dispositivos móviles y de escritorio
- Múltiples páginas: inicio, servicios, proyectos, nosotros, contacto
- Juego de Tetris integrado como elemento interactivo para los visitantes
- Formulario de contacto
- Animaciones y efectos visuales para mejorar la experiencia del usuario

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express
- **Motor de plantillas**: EJS
- **Iconos**: Font Awesome
- **Animaciones**: Animate.css, AOS (Animate On Scroll)

## Requisitos

- Node.js (v14 o superior)
- npm (v6 o superior)

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/tuusuario/drywallpro.git
   cd drywallpro
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Inicia el servidor:
   ```
   npm start
   ```

4. Abre tu navegador y visita:
   ```
   http://localhost:3000
   ```

## Estructura del Proyecto

```
drywallpro/
├── app.js                  # Punto de entrada
├── package.json            # Dependencias y scripts
├── public/                 # Archivos estáticos
│   ├── css/                # Hojas de estilo
│   ├── js/                 # JavaScript del cliente
│   └── images/             # Imágenes
├── views/                  # Plantillas EJS
│   ├── layout.ejs          # Plantilla principal
│   ├── index.ejs           # Página de inicio
│   ├── servicios.ejs       # Página de servicios
│   ├── proyectos.ejs       # Página de proyectos
│   ├── nosotros.ejs        # Página sobre nosotros
│   ├── contacto.ejs        # Página de contacto
│   ├── tetris.ejs          # Página del juego de Tetris
│   └── 404.ejs             # Página de error 404
└── README.md               # Este archivo
```

## Personalización

Para personalizar el sitio web para tu empresa:

1. Modifica las imágenes en la carpeta `public/images/` 
2. Actualiza los textos en las plantillas EJS
3. Ajusta los colores y estilos en `public/css/styles.css`
4. Actualiza la información de contacto en `views/contacto.ejs`

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Créditos

- Imágenes: [Unsplash](https://unsplash.com/)
- Iconos: [Font Awesome](https://fontawesome.com/)
- Juego de Tetris: Adaptado para este proyecto 