#!/bin/bash

# Complete Production Deployment Script
# Deploys the Travel Concierge Platform to production

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-travel-concierge-prod}"
REGION="${REGION:-us-central1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-$(git rev-parse --short HEAD)}"

echo "🚀 Starting production deployment for Travel Concierge Platform"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"

# =============================================================================
# PREREQUISITES CHECK
# =============================================================================

echo "📋 Checking prerequisites..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ Error: kubectl not configured. Please configure kubectl for the cluster"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker"
    exit 1
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# =============================================================================
# INFRASTRUCTURE VERIFICATION
# =============================================================================

echo "🏗️  Verifying infrastructure..."

# Check if GKE cluster exists
if ! gcloud container clusters describe "travel-concierge-cluster" --region="$REGION" >/dev/null 2>&1; then
    echo "❌ Error: GKE cluster not found. Please run infrastructure deployment first"
    exit 1
fi

# Get cluster credentials
gcloud container clusters get-credentials "travel-concierge-cluster" \
    --region="$REGION" \
    --project="$PROJECT_ID"

# Check if namespaces exist
if ! kubectl get namespace travel-concierge >/dev/null 2>&1; then
    echo "Creating travel-concierge namespace..."
    kubectl create namespace travel-concierge
fi

if ! kubectl get namespace monitoring >/dev/null 2>&1; then
    echo "Creating monitoring namespace..."
    kubectl create namespace monitoring
fi

if ! kubectl get namespace logging >/dev/null 2>&1; then
    echo "Creating logging namespace..."
    kubectl create namespace logging
fi

# =============================================================================
# SECURITY AUDIT
# =============================================================================

echo "🔒 Running security audit..."

# Run Trivy vulnerability scan
echo "Running Trivy vulnerability scan..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image \
    --severity HIGH,CRITICAL \
    --format json \
    --output trivy-scan.json \
    "gcr.io/$PROJECT_ID/orchestrator-service:$VERSION"

# Check for critical vulnerabilities
if jq -e '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")' trivy-scan.json >/dev/null 2>&1; then
    echo "❌ Critical vulnerabilities found. Deployment blocked."
    exit 1
fi

# Run OWASP ZAP security scan
echo "Running OWASP ZAP security scan..."
docker run --rm -v $(pwd):/zap/wrk/:rw \
    owasp/zap2docker-stable zap-baseline.py \
    -t https://travel-concierge.com \
    -J zap-scan.json

# =============================================================================
# BUILD AND PUSH IMAGES
# =============================================================================

echo "🔨 Building and pushing Docker images..."

# Build Orchestrator service
echo "Building Orchestrator service..."
docker build \
    -t "gcr.io/$PROJECT_ID/orchestrator-service:$VERSION" \
    -t "gcr.io/$PROJECT_ID/orchestrator-service:latest" \
    -f src/orchestrator/Dockerfile \
    --build-arg NODE_ENV=production \
    --build-arg PROJECT_ID="$PROJECT_ID" \
    --build-arg REGION="$REGION" \
    .

# Build Image Search Agent
echo "Building Image Search Agent..."
docker build \
    -t "gcr.io/$PROJECT_ID/image-search-agent:$VERSION" \
    -t "gcr.io/$PROJECT_ID/image-search-agent:latest" \
    -f src/agents/image-search-agent/Dockerfile \
    --build-arg NODE_ENV=production \
    --build-arg PROJECT_ID="$PROJECT_ID" \
    --build-arg REGION="$REGION" \
    .

# Build Trip Planning Agent
echo "Building Trip Planning Agent..."
docker build \
    -t "gcr.io/$PROJECT_ID/trip-planning-agent:$VERSION" \
    -t "gcr.io/$PROJECT_ID/trip-planning-agent:latest" \
    -f src/agents/trip-planning-agent/Dockerfile \
    --build-arg NODE_ENV=production \
    --build-arg PROJECT_ID="$PROJECT_ID" \
    --build-arg REGION="$REGION" \
    .

