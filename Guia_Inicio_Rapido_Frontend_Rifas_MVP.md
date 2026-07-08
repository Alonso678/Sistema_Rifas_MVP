# 🚀 Guía de Inicio Rápido: Frontend del Sistema de Rifas MVP

Esta guía te ayudará a configurar el entorno de **React + Tailwind CSS** utilizando **Vite** como empaquetador para garantizar la máxima velocidad de desarrollo.

## 📋 Requisitos Previos

Asegúrate de tener instalado **Node.js** en tu computadora (se recomienda la versión LTS más reciente). Puedes comprobarlo corriendo en tu terminal:

```bash
node -v
npm -v
```

## 🛠️ Paso 1: Crear el Proyecto con Vite

Abre la terminal en la carpeta donde desees colocar tu proyecto Frontend (fuera de la carpeta de Spring Boot para mantener los repositorios limpios) y ejecuta:

```bash
# 1. Crear la estructura base usando la plantilla de React
npm create vite@latest frontend-rifas -- --template react

# 2. Entrar a la carpeta recién creada
cd frontend-rifas

# 3. Instalar las dependencias iniciales de Node
npm install
```

## 🎨 Paso 2: Configurar Tailwind CSS

Para que todo el diseño premium de nuestro prototipo funcione, instalaremos Tailwind CSS y sus procesadores:

```bash
# 1. Instalar Tailwind CSS, PostCSS y Autoprefixer
npm install -D tailwindcss postcss autoprefixer

# 2. Generar los archivos de configuración
npx tailwindcss init -p
```

### Actualizar `tailwind.config.js`

Reemplaza el contenido por:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Cargar directivas en `src/index.css`

Borra el contenido existente y pega:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom body styling (opcional pero recomendado para el fondo oscuro) */
body {
  background-color: #0b0f19;
  margin: 0;
  font-family: 'Inter', sans-serif;
}
```

## 🧩 Paso 3: Pegar el Código de tu Aplicación

Vite crea un archivo `App.jsx` de prueba que limpiaremos para colocar nuestro sistema de rifas.

1. Abre `src/App.jsx`.
2. Borra absolutamente todo su contenido.
3. Copia el código completo de nuestro componente `App.jsx` y pégalo allí.

### (Opcional) Limpieza del proyecto

- Borra `src/App.css`.
- Borra `src/assets/react.svg`.

## ⚡ Paso 4: Encender la Aplicación

Ejecuta:

```bash
npm run dev
```

La consola te dará una URL local (normalmente `http://localhost:5173`). Ábrela en tu navegador y verás tu plataforma de rifas interactiva funcionando en tiempo real.

## 🔌 Paso 5: Conectando el Backend real

### Modo Offline

Si tu backend de Spring Boot está apagado, la app mostrará una alerta de **"Modo Offline"** y cargará datos simulados para que puedas seguir probando la navegación.

### Modo Online

Enciende tu backend de Spring Boot en el puerto **8080**. Asegúrate de que las peticiones **CORS** estén habilitadas en tus controladores de Java para que React pueda consumir los endpoints de Neon de manera segura. El indicador cambiará a verde automáticamente.
