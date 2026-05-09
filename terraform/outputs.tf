output "resource_group_name" {
  description = "Nome do Resource Group principal."
  value       = azurerm_resource_group.main.name
}

output "container_app_environment_id" {
  description = "ID do Container Apps Environment."
  value       = data.azurerm_container_app_environment.main.id
}

output "minio_storage_name" {
  description = "Nome do storage registrado no Container Apps Environment para o MinIO."
  value       = azurerm_container_app_environment_storage.minio.name
}

output "api_url" {
  description = "URL pública da API."
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "container_app_name" {
  description = "Nome do Container App da API — use como AZURE_CONTAINERAPP_NAME no GitLab CI/CD."
  value       = azurerm_container_app.api.name
}
