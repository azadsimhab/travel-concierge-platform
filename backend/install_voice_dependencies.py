#!/usr/bin/env python3
"""
Voice Dependencies Installer for Personalized AI Travel Concierge
Installs all required packages for voice chat functionality
"""

import subprocess
import sys
import os
import importlib.util

def check_package_installed(package_name):
    """Check if a package is already installed"""
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def install_package(package_name, pip_name=None):
    """Install a package using pip"""
    pip_name = pip_name or package_name
    
    if check_package_installed(package_name):
        print(f"✅ {package_name} is already installed")
        return True
    
    print(f"📦 Installing {package_name}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name])
        print(f"✅ Successfully installed {package_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package_name}: {e}")
        return False

def install_system_dependencies():
    """Install system-level dependencies for voice recognition"""
    print("🔧 Checking system dependencies...")
    
    # Check if we're on Windows
    if os.name == 'nt':
        print("ℹ️  Windows detected - most dependencies should install automatically")
        return True
    
    # For Linux/Mac users
    print("ℹ️  For Linux users, you may need to install additional system packages:")
    print("   Ubuntu/Debian: sudo apt-get install python3-pyaudio portaudio19-dev")
    print("   CentOS/RHEL: sudo yum install python3-pyaudio portaudio-devel")
    print("   macOS: brew install portaudio")
    print()

def main():
    """Main installer function"""
    print("🎤 Voice Dependencies Installer for AI Travel Concierge")
    print("=" * 60)
    
    # Install system dependencies info
    install_system_dependencies()
    
    # Required packages for voice functionality
    packages = [
        ("speech_recognition", "SpeechRecognition"),
        ("pyttsx3", "pyttsx3"),
        ("pygame", "pygame"),
        ("pyaudio", "pyaudio"),
        ("google.cloud.speech", "google-cloud-speech"),
        ("google.cloud.texttospeech", "google-cloud-texttospeech"),
    ]
    
    successful_installs = []
    failed_installs = []
    
    print("📦 Installing voice dependencies...")
    print()
    
    for package_name, pip_name in packages:
        if install_package(package_name, pip_name):
            successful_installs.append(package_name)
        else:
            failed_installs.append(package_name)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INSTALLATION SUMMARY")
    print("=" * 60)
    
    if successful_installs:
        print(f"✅ Successfully installed ({len(successful_installs)}):")
        for package in successful_installs:
            print(f"   - {package}")
    
    if failed_installs:
        print(f"\n❌ Failed to install ({len(failed_installs)}):")
        for package in failed_installs:
            print(f"   - {package}")
        
        print("\n🔧 TROUBLESHOOTING TIPS:")
        print("- For PyAudio issues:")
        print("  Windows: pip install pipwin && pipwin install pyaudio")
        print("  Linux: sudo apt-get install python3-pyaudio")
        print("  macOS: brew install portaudio && pip install pyaudio")
        print()
        print("- For Google Cloud dependencies:")
        print("  Make sure you have a Google Cloud account and credentials")
        print("  Set GOOGLE_APPLICATION_CREDENTIALS environment variable")
    
    # Test imports
    print("\n🧪 TESTING IMPORTS...")
    test_results = []
    
    test_packages = [
        "speech_recognition",
        "pyttsx3", 
        "pygame"
    ]
    
    for package in test_packages:
        try:
            __import__(package)
            print(f"✅ {package} - Import successful")
            test_results.append(True)
        except ImportError as e:
            print(f"❌ {package} - Import failed: {e}")
            test_results.append(False)
    
    # Final status
    print("\n" + "=" * 60)
    if all(test_results):
        print("🎉 ALL VOICE DEPENDENCIES INSTALLED SUCCESSFULLY!")
        print("✅ Your AI Travel Concierge is now ready for voice chat!")
        print("\n🚀 Next steps:")
        print("1. Restart your server: python -m uvicorn api.main:app --reload")
        print("2. Test voice endpoints at http://localhost:8000/docs")
        print("3. For Google Cloud voices, set up credentials:")
        print("   export GOOGLE_APPLICATION_CREDENTIALS='path/to/credentials.json'")
    else:
        print("⚠️  SOME DEPENDENCIES FAILED TO INSTALL")
        print("❌ Voice functionality may be limited")
        print("🔧 Please review the troubleshooting tips above")
    
    print("\n📖 For more help, check the documentation:")
    print("   - SpeechRecognition: https://pypi.org/project/SpeechRecognition/")
    print("   - pyttsx3: https://pypi.org/project/pyttsx3/")
    print("   - Google Cloud Speech: https://cloud.google.com/speech-to-text")

if __name__ == "__main__":
    main()