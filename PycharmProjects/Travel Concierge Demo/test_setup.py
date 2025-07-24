#!/usr/bin/env python3
"""
Travel Concierge Platform - Integration Test Script
Tests all components to verify setup is working correctly
"""

import os
import sys
import json
import requests
import sqlite3
import subprocess
from pathlib import Path
from datetime import datetime

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*50}")
    print(f"🧪 {title}")
    print(f"{'='*50}")

def print_test(name, success, details=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {name}")
    if details:
        print(f"    {details}")

def test_python_dependencies():
    """Test Python dependencies are installed"""
    print_header("Python Dependencies")
    
    dependencies = [
        "fastapi",
        "uvicorn", 
        "pydantic",
        "python-dotenv",
        "requests"
    ]
    
    all_good = True
    for dep in dependencies:
        try:
            __import__(dep.replace("-", "_"))
            print_test(f"{dep} installed", True)
        except ImportError:
            print_test(f"{dep} installed", False, f"Run: pip install {dep}")
            all_good = False
    
    return all_good

def test_backend_import():
    """Test backend API can be imported"""
    print_header("Backend API Import")
    
    try:
        sys.path.append('travel-concierge-platform/backend')
        from api.main import app, orchestrator
        print_test("Backend API imports", True, f"App type: {type(app)}")
        print_test("Agent orchestrator", True, f"Agents: {len(orchestrator.agents)}")
        return True
    except Exception as e:
        print_test("Backend API imports", False, str(e))
        return False

def test_database_connection():
    """Test database connection"""
    print_header("Database Connection")
    
    try:
        # Test SQLite database
        db_path = "travel-concierge-platform/backend/travel_concierge.db"
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Test table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            table_names = [table[0] for table in tables]
            
            expected_tables = ['travel_sessions', 'user_profiles', 'bookings']
            for table in expected_tables:
                if table in table_names:
                    print_test(f"Table '{table}' exists", True)
                else:
                    print_test(f"Table '{table}' exists", False)
            
            # Test sample data
            cursor.execute("SELECT COUNT(*) FROM user_profiles")
            count = cursor.fetchone()[0]
            print_test("Sample data exists", count > 0, f"{count} user profiles")
            
            cursor.close()
            conn.close()
            return True
        else:
            print_test("Database file exists", False, f"File not found: {db_path}")
            return False
            
    except Exception as e:
        print_test("Database connection", False, str(e))
        return False

def test_environment_config():
    """Test environment configuration"""
    print_header("Environment Configuration")
    
    # Check .env files exist
    env_files = [
        "adk-samples/agents/travel-concierge/.env",
        "backend/.env"
    ]
    
    all_good = True
    for env_file in env_files:
        if os.path.exists(env_file):
            print_test(f"Environment file: {env_file}", True)
            
            # Check for template values
            with open(env_file, 'r') as f:
                content = f.read()
                if "your-" in content.lower() or "YOUR_VALUE_HERE" in content:
                    print_test(f"Configuration complete: {env_file}", False, "Contains template values")
                    all_good = False
                else:
                    print_test(f"Configuration complete: {env_file}", True)
        else:
            print_test(f"Environment file: {env_file}", False, "File not found")
            all_good = False
    
    return all_good

def test_backend_server():
    """Test backend server can start"""
    print_header("Backend Server")
    
    try:
        # Try to import and create app
        sys.path.append('travel-concierge-platform/backend')
        from api.main import app
        
        print_test("FastAPI app creation", True)
        
        # Check routes are registered
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append(f"{list(route.methods)} {route.path}")
        
        expected_routes = ['/api/chat', '/health', '/api/destinations/popular']
        for expected_route in expected_routes:
            found = any(expected_route in route for route in routes)
            print_test(f"Route {expected_route}", found)
        
        return True
        
    except Exception as e:
        print_test("Backend server test", False, str(e))
        return False

def test_chat_functionality():
    """Test chat functionality with sample input"""
    print_header("Chat Functionality")
    
    try:
        sys.path.append('travel-concierge-platform/backend')
        from api.main import orchestrator
        
        # Test message processing
        test_messages = [
            "Tell me about Goa",
            "I want to plan a trip",
            "Show me booking options"
        ]
        
        for message in test_messages:
            try:
                result = orchestrator.process_message(message)
                success = 'response' in result and 'agent' in result
                agent = result.get('agent', 'Unknown')
                print_test(f"Process: '{message[:20]}...'", success, f"Agent: {agent}")
            except Exception as e:
                print_test(f"Process: '{message[:20]}...'", False, str(e))
        
        return True
        
    except Exception as e:
        print_test("Chat functionality", False, str(e))
        return False

def test_adk_installation():
    """Test ADK installation"""
    print_header("Google ADK Installation")
    
    try:
        # Test Poetry installation
        result = subprocess.run(['poetry', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_test("Poetry installed", True, result.stdout.strip())
        else:
            print_test("Poetry installed", False, "Command not found")
            return False
        
        # Test ADK project structure
        adk_path = "adk-samples/agents/travel-concierge"
        if os.path.exists(adk_path):
            print_test("ADK project exists", True)
            
            # Check key files
            key_files = [
                "pyproject.toml",
                "travel_concierge/agent.py",
                "travel_concierge/prompt.py"
            ]
            
            for key_file in key_files:
                file_path = os.path.join(adk_path, key_file)
                exists = os.path.exists(file_path)
                print_test(f"File: {key_file}", exists)
        else:
            print_test("ADK project exists", False)
            return False
        
        return True
        
    except Exception as e:
        print_test("ADK installation", False, str(e))
        return False

def test_frontend_setup():
    """Test frontend setup"""
    print_header("Frontend Setup")
    
    frontend_paths = [
        "travel-concierge-platform/frontend",
        "frontend"
    ]
    
    for frontend_path in frontend_paths:
        if os.path.exists(frontend_path):
            print_test(f"Frontend exists: {frontend_path}", True)
            
            # Check package.json
            package_json = os.path.join(frontend_path, "package.json")
            if os.path.exists(package_json):
                print_test(f"Package.json: {frontend_path}", True)
                
                # Check node_modules
                node_modules = os.path.join(frontend_path, "node_modules")
                if os.path.exists(node_modules):
                    print_test(f"Dependencies installed: {frontend_path}", True)
                else:
                    print_test(f"Dependencies installed: {frontend_path}", False, "Run: npm install")
            else:
                print_test(f"Package.json: {frontend_path}", False)
        else:
            print_test(f"Frontend exists: {frontend_path}", False)
    
    return True

def test_playwright_setup():
    """Test Playwright setup"""
    print_header("Playwright Testing")
    
    try:
        # Check if Playwright is installed
        result = subprocess.run(['npx', 'playwright', '--version'], 
                              capture_output=True, text=True, cwd='travel-concierge-platform')
        if result.returncode == 0:
            print_test("Playwright installed", True, result.stdout.strip())
            
            # Check if browsers are installed
            result = subprocess.run(['npx', 'playwright', 'install', '--dry-run'], 
                                  capture_output=True, text=True, cwd='travel-concierge-platform')
            if "is already installed" in result.stdout or result.returncode == 0:
                print_test("Playwright browsers", True)
            else:
                print_test("Playwright browsers", False, "Run: npx playwright install")
        else:
            print_test("Playwright installed", False, "Not found in travel-concierge-platform")
        
        return True
        
    except Exception as e:
        print_test("Playwright setup", False, str(e))
        return False

def generate_setup_report():
    """Generate a comprehensive setup report"""
    print_header("Setup Report")
    
    # Run all tests
    test_results = {
        "Python Dependencies": test_python_dependencies(),
        "Backend Import": test_backend_import(), 
        "Database Connection": test_database_connection(),
        "Environment Config": test_environment_config(),
        "Backend Server": test_backend_server(),
        "Chat Functionality": test_chat_functionality(),
        "ADK Installation": test_adk_installation(),
        "Frontend Setup": test_frontend_setup(),
        "Playwright Setup": test_playwright_setup()
    }
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 SETUP SUMMARY")
    print(f"{'='*50}")
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Status: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your setup is ready to go.")
        print("\n🚀 Next steps:")
        print("1. Add your API keys to the .env files")
        print("2. Start the backend: cd travel-concierge-platform/backend && python api/main.py")
        print("3. Start the frontend: cd travel-concierge-platform/frontend && npm run dev")
        print("4. Test the chat functionality at http://localhost:3000")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
        print("\n🔧 Common fixes:")
        print("- Install missing dependencies: pip install -r requirements.txt")
        print("- Run database setup: python database_setup.py")  
        print("- Install frontend deps: npm install")
        print("- Configure environment variables in .env files")
    
    return passed == total

def main():
    """Main test function"""
    print("🧪 Travel Concierge Platform - Setup Verification")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Working Directory: {os.getcwd()}")
    
    try:
        success = generate_setup_report()
        return success
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user")
        return False
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)