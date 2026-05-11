// ---------------------------------------------------------------------------
// AWS
// ---------------------------------------------------------------------------
variable "aws_region" {
  description = "Região AWS onde os recursos serão criados."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Tipo de instância EC2. Use t3.micro para Free Tier (contas novas) ou t2.micro (contas legadas)."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "ID da AMI para a instância EC2. Deixe vazio para usar automaticamente a Amazon Linux 2023 mais recente."
  type        = string
  default     = ""
}

variable "key_name" {
  description = "Nome do key pair EC2 para acesso SSH. Deixe vazio para desativar."
  type        = string
  default     = ""
}

variable "ssh_allowed_cidr" {
  description = "CIDR autorizado para SSH (porta 22) e MinIO Console (porta 9001). Restrinja ao seu IP para maior segurança."
  type        = string
  default     = "0.0.0.0/0"
}

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

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

variable "cors_origin" {
  description = "Origem permitida para CORS e Socket.IO. Use a URL do frontend ou * para qualquer origem."
  type        = string
  default     = "*"
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


variable "s3_bucket" {
  description = "Nome do bucket S3 para armazenamento de arquivos. Deve ser globalmente único na AWS."
  type        = string
  default     = "comunicacao-escolar"
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
  description = "Chave privada da service account do Firebase. Use \\n para representar quebras de linha."
  type        = string
  sensitive   = true
  default     = ""
}

variable "swagger_user" {
  description = "Usuário para Basic Auth do Swagger UI. Deixe vazio para desativar o Swagger em produção."
  type        = string
  default     = ""
}

variable "swagger_password" {
  description = "Senha para Basic Auth do Swagger UI."
  type        = string
  sensitive   = true
  default     = ""
}
