locals {
  name = "${var.prefix}${var.environment}"
  tags = {
    project     = "comunicacao-escolar"
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name != "" ? var.resource_group_name : "rg-comunicacao-escolar-${var.environment}"
  location = var.location
  tags     = local.tags
}


data "azurerm_container_app_environment" "main" {
  name                = var.cae_name
  resource_group_name = var.cae_resource_group
}

resource "azurerm_storage_account" "minio" {
  name                     = "stminio${local.name}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.tags
}

resource "azurerm_storage_share" "minio" {
  name               = "minio-data"
  storage_account_id = azurerm_storage_account.minio.id
  quota              = 10
}

resource "azurerm_container_app_environment_storage" "minio" {
  name                         = "minio-storage"
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.minio.name
  share_name                   = azurerm_storage_share.minio.name
  access_key                   = azurerm_storage_account.minio.primary_access_key
  access_mode                  = "ReadWrite"
}


resource "azurerm_container_app" "minio" {
  name                         = "ca-minio-${var.environment}"
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  secret {
    name  = "minio-root-password"
    value = var.minio_secret_key
  }

  ingress {
    external_enabled = true
    target_port      = 9000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 1

    volume {
      name         = "minio-data"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.minio.name
    }

    container {
      name   = "minio"
      image  = "minio/minio:RELEASE.2025-04-22T22-12-26Z"
      cpu    = 0.25
      memory = "0.5Gi"

      args = ["server", "/data", "--console-address", ":9001"]

      env {
        name  = "MINIO_ROOT_USER"
        value = var.minio_access_key
      }

      env {
        name        = "MINIO_ROOT_PASSWORD"
        secret_name = "minio-root-password"
      }

      volume_mounts {
        name = "minio-data"
        path = "/data"
      }
    }
  }

  tags = local.tags
}

resource "azurerm_container_app" "api" {
  name                         = "ca-api-${var.environment}"
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  dynamic "registry" {
    for_each = var.docker_hub_password != "" ? [1] : []
    content {
      server               = "index.docker.io"
      username             = var.docker_hub_user
      password_secret_name = "dockerhub-password"
    }
  }

  dynamic "secret" {
    for_each = var.docker_hub_password != "" ? [1] : []
    content {
      name  = "dockerhub-password"
      value = var.docker_hub_password
    }
  }

  secret {
    name  = "db-url"
    value = var.mongodb_uri
  }

  secret {
    name  = "jwt-access-token"
    value = var.jwt_secret_access_token
  }

  secret {
    name  = "jwt-refresh-token"
    value = var.jwt_secret_refresh_token
  }

  secret {
    name  = "jwt-recovery-token"
    value = var.jwt_secret_password_recovery
  }

  secret {
    name  = "jwt-invite-token"
    value = var.jwt_secret_invite
  }

  secret {
    name  = "email-app-password"
    value = var.email_app_password
  }

  secret {
    name  = "minio-secret-key"
    value = var.minio_secret_key
  }

  secret {
    name  = "admin-password"
    value = var.admin_password
  }

  dynamic "secret" {
    for_each = var.firebase_private_key != "" ? [1] : []
    content {
      name  = "firebase-private-key"
      value = var.firebase_private_key
    }
  }

  ingress {
    external_enabled = true
    target_port      = var.port
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "api"
      image  = "${var.docker_hub_user}/comunicacao-escolar-api:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = tostring(var.port)
      }

      env {
        name  = "DEBUGLOG"
        value = "false"
      }

      env {
        name        = "DB_URL"
        secret_name = "db-url"
      }

      env {
        name        = "JWT_SECRET_ACCESS_TOKEN"
        secret_name = "jwt-access-token"
      }

      env {
        name        = "JWT_SECRET_REFRESH_TOKEN"
        secret_name = "jwt-refresh-token"
      }

      env {
        name        = "JWT_SECRET_PASSWORD_RECOVERY"
        secret_name = "jwt-recovery-token"
      }

      env {
        name        = "JWT_SECRET_INVITE"
        secret_name = "jwt-invite-token"
      }

      env {
        name  = "JWT_ACCESS_TOKEN_EXPIRATION"
        value = var.jwt_access_token_expiration
      }

      env {
        name  = "JWT_REFRESH_TOKEN_EXPIRATION"
        value = var.jwt_refresh_token_expiration
      }

      env {
        name  = "EMAIL_USER"
        value = var.email_user
      }

      env {
        name        = "EMAIL_APP_PASSWORD"
        secret_name = "email-app-password"
      }

      env {
        name  = "COMPANY_NAME"
        value = var.company_name
      }

      env {
        name  = "FRONTEND_URL"
        value = var.frontend_url
      }

      env {
        name  = "MINIO_ENDPOINT"
        value = azurerm_container_app.minio.ingress[0].fqdn
      }

      env {
        name  = "MINIO_PORT"
        value = "443"
      }

      env {
        name  = "MINIO_USE_SSL"
        value = "true"
      }

      env {
        name  = "MINIO_ACCESS_KEY"
        value = var.minio_access_key
      }

      env {
        name        = "MINIO_SECRET_KEY"
        secret_name = "minio-secret-key"
      }

      env {
        name  = "MINIO_BUCKET"
        value = var.minio_bucket
      }

      env {
        name  = "MINIO_BUCKET_2"
        value = var.minio_bucket_2
      }

      env {
        name  = "MINIO_PUBLIC_URL"
        value = "https://${azurerm_container_app.minio.ingress[0].fqdn}"
      }

      # ---- Admin seed ----
      env {
        name  = "ADMIN_NAME"
        value = var.admin_name
      }

      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }

      env {
        name        = "ADMIN_PASSWORD"
        secret_name = "admin-password"
      }

      dynamic "env" {
        for_each = var.firebase_project_id != "" ? [1] : []
        content {
          name  = "FIREBASE_PROJECT_ID"
          value = var.firebase_project_id
        }
      }

      dynamic "env" {
        for_each = var.firebase_client_email != "" ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_EMAIL"
          value = var.firebase_client_email
        }
      }

      dynamic "env" {
        for_each = var.firebase_private_key != "" ? [1] : []
        content {
          name        = "FIREBASE_PRIVATE_KEY"
          secret_name = "firebase-private-key"
        }
      }
    }
  }

  depends_on = [azurerm_container_app.minio]
  tags       = local.tags
}
