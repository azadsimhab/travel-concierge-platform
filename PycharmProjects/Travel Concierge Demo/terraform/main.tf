terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }
  
  backend "gcs" {
    bucket = "travel-concierge-terraform-state"
    prefix = "ai-features"
  }
}

# Configure Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# AI Features Module
module "ai_features" {
  source = "./modules/ai-features"
  
  # Required Variables
  project_id = var.project_id
  region     = var.region
  env        = var.env
  
  # Vertex AI Gemini Configuration
  gemini_model_name         = var.gemini_model_name
  gemini_model_display_name = var.gemini_model_display_name
  gemini_endpoint_name      = var.gemini_endpoint_name
  gemini_endpoint_display_name = var.gemini_endpoint_display_name
  gemini_machine_type       = var.gemini_machine_type
  gemini_min_replicas       = var.gemini_min_replicas
  gemini_max_replicas       = var.gemini_max_replicas
  
  # GCS Bucket Configuration
  ai_assets_bucket_name = var.ai_assets_bucket_name
  embeddings_bucket_name = var.embeddings_bucket_name
  force_destroy_bucket   = var.force_destroy_bucket
  
  # Matching Engine Configuration
  matching_engine_index_name         = var.matching_engine_index_name
  matching_engine_index_display_name = var.matching_engine_index_display_name
  matching_engine_endpoint_name      = var.matching_engine_endpoint_name
  matching_engine_endpoint_display_name = var.matching_engine_endpoint_display_name
  matching_engine_machine_type       = var.matching_engine_machine_type
  matching_engine_min_replicas       = var.matching_engine_min_replicas
  matching_engine_max_replicas       = var.matching_engine_max_replicas
  embedding_dimensions               = var.embedding_dimensions
  approximate_neighbors_count        = var.approximate_neighbors_count
  leaf_node_embedding_count          = var.leaf_node_embedding_count
  leaf_nodes_to_search_percent       = var.leaf_nodes_to_search_percent
  
  # IAM Configuration
  ai_service_account_name = var.ai_service_account_name
  
  # Cloud Vision API Configuration
  enable_vision_api_quota_increase = var.enable_vision_api_quota_increase
  
  # Encryption Configuration
  enable_ai_encryption    = var.enable_ai_encryption
  ai_keyring_name         = var.ai_keyring_name
  ai_encryption_key_name  = var.ai_encryption_key_name
  
  # Monitoring and Logging Configuration
  ai_monitoring_service_id = var.ai_monitoring_service_id
  ai_logging_sink_name     = var.ai_logging_sink_name
  ai_logging_topic_name    = var.ai_logging_topic_name
  
  # Tags and Labels
  common_labels = var.common_labels
  
  # Network Configuration
  vpc_network = var.vpc_network
  vpc_subnet  = var.vpc_subnet
  
  # Security Configuration
  enable_private_service_connect = var.enable_private_service_connect
  enable_vpc_peering            = var.enable_vpc_peering
  
  # Cost Optimization
  enable_autoscaling           = var.enable_autoscaling
  enable_preemptible_instances = var.enable_preemptible_instances
  
  # Backup and Recovery
  enable_backup           = var.enable_backup
  backup_retention_days   = var.backup_retention_days
  
  # Compliance and Security
  enable_audit_logging        = var.enable_audit_logging
  enable_data_encryption      = var.enable_data_encryption
  enable_customer_managed_keys = var.enable_customer_managed_keys
  
  # Performance Configuration
  enable_gpu_acceleration = var.enable_gpu_acceleration
  gpu_type               = var.gpu_type
  gpu_count              = var.gpu_count
  
  # Maintenance Configuration
  maintenance_window_start  = var.maintenance_window_start
  maintenance_window_end    = var.maintenance_window_end
  maintenance_window_timezone = var.maintenance_window_timezone
}

# Output all AI features module outputs
output "gemini_model_id" {
  description = "The ID of the Gemini 2.0 Ultra model"
  value       = module.ai_features.gemini_model_id
}

