# terraform/modules/ai-features/outputs.tf

# Vertex AI Gemini Outputs
output "gemini_model_id" {
  description = "The ID of the Gemini 2.0 Ultra model"
  value       = google_vertex_ai_model.gemini_ultra.id
}

output "gemini_model_name" {
  description = "The name of the Gemini 2.0 Ultra model"
  value       = google_vertex_ai_model.gemini_ultra.name
}

output "gemini_endpoint_id" {
  description = "The ID of the Gemini endpoint"
  value       = google_vertex_ai_endpoint.gemini_endpoint.id
}

output "gemini_endpoint_name" {
  description = "The name of the Gemini endpoint"
  value       = google_vertex_ai_endpoint.gemini_endpoint.name
}

output "gemini_endpoint_uri" {
  description = "The URI of the Gemini endpoint"
  value       = google_vertex_ai_endpoint.gemini_endpoint.uri
}

output "gemini_deployment_id" {
  description = "The ID of the Gemini deployment"
  value       = google_vertex_ai_endpoint_deployment.gemini_deployment.id
}

# GCS Bucket Outputs
output "ai_assets_bucket_name" {
  description = "The name of the AI assets GCS bucket"
  value       = google_storage_bucket.ai_assets.name
}

output "ai_assets_bucket_url" {
  description = "The URL of the AI assets GCS bucket"
  value       = google_storage_bucket.ai_assets.url
}

output "embeddings_bucket_name" {
  description = "The name of the embeddings GCS bucket"
  value       = google_storage_bucket.embeddings.name
}

output "embeddings_bucket_url" {
  description = "The URL of the embeddings GCS bucket"
  value       = google_storage_bucket.embeddings.url
}

# Matching Engine Outputs
output "matching_engine_index_id" {
  description = "The ID of the Matching Engine index"
  value       = google_vertex_ai_index.travel_embeddings.id
}

output "matching_engine_index_name" {
  description = "The name of the Matching Engine index"
  value       = google_vertex_ai_index.travel_embeddings.name
}

output "matching_engine_endpoint_id" {
  description = "The ID of the Matching Engine endpoint"
  value       = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.id
}

output "matching_engine_endpoint_name" {
  description = "The name of the Matching Engine endpoint"
  value       = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.name
}

output "matching_engine_endpoint_uri" {
  description = "The URI of the Matching Engine endpoint"
  value       = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.uri
}

output "matching_engine_deployment_id" {
  description = "The ID of the Matching Engine deployment"
  value       = google_vertex_ai_index_endpoint_deployment.travel_embeddings_deployment.id
}

# IAM Service Account Outputs
output "ai_service_account_email" {
  description = "The email of the AI service account"
  value       = google_service_account.ai_service_account.email
}

output "ai_service_account_name" {
  description = "The name of the AI service account"
  value       = google_service_account.ai_service_account.name
}

output "ai_service_account_id" {
  description = "The ID of the AI service account"
  value       = google_service_account.ai_service_account.id
}

# KMS Encryption Outputs
output "ai_encryption_key_id" {
  description = "The ID of the AI encryption key (if enabled)"
  value       = var.enable_ai_encryption ? google_kms_crypto_key.ai_encryption_key[0].id : null
}

output "ai_encryption_key_name" {
  description = "The name of the AI encryption key (if enabled)"
  value       = var.enable_ai_encryption ? google_kms_crypto_key.ai_encryption_key[0].name : null
}

output "ai_keyring_id" {
  description = "The ID of the AI keyring (if enabled)"
  value       = var.enable_ai_encryption ? google_kms_key_ring.ai_keyring[0].id : null
}

# Monitoring and Logging Outputs
output "ai_monitoring_service_id" {
  description = "The ID of the AI monitoring service"
  value       = google_monitoring_custom_service.ai_features.service_id
}

output "ai_logging_sink_writer_identity" {
  description = "The writer identity for the AI logging sink"
  value       = google_logging_project_sink.ai_features_logs.writer_identity
}

output "ai_logging_topic_name" {
  description = "The name of the AI logging Pub/Sub topic"
  value       = google_pubsub_topic.ai_logging_topic.name
}

