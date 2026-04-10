# Guía de Instalación y Despliegue en Vercel - CRM Appenvios

## 1. Subir el Proyecto a GitHub

Vercel despliega tu aplicación conectándose directamente a tu repositorio de GitHub. Sigue estos pasos para subir tu código correctamente:

### 📄 Carpetas y Archivos a Subir (Obligatorios)
Debes subir solo el código fuente. Las dependencias se instalarán automáticamente en la nube.
*   `src/` (Toda la lógica y componentes)
*   `public/` (Imágenes y assets públicos)
*   `index.html`
*   `package.json` y `package-lock.json`
*   `tsconfig.json`
*   `tsconfig.app.json`  <-- NUEVO
*   `tsconfig.node.json` <-- NUEVO
*   `vite.config.ts` y `.gitignore`

### 🚫 Carpetas a EXCLUIR (No las subas)
*   `node_modules/` (Es muy pesada y Vercel la recrea)
*   `dist/` (Es la carpeta de compilación local, Vercel compila por su cuenta)

### ⌨️ Comandos para subir por primera vez
Abre una terminal en la carpeta `web-app` y ejecuta:

```bash
# 1. Inicializar el repositorio
git init

# 2. Agregar todos los archivos (el .gitignore excluirá node_modules automáticamente)
git add .

# 3. Primer commit
git commit -m "Primer despliegue CRM Appenvios"

# 4. Crear la rama principal
git branch -M main

# 5. Conectar con tu repositorio de GitHub (Reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Subir el código
git push -u origin main
```

## 2. Pasos para el Despliegue en Vercel

1. **Importar Proyecto**:
   - En tu dashboard de Vercel, haz clic en **"New Project"**.
   - Conecta tu cuenta de Git y selecciona el repositorio de `Appenvios`.

2. **Configuración del Proyecto**:
   - **Framework Preset**: Vercel detectará automáticamente **Vite**.
   - **Root Directory**: Asegúrate de seleccionar la carpeta `web-app` si el repositorio contiene otros archivos en la raíz.
   - **Build Command**: `npm run build` o `vite build`.
   - **Output Directory**: `dist`.

3. **Variables de Entorno (Environment Variables)**:
   > [!IMPORTANT]
   > Este es el paso más importante para que la aplicación se conecte a la base de datos de Supabase.

   - En la sección **"Environment Variables"**, verás dos campos de texto: **Key** y **Value**.
   - Ingresa las siguientes variables una por una:
     1. **Key**: `VITE_SUPABASE_URL`
        - **Value**: Copia la URL de tu panel de Supabase (ej: `https://xxxx.supabase.co`).
     2. **Key**: `VITE_SUPABASE_ANON_KEY`
        - **Value**: Pega tu Anon Key pública (la que configuraste en el archivo `.env`).
   - Haz clic en **"Add"** después de ingresar cada una.

4. **Desplegar**:
   - Haz clic en **"Deploy"**. Vercel compilará el proyecto y te proporcionará una URL pública (ej: `appenvios.vercel.app`).

## Despliegue vía Vercel CLI (Línea de Comandos)

Si prefieres desplegar desde tu terminal:

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Inicia sesión:
   ```bash
   vercel login
   ```
3. Navega a la carpeta del proyecto y despliega:
   ```bash
   cd web-app
   vercel
   ```
4. Para despliegue a producción:
   ```bash
   vercel --prod
   ```

## Notas Importantes para Vite + Vercel

### Manejo de Rutas (SPA)
Si utilizas `react-router-dom` para la navegación, crea un archivo llamado `vercel.json` en la raíz de la carpeta `web-app` con el siguiente contenido para evitar errores 404 al recargar la página:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Persistencia de Datos
> [!NOTE]
> Esta aplicación ha sido migrada de `localStorage` a **Supabase**.
> Los datos ahora se guardan en la nube y son compartidos en tiempo real por todos los usuarios autorizados (Admin, Logística, Vendedores, etc.). Asegúrate de que las variables de entorno configuradas en el paso 2.3 coincidan exactamente con las de tu proyecto en Supabase para que la conexión sea exitosa.

---
**Help Soluciones Informáticas** - *Potenciando tu negocio.*
