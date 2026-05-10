#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data -s) 2>&1

echo "=== [$(date)] Iniciando setup da instância EC2 ==="

# ── 1. Atualização do sistema e instalação do Docker ─────────────────────────
dnf update -y
dnf install -y docker
systemctl enable --now docker

# Docker Compose v2 (plugin)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Docker $(docker --version) instalado."
echo "Docker Compose $(docker compose version) instalado."

# ── 2. Diretórios da aplicação ───────────────────────────────────────────────
mkdir -p /opt/app
cd /opt/app

# ── 3. Arquivo .env ──────────────────────────────────────────────────────────
printf '%s' '${env_b64}' | base64 -d > /opt/app/.env
chmod 600 /opt/app/.env
echo ".env gerado com sucesso."

# ── 4. Login no Docker Hub (se credenciais fornecidas) ───────────────────────
%{ if docker_hub_password != "" ~}
echo "Fazendo login no Docker Hub..."
printf '%s' '${docker_hub_password}' | docker login --username '${docker_hub_user}' --password-stdin
%{ endif ~}

# ── 5. docker-compose.yml ────────────────────────────────────────────────────
cat > /opt/app/docker-compose.yml <<'COMPOSE_EOF'
services:
  api:
    image: ${docker_hub_user}/comunicacao-escolar-api:${image_tag}
    restart: always
    ports:
      - "${port}:${port}"
    env_file: /opt/app/.env
COMPOSE_EOF

echo "docker-compose.yml gerado."

# ── 6. Subir os serviços ─────────────────────────────────────────────────────
docker compose -f /opt/app/docker-compose.yml pull
docker compose -f /opt/app/docker-compose.yml up -d
echo "Containers iniciados."

echo "=== [$(date)] Setup concluído! ==="
