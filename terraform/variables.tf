// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------
variable "location" {
  description = "Região do Azure onde os recursos serão criados."
  type        = string
  default     = "brazilsouth"
}

variable "environment" {
  description = "Nome do ambiente (dev, staging, prod)."
  type        = string
  default     = "prod"
}

variable "prefix" {
  description = "Prefixo curto e único para nomear os recursos. Apenas letras minúsculas e números."
  type        = string
  default     = "comuesc"
}

variable "resource_group_name" {
  description = "Nome do Resource Group (opcional — gerado automaticamente se vazio)."
  type        = string
  default     = ""
}

variable "cae_name" {
  description = "Nome do Container Apps Environment já existente na subscription."
  type        = string
  default     = "cae-comunicacao-escolar"
}

variable "cae_resource_group" {
  description = "Resource Group onde o Container Apps Environment existente está registrado."
  type        = string
  default     = "rg-comunicacao-escolar"
}

variable "mongodb_uri" {
  description = "Connection string do MongoDB (Atlas ou outro). Ex: mongodb+srv://user:pass@cluster.mongodb.net/comunicacao-escolar"
  type        = string
  sensitive   = true
}


variable "docker_hub_user" {
  description = "Usuário do Docker Hub."
  type        = string
}

variable "docker_hub_password" {
  description = "Senha / access token do Docker Hub (obrigatório se repositório privado)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "image_tag" {
  description = "Tag da imagem Docker a ser implantada."
  type        = string
  default     = "latest"
}


variable "port" {
  description = "Porta em que a API escuta."
  type        = number
  default     = 3010
}

variable "environment_name" {
  description = "Nome do ambiente exibido internamente."
  type        = string
  default     = "prod"
}

variable "jwt_secret_access_token" {
  description = "Secret do access token JWT."
  type        = string
  sensitive   = true
}

variable "jwt_secret_refresh_token" {
  description = "Secret do refresh token JWT."
  type        = string
  sensitive   = true
}

variable "jwt_secret_password_recovery" {
  description = "Secret do token de recuperação de senha JWT."
  type        = string
  sensitive   = true
}

variable "jwt_secret_invite" {
  description = "Secret do token de convite JWT."
  type        = string
  sensitive   = true
}

variable "jwt_access_token_expiration" {
  description = "Tempo de expiração do access token."
  type        = string
  default     = "1d"
}

variable "jwt_refresh_token_expiration" {
  description = "Tempo de expiração do refresh token."
  type        = string
  default     = "7d"
}


variable "email_user" {
  description = "Endereço de e-mail para envio (Gmail)."
  type        = string
}

variable "email_app_password" {
  description = "Senha de app do Google para envio de e-mail."
  type        = string
  sensitive   = true
}

variable "company_name" {
  description = "Nome que aparecerá como remetente nos e-mails."
  type        = string
  default     = "Comunicação Escolar"
}

variable "frontend_url" {
  description = "URL do aplicativo frontend (para links nos e-mails)."
  type        = string
  default     = "https://comunicacaoescolar.app"
}


variable "minio_access_key" {
  description = "Chave de acesso do MinIO (root user)."
  type        = string
  sensitive   = true
}

variable "minio_secret_key" {
  description = "Chave secreta do MinIO (root password)."
  type        = string
  sensitive   = true
}

variable "minio_bucket" {
  description = "Nome do bucket principal do MinIO."
  type        = string
  default     = "comunicacao-escolar"
}

variable "minio_bucket_2" {
  description = "Nome do segundo bucket do MinIO."
  type        = string
  default     = "comunicacao-escolar-2"
}

variable "admin_password" {
  description = "Senha do usuário admin criado pela seed."
  type        = string
  sensitive   = true
}

variable "admin_name" {
  description = "Nome completo do admin."
  type        = string
  default     = "Administrador"
}

variable "admin_email" {
  description = "E-mail do admin."
  type        = string
  default     = "admin@admin.com"
}


variable "firebase_project_id" {
  description = "Project ID do Firebase (deixe vazio para desativar)."
  type        = string
  default     = ""
}

variable "firebase_client_email" {
  description = "Client email da service account do Firebase."
  type        = string
  default     = ""
}

variable "firebase_private_key" {
  description = "Chave privada da service account do Firebase."
  type        = string
  sensitive   = true
  default     = ""
}