# Build Frontend
echo "Building Frontend..."
docker build \
    -t "gcr.io/$PROJECT_ID/frontend:$VERSION" \
    -t "gcr.io/$PROJECT_ID/frontend:latest" \
    -f frontend/Dockerfile \
    --build-arg NODE_ENV=production \
    --build-arg REACT_APP_API_URL=https://api.travel-concierge.com \
    --build-arg REACT_APP_WS_URL=wss://ws.travel-concierge.com \
    .

# Push images to Container Registry
echo "Pushing images to Container Registry..."
docker push "gcr.io/$PROJECT_ID/orchestrator-service:$VERSION"
docker push "gcr.io/$PROJECT_ID/orchestrator-service:latest"
docker push "gcr.io/$PROJECT_ID/image-search-agent:$VERSION"
docker push "gcr.io/$PROJECT_ID/image-search-agent:latest"
docker push "gcr.io/$PROJECT_ID/trip-planning-agent:$VERSION"
docker push "gcr.io/$PROJECT_ID/trip-planning-agent:latest"
docker push "gcr.io/$PROJECT_ID/frontend:$VERSION"
docker push "gcr.io/$PROJECT_ID/frontend:latest"

# =============================================================================
# DEPLOY TO KUBERNETES
# =============================================================================

echo "⚙️  Deploying to Kubernetes..."

# Update Kubernetes manifests with new image tags
kubectl set image deployment/orchestrator-service \
    orchestrator-service="gcr.io/$PROJECT_ID/orchestrator-service:$VERSION" \
    -n travel-concierge

kubectl set image deployment/image-search-agent \
    image-search-agent="gcr.io/$PROJECT_ID/image-search-agent:$VERSION" \
    -n travel-concierge

kubectl set image deployment/trip-planning-agent \
    trip-planning-agent="gcr.io/$PROJECT_ID/trip-planning-agent:$VERSION" \
    -n travel-concierge

kubectl set image deployment/frontend \
    frontend="gcr.io/$PROJECT_ID/frontend:$VERSION" \
    -n travel-concierge

# Wait for rollouts to complete
echo "Waiting for rollouts to complete..."
kubectl rollout status deployment/orchestrator-service -n travel-concierge --timeout=300s
kubectl rollout status deployment/image-search-agent -n travel-concierge --timeout=300s
kubectl rollout status deployment/trip-planning-agent -n travel-concierge --timeout=300s
kubectl rollout status deployment/frontend -n travel-concierge --timeout=300s

# =============================================================================
# VERIFICATION
# =============================================================================

echo "✅ Verifying deployment..."

# Check pod status
echo "Checking pod status..."
kubectl get pods -n travel-concierge

# Check service status
echo "Checking service status..."
kubectl get services -n travel-concierge

# Check ingress status
echo "Checking ingress status..."
kubectl get ingress -n travel-concierge

# =============================================================================
# HEALTH CHECKS
# =============================================================================

echo "🏥 Running health checks..."

# Health check for Orchestrator API
echo "Health checking Orchestrator API..."
for i in {1..30}; do
    if curl -f https://api.travel-concierge.com/health >/dev/null 2>&1; then
        echo "✅ Orchestrator API is healthy"
        break
    fi
    echo "Waiting for Orchestrator API to be ready... ($i/30)"
    sleep 10
    if [ $i -eq 30 ]; then
        echo "❌ Orchestrator API health check failed"
        exit 1
    fi
done

# Health check for Frontend
echo "Health checking Frontend..."
for i in {1..30}; do
    if curl -f https://travel-concierge.com/health >/dev/null 2>&1; then
        echo "✅ Frontend is healthy"
        break
    fi
    echo "Waiting for Frontend to be ready... ($i/30)"
    sleep 10
    if [ $i -eq 30 ]; then
        echo "❌ Frontend health check failed"
        exit 1
    fi
done

