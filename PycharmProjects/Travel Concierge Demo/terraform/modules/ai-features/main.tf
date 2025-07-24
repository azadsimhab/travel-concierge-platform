# terraform/modules/ai-features/main.tf

# Enable required APIs
resource "google_project_service" "ai_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "vision.googleapis.com",
    "compute.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_dependent_services = false
  disable_on_destroy         = false
}

# Vertex AI Gemini 2.0 Ultra Model
resource "google_vertex_ai_model" "gemini_ultra" {
  name         = var.gemini_model_name
  display_name = var.gemini_model_display_name
  description  = "Gemini 2.0 Ultra model for travel concierge AI"
  region       = var.region
  
  depends_on = [google_project_service.ai_apis]
  
  metadata {
    model_garden_source {
      public_model_name = "gemini-2-0-ultra"
    }
  }
}

# Vertex AI Endpoint for Gemini
resource "google_vertex_ai_endpoint" "gemini_endpoint" {
  name         = var.gemini_endpoint_name
  display_name = var.gemini_endpoint_display_name
  description  = "Production endpoint for Gemini 2.0 Ultra"
  region       = var.region
  
  depends_on = [google_project_service.ai_apis]
}

# Deploy model to endpoint
resource "google_vertex_ai_endpoint_deployment" "gemini_deployment" {
  endpoint = google_vertex_ai_endpoint.gemini_endpoint.id
  
  model = google_vertex_ai_model.gemini_ultra.id
  
  display_name = "gemini-ultra-deployment"
  
  dedicated_resources {
    machine_spec {
      machine_type = var.gemini_machine_type
    }
    
    min_replica_count = var.gemini_min_replicas
    max_replica_count = var.gemini_max_replicas
  }
  
  depends_on = [google_vertex_ai_model.gemini_ultra, google_vertex_ai_endpoint.gemini_endpoint]
}

# GCS Bucket for AI assets
resource "google_storage_bucket" "ai_assets" {
  name          = var.ai_assets_bucket_name
  location      = var.region
  force_destroy = var.force_destroy_bucket
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
  
  depends_on = [google_project_service.ai_apis]
}

# GCS Bucket for Matching Engine embeddings
resource "google_storage_bucket" "embeddings" {
  name          = var.embeddings_bucket_name
  location      = var.region
  force_destroy = var.force_destroy_bucket
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  depends_on = [google_project_service.ai_apis]
}

# Matching Engine Index
resource "google_vertex_ai_index" "travel_embeddings" {
  name         = var.matching_engine_index_name
  display_name = var.matching_engine_index_display_name
  description  = "Travel destination and activity embeddings index"
  region       = var.region
  
  metadata {
    contents_delta_uri = "gs://${google_storage_bucket.embeddings.name}/embeddings/"
    config {
      dimensions = var.embedding_dimensions
      approximate_neighbors_count = var.approximate_neighbors_count
      distance_measure_type = "COSINE_DISTANCE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count = var.leaf_node_embedding_count
          leaf_nodes_to_search_percent = var.leaf_nodes_to_search_percent
        }
      }
    }
  }
  
  depends_on = [google_project_service.ai_apis, google_storage_bucket.embeddings]
}

# Matching Engine Index Endpoint
resource "google_vertex_ai_index_endpoint" "travel_embeddings_endpoint" {
  name         = var.matching_engine_endpoint_name
  display_name = var.matching_engine_endpoint_display_name
  description  = "Production endpoint for travel embeddings matching"
  region       = var.region
  
  depends_on = [google_project_service.ai_apis]
}

# Deploy index to endpoint
resource "google_vertex_ai_index_endpoint_deployment" "travel_embeddings_deployment" {
  index_endpoint = google_vertex_ai_index_endpoint.travel_embeddings_endpoint.id
  
  index = google_vertex_ai_index.travel_embeddings.id
  
  display_name = "travel-embeddings-deployment"
  
  dedicated_resources {
    machine_spec {
      machine_type = var.matching_engine_machine_type
    }
    
    min_replica_count = var.matching_engine_min_replicas
    max_replica_count = var.matching_engine_max_replicas
  }
  
  depends_on = [google_vertex_ai_index.travel_embeddings, google_vertex_ai_index_endpoint.travel_embeddings_endpoint]
}

# IAM Service Account for AI operations
resource "google_service_account" "ai_service_account" {
  account_id   = var.ai_service_account_name
  display_name = "AI Features Service Account"
  description  = "Service account for AI features (Gemini, Matching Engine, Vision API)"
  project      = var.project_id
}

# IAM roles for AI service account
resource "google_project_iam_member" "ai_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ai_service_account.email}"
}

resource "google_project_iam_member" "ai_vertex_ai_admin" {
  project = var.project_id
  role    = "roles/aiplatform.admin"
  member  = "serviceAccount:${google_service_account.ai_service_account.email}"
}

resource "google_project_iam_member" "ai_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.ai_service_account.email}"
}

resource "google_project_iam_member" "ai_vision_api_user" {
  project = var.project_id
  role    = "roles/ml.developer"
  member  = "serviceAccount:${google_service_account.ai_service_account.email}"
}

# Cloud Vision API quota increase (if needed)
resource "google_project_service" "vision_api_quota" {
  count = var.enable_vision_api_quota_increase ? 1 : 0
  
  project = var.project_id
  service = "vision.googleapis.com"
  
  depends_on = [google_project_service.ai_apis]
}

# Cloud KMS key for AI data encryption (optional)
resource "google_kms_key_ring" "ai_keyring" {
  count = var.enable_ai_encryption ? 1 : 0
  
  name     = var.ai_keyring_name
  location = var.region
  project  = var.project_id
}

resource "google_kms_crypto_key" "ai_encryption_key" {
  count = var.enable_ai_encryption ? 1 : 0
  
  name     = var.ai_encryption_key_name
  key_ring = google_kms_key_ring.ai_keyring[0].id
  
  lifecycle {
    prevent_destroy = true
  }
}

# IAM for KMS encryption
resource "google_kms_crypto_key_iam_member" "ai_encryption_user" {
  count = var.enable_ai_encryption ? 1 : 0
  
  crypto_key_id = google_kms_crypto_key.ai_encryption_key[0].id
  role           = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member         = "serviceAccount:${google_service_account.ai_service_account.email}"
}

# Cloud Monitoring for AI features
resource "google_monitoring_custom_service" "ai_features" {
  service_id   = var.ai_monitoring_service_id
  display_name = "AI Features Monitoring"
  project      = var.project_id
}

# Cloud Logging for AI features
resource "google_logging_project_sink" "ai_features_logs" {
  name        = var.ai_logging_sink_name
  destination = "pubsub.googleapis.com/projects/${var.project_id}/topics/${var.ai_logging_topic_name}"
  filter      = "resource.type=\"aiplatform.googleapis.com/Model\" OR resource.type=\"aiplatform.googleapis.com/Endpoint\""
  project     = var.project_id
  
  unique_writer_identity = true
}

# Pub/Sub topic for AI logging
resource "google_pubsub_topic" "ai_logging_topic" {
  name    = var.ai_logging_topic_name
  project = var.project_id
}

# IAM for logging sink
resource "google_pubsub_topic_iam_member" "ai_logging_publisher" {
  topic  = google_pubsub_topic.ai_logging_topic.name
  role   = "roles/pubsub.publisher"
  member = google_logging_project_sink.ai_features_logs.writer_identity
} 