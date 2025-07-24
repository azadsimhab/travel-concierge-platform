#!/usr/bin/env python3
"""
Database setup utility for Travel Concierge Platform
Supports both Firestore and PostgreSQL configurations
"""

import os
import json
import sys
from typing import Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_firestore():
    """Initialize Firestore database and collections"""
    try:
        from google.cloud import firestore
        
        # Initialize Firestore client
        project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
        if not project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT not set in environment")
        
        db = firestore.Client(project=project_id)
        
        # Create collections and sample data
        collections = {
            'travel_sessions': {
                'sample_session': {
                    'user_id': 'demo_user',
                    'created_at': datetime.now(),
                    'context': {
                        'preferences': {'budget': 'medium', 'travel_style': 'adventure'},
                        'history': []
                    },
                    'status': 'active'
                }
            },
            'user_profiles': {
                'demo_user': {
                    'name': 'Demo User',
                    'preferences': {
                        'destinations': ['beaches', 'mountains'],
                        'budget_range': '10000-50000',
                        'travel_style': 'adventure'
                    },
                    'created_at': datetime.now()
                }
            },
            'bookings': {
                'sample_booking': {
                    'user_id': 'demo_user',
                    'booking_type': 'hotel',
                    'details': {
                        'destination': 'Goa',
                        'check_in': '2024-12-01',
                        'check_out': '2024-12-05',
                        'guests': 2
                    },
                    'status': 'confirmed',
                    'created_at': datetime.now()
                }
            }
        }
        
        for collection_name, docs in collections.items():
            collection_ref = db.collection(collection_name)
            for doc_id, doc_data in docs.items():
                collection_ref.document(doc_id).set(doc_data)
                print(f"✅ Created document '{doc_id}' in collection '{collection_name}'")
        
        print(f"✅ Firestore setup complete for project: {project_id}")
        return True
        
    except ImportError:
        print("❌ google-cloud-firestore not installed. Run: pip install google-cloud-firestore")
        return False
    except Exception as e:
        print(f"❌ Firestore setup failed: {e}")
        return False

