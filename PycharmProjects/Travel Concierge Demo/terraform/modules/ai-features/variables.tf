# terraform/modules/ai-features/variables.tf

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for AI resources"
  type        = string
  default     = "us-central1"
}

variable "env" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Vertex AI Gemini Configuration
variable "gemini_model_name" {
  description = "Name for the Gemini 2.0 Ultra model"
  type        = string
  default     = "gemini-2-0-ultra"
}

variable "gemini_model_display_name" {
  description = "Display name for the Gemini model"
  type        = string
  default     = "Gemini 2.0 Ultra"
}

variable "gemini_endpoint_name" {
  description = "Name for the Gemini endpoint"
  type        = string
  default     = "gemini-ultra-endpoint"
}

variable "gemini_endpoint_display_name" {
  description = "Display name for the Gemini endpoint"
  type        = string
  default     = "Gemini 2.0 Ultra Endpoint"
}

variable "gemini_machine_type" {
  description = "Machine type for Gemini deployment"
  type        = string
  default     = "n1-standard-4"
}

variable "gemini_min_replicas" {
  description = "Minimum number of replicas for Gemini deployment"
  type        = number
  default     = 1
}

variable "gemini_max_replicas" {
  description = "Maximum number of replicas for Gemini deployment"
  type        = number
  default     = 10
}

# GCS Bucket Configuration
variable "ai_assets_bucket_name" {
  description = "Name for the AI assets GCS bucket"
  type        = string
}

variable "embeddings_bucket_name" {
  description = "Name for the embeddings GCS bucket"
  type        = string
}

variable "force_destroy_bucket" {
  description = "Force destroy GCS buckets when destroying the module"
  type        = bool
  default     = false
}

# Matching Engine Configuration
variable "matching_engine_index_name" {
  description = "Name for the Matching Engine index"
  type        = string
  default     = "travel-embeddings-index"
}

variable "matching_engine_index_display_name" {
  description = "Display name for the Matching Engine index"
  type        = string
  default     = "Travel Embeddings Index"
}

variable "matching_engine_endpoint_name" {
  description = "Name for the Matching Engine endpoint"
  type        = string
  default     = "travel-embeddings-endpoint"
}

variable "matching_engine_endpoint_display_name" {
  description = "Display name for the Matching Engine endpoint"
  type        = string
  default     = "Travel Embeddings Endpoint"
}

variable "matching_engine_machine_type" {
  description = "Machine type for Matching Engine deployment"
  type        = string
  default     = "n1-standard-4"
}

variable "matching_engine_min_replicas" {
  description = "Minimum number of replicas for Matching Engine deployment"
  type        = number
  default     = 1
}

variable "matching_engine_max_replicas" {
  description = "Maximum number of replicas for Matching Engine deployment"
  type        = number
  default     = 10
}

variable "embedding_dimensions" {
  description = "Number of dimensions for embeddings"
  type        = number
  default     = 768
}

variable "approximate_neighbors_count" {
  description = "Number of approximate neighbors to return"
  type        = number
  default     = 100
}

variable "leaf_node_embedding_count" {
  description = "Number of embeddings per leaf node"
  type        = number
  default     = 500
}

variable "leaf_nodes_to_search_percent" {
  description = "Percentage of leaf nodes to search"
  type        = number
  default     = 10
}

# IAM Configuration
variable "ai_service_account_name" {
  description = "Name for the AI service account"
  type        = string
  default     = "ai-features-sa"
}

# Cloud Vision API Configuration
variable "enable_vision_api_quota_increase" {
  description = "Enable Vision API quota increase"
  type        = bool
  default     = false
}

# Encryption Configuration
variable "enable_ai_encryption" {
  description = "Enable KMS encryption for AI data"
  type        = bool
  default     = false
}

variable "ai_keyring_name" {
  description = "Name for the AI KMS keyring"
  type        = string
  default     = "ai-encryption-keyring"
}

variable "ai_encryption_key_name" {
  description = "Name for the AI encryption key"
  type        = string
  default     = "ai-encryption-key"
}

# Monitoring and Logging Configuration
variable "ai_monitoring_service_id" {
  description = "Service ID for AI features monitoring"
  type        = string
  default     = "ai-features-monitoring"
}

variable "ai_logging_sink_name" {
  description = "Name for the AI logging sink"
  type        = string
  default     = "ai-features-logs"
}

variable "ai_logging_topic_name" {
  description = "Name for the AI logging Pub/Sub topic"
  type        = string
  default     = "ai-features-logs"
}

# Tags and Labels
variable "common_labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default = {
    environment = "production"
    managed_by  = "terraform"
    module      = "ai-features"
  }
}

# Network Configuration
variable "vpc_network" {
  description = "VPC network for AI resources"
  type        = string
  default     = ""
}

variable "vpc_subnet" {
  description = "VPC subnet for AI resources"
  type        = string
  default     = ""
}

# Security Configuration
variable "enable_private_service_connect" {
  description = "Enable Private Service Connect for AI endpoints"
  type        = bool
  default     = false
}

variable "enable_vpc_peering" {
  description = "Enable VPC peering for AI services"
  type        = bool
  default     = false
}

# Cost Optimization
variable "enable_autoscaling" {
  description = "Enable autoscaling for AI deployments"
  type        = bool
  default     = true
}

variable "enable_preemptible_instances" {
  description = "Enable preemptible instances for cost optimization"
  type        = bool
  default     = false
}

# Backup and Recovery
variable "enable_backup" {
  description = "Enable backup for AI resources"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

# Compliance and Security
variable "enable_audit_logging" {
  description = "Enable audit logging for AI resources"
  type        = bool
  default     = true
}

variable "enable_data_encryption" {
  description = "Enable data encryption at rest"
  type        = bool
  default     = true
}

variable "enable_customer_managed_keys" {
  description = "Enable customer-managed encryption keys"
  type        = bool
  default     = false
}

# Performance Configuration
variable "enable_gpu_acceleration" {
  description = "Enable GPU acceleration for AI models"
  type        = bool
  default     = false
}

variable "gpu_type" {
  description = "GPU type for acceleration (if enabled)"
  type        = string
  default     = "nvidia-tesla-t4"
}

variable "gpu_count" {
  description = "Number of GPUs per instance"
  type        = number
  default     = 1
}

# Maintenance Configuration
variable "maintenance_window_start" {
  description = "Start time for maintenance window (HH:MM)"
  type        = string
  default     = "02:00"
}

variable "maintenance_window_end" {
  description = "End time for maintenance window (HH:MM)"
  type        = string
  default     = "06:00"
}

variable "maintenance_window_timezone" {
  description = "Timezone for maintenance window"
  type        = string
  default     = "UTC"
} 