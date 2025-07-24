#!/usr/bin/env python3
"""
Google Cloud Platform Authentication Setup Script
Helps configure GCP authentication for Travel Concierge Platform
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def run_command(command, capture_output=True):
    """Run a shell command and return the result"""
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
        else:
            result = subprocess.run(command, shell=True)
            return result.returncode == 0, "", ""
    except Exception as e:
        return False, "", str(e)

def check_gcloud_installed():
    """Check if gcloud CLI is installed"""
    success, stdout, stderr = run_command("gcloud version")
    if success and "Google Cloud SDK" in stdout:
        print("✅ Google Cloud CLI is installed")
        return True
    else:
        print("❌ Google Cloud CLI not found")
        print("Please install from: https://cloud.google.com/sdk/docs/install")
        return False

def get_current_project():
    """Get currently configured GCP project"""
    success, project_id, stderr = run_command("gcloud config get-value project")
    if success and project_id and project_id != "":
        return project_id
    return None

def list_projects():
    """List available GCP projects"""
    success, stdout, stderr = run_command("gcloud projects list --format='value(projectId,name)'")
    if success:
        projects = []
        for line in stdout.split('\n'):
            if line.strip():
                parts = line.split('\t')
                if len(parts) >= 2:
                    projects.append({'id': parts[0], 'name': parts[1]})
        return projects
    return []

def setup_project(project_id=None):
    """Set up GCP project configuration"""
    if not project_id:
        # List available projects
        projects = list_projects()
        if not projects:
            print("❌ No GCP projects found")
            print("Please create a project at: https://console.cloud.google.com/")
            return False
        
        print("\nAvailable GCP Projects:")
        for i, project in enumerate(projects):
            print(f"{i+1}. {project['id']} ({project['name']})")
        
        try:
            choice = input("\nSelect project number (or press Enter for current): ").strip()
            if choice:
                project_id = projects[int(choice)-1]['id']
            else:
                project_id = get_current_project()
                if not project_id:
                    print("❌ No current project set")
                    return False
        except (ValueError, IndexError):
            print("❌ Invalid selection")
            return False
    
    # Set project
    success, stdout, stderr = run_command(f"gcloud config set project {project_id}")
    if success:
        print(f"✅ Project set to: {project_id}")
        return project_id
    else:
        print(f"❌ Failed to set project: {stderr}")
        return False

def authenticate_user():
    """Authenticate user with Google Cloud"""
    print("🔐 Setting up user authentication...")
    success, stdout, stderr = run_command("gcloud auth application-default login", capture_output=False)
    if success:
        print("✅ User authentication successful")
        return True
    else:
        print(f"❌ Authentication failed: {stderr}")
        return False

def enable_apis(project_id):
    """Enable required APIs for the project"""
    apis = [
        "aiplatform.googleapis.com",
        "places-backend.googleapis.com", 
        "firestore.googleapis.com",
        "pubsub.googleapis.com",
        "speech.googleapis.com",
        "vision.googleapis.com"
    ]
    
    print(f"🔧 Enabling APIs for project {project_id}...")
    for api in apis:
        success, stdout, stderr = run_command(f"gcloud services enable {api}")
        if success:
            print(f"✅ Enabled {api}")
        else:
            print(f"⚠️  Failed to enable {api}: {stderr}")
    
    return True

def create_service_account(project_id):
    """Create service account for the application"""
    service_account_name = "travel-concierge-sa"
    service_account_email = f"{service_account_name}@{project_id}.iam.gserviceaccount.com"
    
    print(f"👤 Creating service account: {service_account_name}")
    
    # Create service account
    success, stdout, stderr = run_command(f"""
        gcloud iam service-accounts create {service_account_name} \
            --description="Travel Concierge Service Account" \
            --display-name="Travel Concierge SA"
    """)
    
    if not success and "already exists" not in stderr:
        print(f"❌ Failed to create service account: {stderr}")
        return False
    elif "already exists" in stderr:
        print(f"ℹ️  Service account already exists")
    else:
        print(f"✅ Service account created")
    
    # Grant roles
    roles = [
        "roles/aiplatform.user",
        "roles/datastore.user",
        "roles/pubsub.editor",  
        "roles/storage.objectAdmin"
    ]
    
    for role in roles:
        success, stdout, stderr = run_command(f"""
            gcloud projects add-iam-policy-binding {project_id} \
                --member="serviceAccount:{service_account_email}" \
                --role="{role}"
        """)
        if success:
            print(f"✅ Granted role: {role}")
        else:
            print(f"⚠️  Failed to grant role {role}: {stderr}")
    
    # Download service account key
    key_file = "service-account.json"
    success, stdout, stderr = run_command(f"""
        gcloud iam service-accounts keys create {key_file} \
            --iam-account={service_account_email}
    """)
    
    if success:
        print(f"✅ Service account key downloaded: {key_file}")
        return key_file
    else:
        print(f"❌ Failed to download key: {stderr}")
        return False

def setup_firestore(project_id):
    """Initialize Firestore database"""
    print("🗄️  Setting up Firestore database...")
    
    # Check if Firestore is already initialized
    success, stdout, stderr = run_command(f"gcloud firestore databases describe --project={project_id}")
    if success:
        print("ℹ️  Firestore database already exists")
        return True
    
    # Create Firestore database
    success, stdout, stderr = run_command(f"gcloud firestore databases create --region=us-central1 --project={project_id}")
    if success:
        print("✅ Firestore database created")
        return True
    else:
        print(f"⚠️  Firestore setup failed: {stderr}")
        print("You can set it up manually at: https://console.firebase.google.com/")
        return False

def update_env_files(project_id, service_account_key):
    """Update environment files with GCP configuration"""
    print("📝 Updating environment files...")
    
    # Update ADK .env file
    adk_env_path = Path("adk-samples/agents/travel-concierge/.env")
    if adk_env_path.exists():
        with open(adk_env_path, 'r') as f:
            content = f.read()
        
        content = content.replace("your-gcp-project-id", project_id)
        content = content.replace("./service-account.json", f"../../../{service_account_key}")
        
        with open(adk_env_path, 'w') as f:
            f.write(content)
        print(f"✅ Updated {adk_env_path}")
    
    # Update backend .env file
    backend_env_path = Path("backend/.env")
    if backend_env_path.exists():
        with open(backend_env_path, 'r') as f:
            content = f.read()
        
        content = content.replace("your-gcp-project-id", project_id)
        content = content.replace("./service-account.json", f"../{service_account_key}")
        
        with open(backend_env_path, 'w') as f:
            f.write(content)
        print(f"✅ Updated {backend_env_path}")
    
    return True

def main():
    """Main setup function"""
    print("🚀 Travel Concierge GCP Authentication Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_gcloud_installed():
        return False
    
    # Setup project
    print("\n📋 Step 1: Project Configuration")
    project_id = setup_project()
    if not project_id:
        return False
    
    # Authenticate user
    print("\n🔐 Step 2: User Authentication")
    if not authenticate_user():
        return False
    
    # Enable APIs
    print("\n🔧 Step 3: Enable APIs")
    enable_apis(project_id)
    
    # Create service account
    print("\n👤 Step 4: Service Account")
    service_account_key = create_service_account(project_id)
    if not service_account_key:
        return False
    
    # Setup Firestore
    print("\n🗄️  Step 5: Firestore Database")
    setup_firestore(project_id)
    
    # Update environment files
    print("\n📝 Step 6: Environment Configuration")
    update_env_files(project_id, service_account_key)
    
    print("\n🎉 GCP Authentication Setup Complete!")
    print(f"Project ID: {project_id}")
    print(f"Service Account Key: {service_account_key}")
    print("\n📋 Next Steps:")
    print("1. Get Google Places API key from: https://console.cloud.google.com/apis/credentials")
    print("2. Update .env files with your API keys")
    print("3. Test the setup with: python -c 'from google.cloud import firestore; print(\"GCP connection OK\")'")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)