def setup_postgresql():
    """Initialize PostgreSQL database and tables"""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not set in environment")
        
        # Parse database URL
        if database_url.startswith('postgresql://'):
            # Example: postgresql://user:password@localhost:5432/dbname
            import urllib.parse
            result = urllib.parse.urlparse(database_url)
            db_config = {
                'host': result.hostname,
                'port': result.port,
                'user': result.username,
                'password': result.password,
                'database': result.path[1:]  # Remove leading slash
            }
        else:
            raise ValueError("Invalid DATABASE_URL format")
        
        # Connect and create tables
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create tables
        tables = [
            """
            CREATE TABLE IF NOT EXISTS travel_sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                context JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                preferences JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                booking_type VARCHAR(100),
                details JSONB,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        for table_sql in tables:
            cursor.execute(table_sql)
            print(f"✅ Created table")
        
        # Insert sample data
        sample_data = [
            """
            INSERT INTO user_profiles (id, name, preferences) 
            VALUES ('demo_user', 'Demo User', %s)
            ON CONFLICT (id) DO NOTHING
            """,
            """
            INSERT INTO travel_sessions (id, user_id, context)
            VALUES ('sample_session', 'demo_user', %s)
            ON CONFLICT (id) DO NOTHING
            """
        ]
        
        cursor.execute(sample_data[0], (json.dumps({
            'destinations': ['beaches', 'mountains'],
            'budget_range': '10000-50000',
            'travel_style': 'adventure'
        }),))
        
        cursor.execute(sample_data[1], (json.dumps({
            'preferences': {'budget': 'medium', 'travel_style': 'adventure'},
            'history': []
        }),))
        
        cursor.close()
        conn.close()
        
        print(f"✅ PostgreSQL setup complete")
        return True
        
    except ImportError:
        print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ PostgreSQL setup failed: {e}")
        return False

def setup_sqlite():
    """Initialize SQLite database for testing"""
    try:
        import sqlite3
        
        db_path = "./travel_concierge.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create tables
        tables = [
            """
            CREATE TABLE IF NOT EXISTS travel_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                context TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                name TEXT,
                preferences TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                booking_type TEXT,
                details TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        for table_sql in tables:
            cursor.execute(table_sql)
        
        # Insert sample data
        cursor.execute("""
            INSERT OR IGNORE INTO user_profiles (id, name, preferences) 
            VALUES ('demo_user', 'Demo User', ?)
        """, (json.dumps({
            'destinations': ['beaches', 'mountains'],
            'budget_range': '10000-50000',
            'travel_style': 'adventure'
        }),))
        
        cursor.execute("""
            INSERT OR IGNORE INTO travel_sessions (id, user_id, context)
            VALUES ('sample_session', 'demo_user', ?)
        """, (json.dumps({
            'preferences': {'budget': 'medium', 'travel_style': 'adventure'},
            'history': []
        }),))
        
        conn.commit()
        conn.close()
        
        print(f"✅ SQLite setup complete: {db_path}")
        return True
        
    except Exception as e:
        print(f"❌ SQLite setup failed: {e}")
        return False

def test_database_connection():
    """Test database connection based on configuration"""
    use_firestore = os.getenv('USE_FIRESTORE', 'false').lower() == 'true'
    
    if use_firestore:
        return test_firestore_connection()
    elif os.getenv('DATABASE_URL'):
        if 'postgresql' in os.getenv('DATABASE_URL'):
            return test_postgresql_connection()
        elif 'sqlite' in os.getenv('DATABASE_URL'):
            return test_sqlite_connection()
    else:
        print("⚠️  No database configuration found")
        return False

def test_firestore_connection():
    """Test Firestore connection"""
    try:
        from google.cloud import firestore
        
        project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
        db = firestore.Client(project=project_id)
        
        # Try to read a document
        test_doc = db.collection('travel_sessions').limit(1).get()
        print(f"✅ Firestore connection successful (project: {project_id})")
        return True
        
    except Exception as e:
        print(f"❌ Firestore connection failed: {e}")
        return False

def test_postgresql_connection():
    """Test PostgreSQL connection"""
    try:
        import psycopg2
        
        database_url = os.getenv('DATABASE_URL')
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        print(f"✅ PostgreSQL connection successful")
        print(f"   Version: {version[0]}")
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def test_sqlite_connection():
    """Test SQLite connection"""
    try:
        import sqlite3
        
        db_path = "./travel_concierge.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT sqlite_version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        print(f"✅ SQLite connection successful")
        print(f"   Version: {version[0]}")
        print(f"   Database: {db_path}")
        return True
        
    except Exception as e:
        print(f"❌ SQLite connection failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🗄️  Travel Concierge Database Setup")
    print("=" * 40)
    
    # Check environment
    use_firestore = os.getenv('USE_FIRESTORE', 'false').lower() == 'true'
    database_url = os.getenv('DATABASE_URL')
    
    if use_firestore:
        print("📊 Setting up Firestore...")
        success = setup_firestore()
    elif database_url:
        if 'postgresql' in database_url:
            print("🐘 Setting up PostgreSQL...")
            success = setup_postgresql()
        elif 'sqlite' in database_url:
            print("📁 Setting up SQLite...")
            success = setup_sqlite()
        else:
            print("❌ Unsupported database URL format")
            success = False
    else:
        print("📁 No database configured, setting up SQLite for testing...")
        success = setup_sqlite()
    
    if success:
        print("\n🔍 Testing database connection...")
        test_success = test_database_connection()
        
        if test_success:
            print("\n🎉 Database setup completed successfully!")
            print("\nNext steps:")
            print("1. Update your .env file with the correct database settings")
            print("2. Run the backend server: python api/main.py")
            print("3. Test the API endpoints")
        else:
            print("\n⚠️  Database setup completed but connection test failed")
            print("Please check your configuration and try again")
            sys.exit(1)
    else:
        print("\n❌ Database setup failed")
        print("Please check the error messages above and try again")
        sys.exit(1)

if __name__ == "__main__":
    main()