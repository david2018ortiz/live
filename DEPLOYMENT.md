# Guía de Despliegue - Live App (Hostinger VPS)

Esta guía explica cómo organizar, clonar y desplegar tus proyectos en tu servidor VPS de Hostinger utilizando Docker y Traefik para el SSL automático.

## 1. Organización del Servidor
Para mantener el servidor ordenado y poder subir otros proyectos a futuro, utilizaremos una estructura de carpetas clara en el directorio raíz del usuario.

Estructura recomendada:
```text
/root/
  └── apps/                <-- Carpeta principal para todos tus proyectos
      ├── live/            <-- Proyecto actual
      └── proyecto-futuro/ <-- Próximos proyectos
```

Para crear esta estructura, corre en la **Terminal** de Hostinger:
```bash
mkdir -p ~/apps/live
```

## 2. Clonar el Repositorio
Si quieres hacerlo manualmente por terminal (más rápido que el panel):

1. Ve a la carpeta de aplicaciones:
   ```bash
   cd ~/apps
   ```
2. Clona tu repositorio (si ya existe la carpeta `live`, borrala primero con `rm -rf live`):
   ```bash
   git clone https://TU_TOKEN_DE_GITHUB@github.com/david2018ortiz/live.git
   ```
3. Entra a la carpeta del proyecto:
   ```bash
   cd live
   ```

## 3. Configuración de Variables de Entorno (.env)
Docker no instalará dependencias si no tiene las variables necesarias para el "Build".

1. Crea el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita el archivo (puedes usar el editor del panel de Hostinger o `nano .env` en la terminal) y asegúrate de poner tus valores reales de Supabase, DeepAR y el servidor TURN.

## 4. Instalación de Dependencias y Despliegue
Con Docker, **no necesitas instalar Node.js ni nada en el servidor**. Todo se instala automáticamente dentro del contenedor durante este comando:

```bash
docker-compose up -d --build
```
*   `up`: Enciende los contenedores.
*   `-d`: Los corre en segundo plano (detras de escena).
*   `--build`: Fuerza a Docker a instalar todas las dependencias de `package.json` de nuevo.

## 5. SSL Automático con Traefik
Ya configuramos un "Guardia" (Traefik) global. Para que tus próximos proyectos tengan SSL sin hacer nada extra, solo debes copiar estas etiquetas (`labels`) en su archivo `docker-compose.yml`:

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.NOMBRE_DE_TU_APP.rule=Host(`tu-dominio.com`)"
      - "traefik.http.routers.NOMBRE_DE_TU_APP.entrypoints=websecure"
      - "traefik.http.routers.NOMBRE_DE_TU_APP.tls.certresolver=letsencrypt"
      - "traefik.http.services.NOMBRE_DE_TU_APP.loadbalancer.server.port=3000"
      - "traefik.docker.network=proxy"
    networks:
      - proxy
```

## 6. Comandos Útiles de Limpieza
Si algo falla o ves contenedores viejos "basura":
- **Ver lo que está corriendo**: `docker ps`
- **Ver errores de la App**: `docker logs live-app-1`
- **Borrar todo para empezar de cero**: `docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q)`