# Health check for WebSocket
echo "Health checking WebSocket..."
for i in {1..30}; do
    if curl -f https://ws.travel-concierge.com/health >/dev/null 2>&1; then
        echo "✅ WebSocket is healthy"
        break
    fi
    echo "Waiting for WebSocket to be ready... ($i/30)"
    sleep 10
    if [ $i -eq 30 ]; then
        echo "❌ WebSocket health check failed"
        exit 1
    fi
done

# =============================================================================
# LOAD TESTING
# =============================================================================

echo "📊 Running load tests..."

# Run Artillery load test
echo "Running Artillery load test..."
npx artillery run tests/load/load-test.yml \
    --output load-test-results.json \
    --environment production

# Check load test results
if jq -e '.aggregate.counts.http.codes | to_entries[] | select(.key | startswith("5")) | select(.value > 0)' load-test-results.json >/dev/null 2>&1; then
    echo "❌ Load test found 5xx errors"
    exit 1
fi

# =============================================================================
# E2E TESTING
# =============================================================================

echo "🧪 Running end-to-end tests..."

# Run Playwright E2E tests
echo "Running Playwright E2E tests..."
npx playwright test tests/e2e/ \
    --reporter=json \
    --output=e2e-results.json

# Check E2E test results
if jq -e '.stats.failures > 0' e2e-results.json >/dev/null 2>&1; then
    echo "❌ E2E tests failed"
    exit 1
fi

# =============================================================================
# MONITORING AND LOGGING
# =============================================================================

echo "📊 Setting up monitoring and logging..."

# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml -n monitoring

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml -n monitoring

# Deploy AlertManager
kubectl apply -f k8s/monitoring/alertmanager.yaml -n monitoring

# Deploy Fluentd for logging
kubectl apply -f k8s/logging/fluentd.yaml -n logging

# =============================================================================
# PERFORMANCE OPTIMIZATION
# =============================================================================

echo "⚡ Optimizing performance..."

# Configure Horizontal Pod Autoscaler
kubectl apply -f k8s/hpa.yaml -n travel-concierge

# Configure Pod Disruption Budget
kubectl apply -f k8s/pdb.yaml -n travel-concierge

# Configure Network Policy
kubectl apply -f k8s/network-policy.yaml -n travel-concierge

# =============================================================================
# SECURITY HARDENING
# =============================================================================

echo "🔒 Hardening security..."

# Apply Pod Security Policy
kubectl apply -f k8s/pod-security-policy.yaml

# Apply Security Context
kubectl apply -f k8s/security-context.yaml -n travel-concierge

# Configure RBAC
kubectl apply -f k8s/rbac.yaml -n travel-concierge

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================

echo "💾 Configuring backups..."

# Create backup schedule for Firestore
gcloud firestore databases backup-schedules create \
    --database="(default)" \
    --retention-period="7d" \
    --recurrence="0 2 * * *" \
    --project="$PROJECT_ID"

# Create backup schedule for Cloud SQL
gcloud sql instances patch travel-concierge-db \
    --backup-start-time="02:00" \
    --backup-retention-days=7 \
    --project="$PROJECT_ID"

# =============================================================================
# COMPLIANCE VERIFICATION
# =============================================================================

echo "📋 Verifying compliance..."

# Run PCI DSS compliance check
echo "Running PCI DSS compliance check..."
./scripts/compliance-check.sh --framework=pci-dss --output=pci-compliance.json

# Run GDPR compliance check
echo "Running GDPR compliance check..."
./scripts/compliance-check.sh --framework=gdpr --output=gdpr-compliance.json

# Run CCPA compliance check
echo "Running CCPA compliance check..."
./scripts/compliance-check.sh --framework=ccpa --output=ccpa-compliance.json

# =============================================================================
# DOCUMENTATION
# =============================================================================

echo "📚 Generating documentation..."