output "gemini_endpoint_id" {
  description = "The ID of the Gemini endpoint"
  value       = module.ai_features.gemini_endpoint_id
}

output "gemini_endpoint_uri" {
  description = "The URI of the Gemini endpoint"
  value       = module.ai_features.gemini_endpoint_uri
}

output "gemini_endpoint_url" {
  description = "The full URL for the Gemini endpoint"
  value       = module.ai_features.gemini_endpoint_url
}

output "matching_engine_index_id" {
  description = "The ID of the Matching Engine index"
  value       = module.ai_features.matching_engine_index_id
}

output "matching_engine_endpoint_id" {
  description = "The ID of the Matching Engine endpoint"
  value       = module.ai_features.matching_engine_endpoint_id
}

output "matching_engine_endpoint_uri" {
  description = "The URI of the Matching Engine endpoint"
  value       = module.ai_features.matching_engine_endpoint_uri
}

output "matching_engine_endpoint_url" {
  description = "The full URL for the Matching Engine endpoint"
  value       = module.ai_features.matching_engine_endpoint_url
}

output "ai_assets_bucket_name" {
  description = "The name of the AI assets GCS bucket"
  value       = module.ai_features.ai_assets_bucket_name
}

output "embeddings_bucket_name" {
  description = "The name of the embeddings GCS bucket"
  value       = module.ai_features.embeddings_bucket_name
}

output "ai_service_account_email" {
  description = "The email of the AI service account"
  value       = module.ai_features.ai_service_account_email
}

output "ai_encryption_key_id" {
  description = "The ID of the AI encryption key (if enabled)"
  value       = module.ai_features.ai_encryption_key_id
}

output "ai_monitoring_service_id" {
  description = "The ID of the AI monitoring service"
  value       = module.ai_features.ai_monitoring_service_id
}

output "ai_logging_topic_name" {
  description = "The name of the AI logging Pub/Sub topic"
  value       = module.ai_features.ai_logging_topic_name
}

output "enabled_apis" {
  description = "List of enabled APIs"
  value       = module.ai_features.enabled_apis
}

output "ai_resources_summary" {
  description = "Summary of all AI resources created"
  value       = module.ai_features.ai_resources_summary
}

# Security and Compliance Outputs
output "encryption_enabled" {
  description = "Whether encryption is enabled for AI resources"
  value       = module.ai_features.encryption_enabled
}

output "audit_logging_enabled" {
  description = "Whether audit logging is enabled for AI resources"
  value       = module.ai_features.audit_logging_enabled
}

output "data_encryption_enabled" {
  description = "Whether data encryption at rest is enabled"
  value       = module.ai_features.data_encryption_enabled
}

# Performance Configuration Outputs
output "gpu_acceleration_enabled" {
  description = "Whether GPU acceleration is enabled"
  value       = module.ai_features.gpu_acceleration_enabled
}

output "autoscaling_enabled" {
  description = "Whether autoscaling is enabled"
  value       = module.ai_features.autoscaling_enabled
}

# Cost Optimization Outputs
output "preemptible_instances_enabled" {
  description = "Whether preemptible instances are enabled"
  value       = module.ai_features.preemptible_instances_enabled
}

# Network Configuration Outputs
output "private_service_connect_enabled" {
  description = "Whether Private Service Connect is enabled"
  value       = module.ai_features.private_service_connect_enabled
}

output "vpc_peering_enabled" {
  description = "Whether VPC peering is enabled"
  value       = module.ai_features.vpc_peering_enabled
}

# Maintenance Configuration Outputs
output "maintenance_window" {
  description = "Maintenance window configuration"
  value       = module.ai_features.maintenance_window
}

# Backup Configuration Outputs
output "backup_enabled" {
  description = "Whether backup is enabled"
  value       = module.ai_features.backup_enabled
}

output "backup_retention_days" {
  description = "Number of days to retain backups"
  value       = module.ai_features.backup_retention_days
} 