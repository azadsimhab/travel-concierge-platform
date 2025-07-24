# Travel Concierge Platform - Complete Setup Guide

## 🚀 Quick Setup Checklist

### 1. Prerequisites Installation

#### Install Google Cloud CLI
```bash
# Download and install from: https://cloud.google.com/sdk/docs/install
# After installation, authenticate:
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

#### Install Node.js and Python
```bash
# Node.js 18+ required
node --version  # Should be 18.0.0 or higher

# Python 3.11+ required  
python --version  # Should be 3.11.0 or higher
```

#### Install Poetry (for ADK agents)
```bash
curl -sSL https://install.python-poetry.org | python3 -
# Or on Windows:
# (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

### 2. Google Cloud Project Setup

#### Create New Project (if needed)
```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
gcloud billing accounts list
gcloud billing projects link YOUR_PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

#### Enable Required APIs
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable places-backend.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable vision.googleapis.com
```

#### Create Service Account
```bash
gcloud iam service-accounts create travel-concierge-sa \
    --description="Travel Concierge Service Account" \
    --display-name="Travel Concierge SA"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:travel-concierge-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:travel-concierge-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Download service account key
gcloud iam service-accounts keys create service-account.json \
    --iam-account=travel-concierge-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. API Keys Setup

#### Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Click "Create Credentials" > "API Key"
4. Restrict the key to "Places API"
5. Copy the API key

#### OpenAI API Key (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account and navigate to API keys
3. Generate new API key

### 4. Database Setup Options

#### Option A: Firestore (Recommended for Cloud)
```bash
# Initialize Firestore in your project
gcloud firestore databases create --region=us-central1
```

#### Option B: PostgreSQL (Local Development)
```bash
# Using Docker
docker run -d \
  --name travel-concierge-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=travel_concierge \
  -p 5432:5432 \
  postgres:14

# Or install locally and create database
createdb travel_concierge
```

### 5. Environment Configuration

#### ADK Travel Concierge (.env)
```bash
cd adk-samples/agents/travel-concierge
cp .env.example .env
# Edit .env with your values:
```

#### Backend API (.env)
```bash
cd travel-concierge-platform/backend
cp .env.example .env
# Edit .env with your values:
```

### 6. Installation Commands

#### Main Platform
```bash
cd travel-concierge-platform

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend  
cd ../frontend
npm install
npm run build

# Install Playwright browsers
npx playwright install
```

#### ADK Agents
```bash
cd adk-samples/agents/travel-concierge
poetry install
poetry install --with dev --with deployment
```

### 7. Testing Setup

#### Run Backend Tests
```bash
cd travel-concierge-platform/backend
python -c "from api.main import app; print('Backend OK')"
```

#### Run Frontend Tests
```bash
cd travel-concierge-platform/frontend
npm run build
npm run lint
```

#### Run E2E Tests
```bash
cd travel-concierge-platform
npx playwright test --reporter=list
```

#### Test ADK Agents
```bash
cd adk-samples/agents/travel-concierge
adk run travel_concierge
# Or web interface:
adk web
```

### 8. Running the Platform

#### Development Mode
```bash
# Terminal 1: Backend
cd travel-concierge-platform/backend
source venv/bin/activate
python api/main.py

# Terminal 2: Frontend
cd travel-concierge-platform/frontend  
npm run dev

# Terminal 3: ADK Agents (optional)
cd adk-samples/agents/travel-concierge
adk web
```

#### Production Mode
```bash
cd travel-concierge-platform
npm run deploy:infrastructure
npm run deploy:application
```

## 🔧 Troubleshooting

### Common Issues

#### "Module not found: google.adk"
```bash
pip install --upgrade google-adk
# Or install from source if needed
```

#### "Playwright browsers not found"
```bash
npx playwright install
```

#### "Firestore permission denied"
```bash
gcloud auth application-default login
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

#### "Port already in use"
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Or use different port
uvicorn api.main:app --port 8001
```

### Environment Validation

Run this script to validate your setup:

```bash
# Create validation script
cat > validate_setup.py << 'EOF'
import os
import sys

def check_env_var(name, required=True):
    value = os.getenv(name)
    if value and value != "YOUR_VALUE_HERE":
        print(f"✅ {name}: configured")
        return True
    elif required:
        print(f"❌ {name}: missing or template value")
        return False
    else:
        print(f"⚠️ {name}: optional, not configured")
        return True

def main():
    print("🔍 Validating Travel Concierge Setup...")
    
    required_vars = [
        "GOOGLE_CLOUD_PROJECT",
        "GOOGLE_PLACES_API_KEY"
    ]
    
    optional_vars = [
        "OPENAI_API_KEY",
        "GOOGLE_API_KEY"
    ]
    
    all_good = True
    
    for var in required_vars:
        if not check_env_var(var, required=True):
            all_good = False
    
    for var in optional_vars:
        check_env_var(var, required=False)
    
    # Test imports
    try:
        import fastapi
        print("✅ FastAPI: installed")
    except ImportError:
        print("❌ FastAPI: not installed")
        all_good = False
    
    try:
        import google.cloud
        print("✅ Google Cloud: installed")
    except ImportError:
        print("❌ Google Cloud: not installed")
        all_good = False
    
    if all_good:
        print("\n🎉 Setup validation passed! You're ready to go.")
    else:
        print("\n🔧 Please fix the issues above before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

python validate_setup.py
```

## 🎯 Next Steps

1. **Start with Local Development**: Use the development mode setup first
2. **Test Core Features**: Verify chat, image search, and booking work
3. **Configure Production**: Set up cloud deployment when ready
4. **Monitor & Scale**: Use the monitoring stack for production use

## 📞 Support

- Check CLAUDE.md for development commands
- Review logs in `travel-concierge-platform/logs/`
- Test individual components using the validation scripts above