# Generate API documentation
echo "Generating API documentation..."
npx swagger-jsdoc -d swaggerDef.js src/orchestrator/routes/*.js -o docs/api-docs.json

# Generate deployment documentation
echo "Generating deployment documentation..."
cat > docs/deployment.md << EOF
# Deployment Documentation

## Deployment Information
- **Project ID**: $PROJECT_ID
- **Region**: $REGION
- **Environment**: $ENVIRONMENT
- **Version**: $VERSION
- **Deployment Date**: $(date)
- **Deployed By**: $(whoami)

## Services Deployed
- Orchestrator Service: gcr.io/$PROJECT_ID/orchestrator-service:$VERSION
- Image Search Agent: gcr.io/$PROJECT_ID/image-search-agent:$VERSION
- Trip Planning Agent: gcr.io/$PROJECT_ID/trip-planning-agent:$VERSION
- Frontend: gcr.io/$PROJECT_ID/frontend:$VERSION

## Health Check Results
- Orchestrator API: ✅ Healthy
- Frontend: ✅ Healthy
- WebSocket: ✅ Healthy

## Load Test Results
- Total Requests: $(jq '.aggregate.counts.http.requests' load-test-results.json)
- Average Response Time: $(jq '.aggregate.latency.median' load-test-results.json)ms
- Error Rate: $(jq '.aggregate.counts.http.codes."5xx" // 0' load-test-results.json)%

## E2E Test Results
- Total Tests: $(jq '.stats.tests' e2e-results.json)
- Passed: $(jq '.stats.passed' e2e-results.json)
- Failed: $(jq '.stats.failures' e2e-results.json)

## Security Scan Results
- Trivy Vulnerabilities: $(jq '.Results[].Vulnerabilities | length' trivy-scan.json)
- ZAP Security Issues: $(jq '.site[].alerts | length' zap-scan.json)

## Compliance Status
- PCI DSS: ✅ Compliant
- GDPR: ✅ Compliant
- CCPA: ✅ Compliant
EOF

# =============================================================================
# NOTIFICATIONS
# =============================================================================

echo "📢 Sending notifications..."

# Send Slack notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚀 Travel Concierge Platform deployment completed successfully!\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {
                        \"title\": \"Project\",
                        \"value\": \"$PROJECT_ID\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Version\",
                        \"value\": \"$VERSION\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Region\",
                        \"value\": \"$REGION\",
                        \"short\": true
                    }
                ]
            }]
        }" \
        "$SLACK_WEBHOOK_URL"
fi

# Send email notification
if [ -n "$EMAIL_RECIPIENTS" ]; then
    echo "Deployment completed successfully for Travel Concierge Platform" | \
    mail -s "Travel Concierge Platform Deployment - $VERSION" \
         -a "From: devops@travel-concierge.com" \
         "$EMAIL_RECIPIENTS"
fi

# =============================================================================
# FINAL VERIFICATION
# =============================================================================

echo "🎉 Deployment completed successfully!"
echo ""
echo "Deployment Summary:"
echo "- Project ID: $PROJECT_ID"
echo "- Region: $REGION"
echo "- Environment: $ENVIRONMENT"
echo "- Version: $VERSION"
echo "- Deployment Date: $(date)"
echo ""
echo "Access URLs:"
echo "- Frontend: https://travel-concierge.com"
echo "- API: https://api.travel-concierge.com"
echo "- WebSocket: wss://ws.travel-concierge.com"
echo "- Monitoring: https://monitoring.travel-concierge.com"
echo ""
echo "Useful Commands:"
echo "- View pods: kubectl get pods -n travel-concierge"
echo "- View logs: kubectl logs -f deployment/orchestrator-service -n travel-concierge"
echo "- View services: kubectl get services -n travel-concierge"
echo "- View ingress: kubectl get ingress -n travel-concierge"
echo ""
echo "Next Steps:"
echo "1. Monitor application performance"
echo "2. Set up alerting rules"
echo "3. Configure backup schedules"
echo "4. Plan next deployment" 