#!/usr/bin/env python3
"""
Simple test script for Gemini AI integration
Tests the personalized AI system with your provided API key
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_gemini_basic():
    """Basic test of Gemini AI integration"""
    
    print("Testing Gemini AI Integration for Travel Concierge")
    print("=" * 60)
    
    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment variables")
        return False
    
    print(f"API Key loaded: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        # Test basic Gemini API connection
        import google.generativeai as genai
        
        print("\nConfiguring Gemini AI...")
        genai.configure(api_key=api_key)
        
        print("Creating Gemini model...")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        print("Testing basic query...")
        test_prompt = "You are a travel assistant. Recommend 3 destinations for a beach vacation in India."
        
        response = await asyncio.to_thread(
            model.generate_content,
            test_prompt
        )
        
        print("SUCCESS! Gemini AI is working!")
        print(f"Response preview: {response.text[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"ERROR during testing: {str(e)}")
        return False

if __name__ == "__main__":
    print("Personalized AI Travel Concierge - Basic Gemini Test")
    print("Using API Key: AIzaSyBejNPiBrw8j5EO1QwFj-R_38sxFV73FDo")
    print()
    
    # Run the async test
    success = asyncio.run(test_gemini_basic())
    
    if success:
        print("\nYour Gemini API key is working perfectly!")
        print("Ready to start the personalized AI system!")
    else:
        print("\nAPI key test failed. Please check the key and try again.")