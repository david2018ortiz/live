# Guía de Despliegue - Live App (Método Tradicional Node.js)

Esta guía explica cómo desplegar tus proyectos directamente en tu VPS de Hostinger sin usar Docker. Este método utiliza **Node.js**, **PM2** (para el proceso) y **Caddy** (para el SSL).

## 1. Instalación Inicial (Solo la primera vez)
Conéctate por SSH a tu servidor y ejecuta esto para instalar lo necesario:

```bash
# 1. Instalar NVM (Node Version Manager) y Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22

# 2. Instalar PM2 para gestionar los procesos que no se detengan
npm install -g pm2

# 3. Instalar Caddy para el SSL automático
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

## 2. Organización del Servidor
```bash
mkdir -p ~/apps/live
cd ~/apps/live
```

## 3. Despliegue de la App
Sigue estos pasos cada vez que quieras subir cambios o un nuevo proyecto:

1.  **Clonar el código**:
    ```bash
    git clone https://TU_TOKEN@github.com/david2018ortiz/live.git .
    ```
2.  **Configurar Variables de Entorno**:
    Crea el archivo `.env` y pega tus valores de Supabase, DeepAR, etc.
    ```bash
    cp .env.example .env
    # Edita el archivo con tus valores reales
    ```
3.  **Instalar dependencias y Construir**:
    ```bash
    npm install
    npm run build
    ```
4.  **Iniciar con PM2**:
    Esto mantendrá tu aplicación corriendo por siempre en el puerto 3000.
    ```bash
    pm2 start npm --name "live-app" -- start
    pm2 save  # Para que se inicie solo si el servidor se reinicia
    ```

## 4. Configuración del SSL (Caddy)
Como no estamos en Docker, editamos el archivo de configuración global de Caddy:
```bash
sudo nano /etc/caddy/Caddyfile
```
Pega lo siguiente:
```text
contenidovaleria.shop {
    reverse_proxy localhost:3000
}

# Puedes agregar más proyectos así de fácil:
otroproyect.com {
    reverse_proxy localhost:3001
}
```
Reinicia Caddy para aplicar cambios:
```bash
sudo systemctl restart caddy
```

## 5. Comandos Útiles
- **Ver logs de la app**: `pm2 logs live-app`
- **Reiniciar app**: `pm2 restart live-app`
- **Ver estado de Caddy**: `systemctl status caddy`
