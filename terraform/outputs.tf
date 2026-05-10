output "ec2_instance_id" {
  description = "ID da instância EC2 — use como AWS_INSTANCE_ID no GitLab CI/CD para deploys via SSM."
  value       = aws_instance.main.id
}

output "elastic_ip" {
  description = "Elastic IP da instância EC2 (estável mesmo após reinicializações)."
  value       = aws_eip.main.public_ip
}

output "api_url" {
  description = "URL pública da API."
  value       = "http://${aws_eip.main.public_ip}:${var.port}"
}

output "s3_bucket_url" {
  description = "URL pública do bucket S3 (base para arquivos de mídia)."
  value       = "https://s3.${var.aws_region}.amazonaws.com/${var.s3_bucket}"
}

output "ssh_command" {
  description = "Comando SSH para acessar a instância EC2."
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_eip.main.public_ip}" : "Nenhum key pair configurado. Defina a variável key_name para habilitar SSH."
}

