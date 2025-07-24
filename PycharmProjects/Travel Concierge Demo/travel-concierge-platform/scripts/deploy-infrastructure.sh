#!/bin/bash

# Complete Infrastructure Deployment Script
# Deploys all GCP infrastructure for Travel Concierge Platform

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-travel-concierge-prod}"
REGION="${REGION:-us-central1}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo "🚀 Starting infrastructure deployment for Travel Concierge Platform"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"

# =============================================================================
# PREREQUISITES CHECK
# =============================================================================

echo "📋 Checking prerequisites..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Check if project exists
if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
    echo "❌ Error: Project $PROJECT_ID does not exist or you don't have access"
    exit 1
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
APIS=(
    "compute.googleapis.com"
    "container.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "aiplatform.googleapis.com"
    "pubsub.googleapis.com"
    "firestore.googleapis.com"
    "storage.googleapis.com"
    "vision.googleapis.com"
    "cloudkms.googleapis.com"
    "monitoring.googleapis.com"
    "logging.googleapis.com"
    "cloudtrace.googleapis.com"
    "cloudprofiler.googleapis.com"
    "iam.googleapis.com"
    "serviceusage.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo "Enabling $api..."
    gcloud services enable "$api" --project="$PROJECT_ID"
done

# =============================================================================
# TERRAFORM DEPLOYMENT
# =============================================================================

echo "🏗️  Deploying Terraform infrastructure..."

# Navigate to terraform directory
cd terraform

# Initialize Terraform
echo "Initializing Terraform..."
terraform init \
    -backend-config="bucket=$PROJECT_ID-terraform-state" \
    -backend-config="prefix=infrastructure"

# Plan the deployment
echo "Planning Terraform deployment..."
terraform plan \
    -var="project_id=$PROJECT_ID" \
    -var="region=$REGION" \
    -var="environment=$ENVIRONMENT" \
    -out=tfplan

# Apply the deployment
echo "Applying Terraform deployment..."
terraform apply tfplan

# Get outputs
echo "📊 Infrastructure outputs:"
terraform output

cd ..

# =============================================================================
# AI FEATURES DEPLOYMENT
# =============================================================================

echo "🤖 Deploying AI features..."

cd terraform

# Initialize AI features Terraform
echo "Initializing AI features Terraform..."
terraform init \
    -backend-config="bucket=$PROJECT_ID-terraform-state" \
    -backend-config="prefix=ai-features"

# Plan AI features deployment
echo "Planning AI features deployment..."
terraform plan \
    -var="project_id=$PROJECT_ID" \
    -var="region=$REGION" \
    -var="environment=$ENVIRONMENT" \
    -out=ai-features-plan

# Apply AI features deployment
echo "Applying AI features deployment..."
terraform apply ai-features-plan

cd ..

# =============================================================================
# KUBERNETES CLUSTER CONFIGURATION
# =============================================================================

echo "⚙️  Configuring Kubernetes cluster..."

# Get cluster credentials
gcloud container clusters get-credentials "travel-concierge-cluster" \
    --region="$REGION" \
    --project="$PROJECT_ID"

# Create namespaces
echo "Creating Kubernetes namespaces..."
kubectl create namespace travel-concierge --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

echo "🔒 Configuring security..."

# Create service accounts
echo "Creating service accounts..."
gcloud iam service-accounts create orchestrator-service \
    --display-name="Orchestrator Service Account" \
    --project="$PROJECT_ID"

gcloud iam service-accounts create image-search-agent \
    --display-name="Image Search Agent Service Account" \
    --project="$PROJECT_ID"

# Grant necessary permissions
echo "Granting IAM permissions..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:orchestrator-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:orchestrator-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:orchestrator-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:image-search-agent@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:image-search-agent@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# =============================================================================
# MONITORING SETUP
# =============================================================================

echo "📊 Setting up monitoring..."

# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml -n monitoring

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml -n monitoring

# Deploy AlertManager
kubectl apply -f k8s/monitoring/alertmanager.yaml -n monitoring

# =============================================================================
# LOGGING SETUP
# =============================================================================

echo "📝 Setting up logging..."

# Deploy Fluentd
kubectl apply -f k8s/logging/fluentd.yaml -n logging

# Configure Cloud Logging
gcloud logging sinks create travel-concierge-logs \
    storage.googleapis.com/travel-concierge-logs \
    --project="$PROJECT_ID" \
    --log-filter="resource.type=\"k8s_container\" AND resource.labels.namespace_name=\"travel-concierge\""

# =============================================================================
# NETWORKING CONFIGURATION
# =============================================================================

echo "🌐 Configuring networking..."

# Deploy Istio (if using service mesh)
kubectl apply -f k8s/networking/istio.yaml

# Configure ingress
kubectl apply -f k8s/networking/ingress.yaml -n travel-concierge

# =============================================================================
# SECRETS MANAGEMENT
# =============================================================================

echo "🔐 Setting up secrets management..."

# Create Kubernetes secrets
kubectl create secret generic orchestrator-secrets \
    --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
    --from-literal=GOOGLE_APPLICATION_CREDENTIALS="$(cat service-account-key.json | base64)" \
    -n travel-concierge

# =============================================================================
# VERIFICATION
# =============================================================================

echo "✅ Verifying deployment..."

# Check cluster status
echo "Checking cluster status..."
kubectl get nodes

# Check namespaces
echo "Checking namespaces..."
kubectl get namespaces

# Check AI features
echo "Checking AI features..."
gcloud ai endpoints list --region="$REGION" --project="$PROJECT_ID"
gcloud ai models list --region="$REGION" --project="$PROJECT_ID"

# Check Pub/Sub topics
echo "Checking Pub/Sub topics..."
gcloud pubsub topics list --project="$PROJECT_ID"

# Check Firestore
echo "Checking Firestore..."
gcloud firestore databases list --project="$PROJECT_ID"

echo "🎉 Infrastructure deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy application services: ./scripts/deploy-services.sh"
echo "2. Run end-to-end tests: ./scripts/run-e2e-tests.sh"
echo "3. Configure monitoring alerts: ./scripts/setup-alerts.sh"
echo ""
echo "Useful commands:"
echo "- View cluster: kubectl cluster-info"
echo "- View pods: kubectl get pods -n travel-concierge"
echo "- View services: kubectl get services -n travel-concierge"
echo "- View logs: kubectl logs -f deployment/orchestrator-service -n travel-concierge" 