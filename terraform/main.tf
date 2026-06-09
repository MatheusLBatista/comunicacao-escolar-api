locals {
  name = "${var.prefix}-${var.environment}"
  tags = {
    project     = "comunicacao-escolar"
    environment = var.environment
    managed_by  = "terraform"
  }

  env_file_lines = concat([
    "NODE_ENV=production",
    "PORT=${var.port}",
    "DEBUGLOG=false",
    "DB_URL=${var.mongodb_uri}",
    "JWT_SECRET_ACCESS_TOKEN=${var.jwt_secret_access_token}",
    "JWT_SECRET_REFRESH_TOKEN=${var.jwt_secret_refresh_token}",
    "JWT_SECRET_PASSWORD_RECOVERY=${var.jwt_secret_password_recovery}",
    "JWT_SECRET_INVITE=${var.jwt_secret_invite}",
    "JWT_ACCESS_TOKEN_EXPIRATION=${var.jwt_access_token_expiration}",
    "JWT_REFRESH_TOKEN_EXPIRATION=${var.jwt_refresh_token_expiration}",
    "EMAIL_USER=${var.email_user}",
    "EMAIL_APP_PASSWORD=${var.email_app_password}",
    "COMPANY_NAME=${var.company_name}",
    "FRONTEND_URL=${var.frontend_url}",
    "CORS_ORIGIN=${var.cors_origin}",
    "MINIO_ENDPOINT=s3.${var.aws_region}.amazonaws.com",
    "MINIO_PORT=443",
    "MINIO_USE_SSL=true",
    "MINIO_ACCESS_KEY=${aws_iam_access_key.s3_api.id}",
    "MINIO_SECRET_KEY=${aws_iam_access_key.s3_api.secret}",
    "MINIO_BUCKET=${var.s3_bucket}",
    "MINIO_PUBLIC_URL=https://s3.${var.aws_region}.amazonaws.com",
    "SWAGGER_USER=${var.swagger_user}",
    "SWAGGER_PASSWORD=${var.swagger_password}",
    "API_URL=http://${aws_eip.main.public_ip}:${var.port}",
  ], compact([
    var.firebase_project_id != "" ? "FIREBASE_PROJECT_ID=${var.firebase_project_id}" : "",
    var.firebase_client_email != "" ? "FIREBASE_CLIENT_EMAIL=${var.firebase_client_email}" : "",
    var.firebase_private_key != "" ? "FIREBASE_PRIVATE_KEY=\"${replace(var.firebase_private_key, "\n", "\\n")}\"" : "",
    var.google_client_id != "" ? "GOOGLE_CLIENT_ID=${var.google_client_id}" : "",
  ]))

  env_file_b64 = base64encode(join("\n", local.env_file_lines))
}


data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}


data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${local.name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name}-ec2-profile"
  role = aws_iam_role.ec2.name
}


resource "aws_eip" "main" {
  domain = "vpc"
  tags   = merge(local.tags, { Name = "${local.name}-eip" })
}

resource "aws_eip_association" "main" {
  instance_id   = aws_instance.main.id
  allocation_id = aws_eip.main.id
}

# ── S3 — armazenamento de arquivos (substitui MinIO) ─────────────────────────

resource "aws_s3_bucket" "media" {
  bucket = var.s3_bucket
  tags   = merge(local.tags, { Name = var.s3_bucket })
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "media" {
  bucket     = aws_s3_bucket.media.id
  depends_on = [aws_s3_bucket_public_access_block.media]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.media.arn}/*"
    }]
  })
}

# ── IAM — usuário de serviço para a API acessar o S3 ─────────────────────────

resource "aws_iam_user" "s3_api" {
  name = "${local.name}-s3-api"
  tags = local.tags
}

resource "aws_iam_user_policy" "s3_api" {
  name = "${local.name}-s3-api-policy"
  user = aws_iam_user.s3_api.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.media.arn,
        "${aws_s3_bucket.media.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_access_key" "s3_api" {
  user = aws_iam_user.s3_api.name
}

# ── Security Group ────────────────────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name        = "${local.name}-ec2-sg"
  description = "Trafego permitido para a instancia EC2"
  vpc_id      = data.aws_vpc.default.id

  dynamic "ingress" {
    for_each = var.key_name != "" ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.ssh_allowed_cidr]
    }
  }

  ingress {
    description = "API"
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-ec2-sg" })
}


resource "aws_instance" "main" {
  ami                         = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  key_name                    = var.key_name != "" ? var.key_name : null
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  subnet_id                   = data.aws_subnets.public.ids[0]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    env_b64             = local.env_file_b64
    docker_hub_user     = var.docker_hub_user
    docker_hub_password = var.docker_hub_password
    image_tag           = var.image_tag
    port                = var.port
  }))

  tags = merge(local.tags, { Name = "${local.name}-ec2" })
}