output "ai_logging_topic_id" {
  description = "The ID of the AI logging Pub/Sub topic"
  value       = google_pubsub_topic.ai_logging_topic.id
}

# API Enablement Outputs
output "enabled_apis" {
  description = "List of enabled APIs"
  value       = [for api in google_project_service.ai_apis : api.service]
}

# Configuration Outputs
output "region" {
  description = "The region where AI resources are deployed"
  value       = var.region
}

output "project_id" {
  description = "The project ID where AI resources are deployed"
  value       = var.project_id
}

# Endpoint URLs for Application Integration
output "gemini_endpoint_url" {
  description = "The full URL for the Gemini endpoint"
  value       = "https://${var.region}-aiplatform.googleapis.com/v1/projects/${var.project_id}/locations/${var.region}/endpoints/${google_vertex_ai_endpoint.gemini_endpoint.name}"
}

output "matching_engine_endpoint_url" {
  description = "The full URL for the Matching Engine endpoint"
  value       = "https://${var.region}-aiplatform.googleapis.com/v1/projects/${var.project_id}/locations/${var.region}/indexEndpoints/${google_vertex_ai_index_endpoint.travel_embeddings_endpoint.name}"
}

# Resource Summary Outputs
output "ai_resources_summary" {
  description = "Summary of all AI resources created"
  value = {
    gemini_model = {
      id   = google_vertex_ai_model.gemini_ultra.id
      name = google_vertex_ai_model.gemini_ultra.name
    }
    gemini_endpoint = {
      id   = google_vertex_ai_endpoint.gemini_endpoint.id
      name = google_vertex_ai_endpoint.gemini_endpoint.name
      uri  = google_vertex_ai_endpoint.gemini_endpoint.uri
    }
    matching_engine_index = {
      id   = google_vertex_ai_index.travel_embeddings.id
      name = google_vertex_ai_index.travel_embeddings.name
    }
    matching_engine_endpoint = {
      id   = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.id
      name = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.name
      uri  = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.uri
    }
    storage_buckets = {
      ai_assets = google_storage_bucket.ai_assets.name
      embeddings = google_storage_bucket.embeddings.name
    }
    service_account = {
      email = google_service_account.ai_service_account.email
      name  = google_service_account.ai_service_account.name
    }
    encryption = var.enable_ai_encryption ? {
      key_id   = google_kms_crypto_key.ai_encryption_key[0].id
      key_name = google_kms_crypto_key.ai_encryption_key[0].name
    } : null
  }
}

# Security and Compliance Outputs
output "encryption_enabled" {
  description = "Whether encryption is enabled for AI resources"
  value       = var.enable_ai_encryption
}

output "audit_logging_enabled" {
  description = "Whether audit logging is enabled for AI resources"
  value       = var.enable_audit_logging
}

output "data_encryption_enabled" {
  description = "Whether data encryption at rest is enabled"
  value       = var.enable_data_encryption
}

# Performance Configuration Outputs
output "gpu_acceleration_enabled" {
  description = "Whether GPU acceleration is enabled"
  value       = var.enable_gpu_acceleration
}

output "autoscaling_enabled" {
  description = "Whether autoscaling is enabled"
  value       = var.enable_autoscaling
}

# Cost Optimization Outputs
output "preemptible_instances_enabled" {
  description = "Whether preemptible instances are enabled"
  value       = var.enable_preemptible_instances
}

# Network Configuration Outputs
output "private_service_connect_enabled" {
  description = "Whether Private Service Connect is enabled"
  value       = var.enable_private_service_connect
}

output "vpc_peering_enabled" {
  description = "Whether VPC peering is enabled"
  value       = var.enable_vpc_peering
}

# Maintenance Configuration Outputs
output "maintenance_window" {
  description = "Maintenance window configuration"
  value = {
    start_time = var.maintenance_window_start
    end_time   = var.maintenance_window_end
    timezone   = var.maintenance_window_timezone
  }
}

# Backup Configuration Outputs
output "backup_enabled" {
  description = "Whether backup is enabled"
  value       = var.enable_backup
}

output "backup_retention_days" {
  description = "Number of days to retain backups"
  value       = var.backup_retention_days
} 