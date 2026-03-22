#!/usr/bin/env python3
"""
Test script to verify Plant.id API key and endpoint
Run this separately to debug API issues
"""

import requests
import base64
import json
from pathlib import Path

# Your API key from .env
API_KEY = "HETOl5YUYcopHcZmMiGuPCBj93eNMgBrnhyqOkgYGAnb97QPTQ"

def test_api_key():
    """Test if the API key is valid"""
    print("="*60)
    print("Testing Plant.id API Key")
    print("="*60)
    
    # Create a simple test image (1x1 red pixel)
    test_image_base64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
    
    # Try different API versions
    endpoints = [
        "https://plant.id/api/v3/health_assessment",
        "https://api.plant.id/v3/health_assessment", 
        "https://api.plant.id/v2/health_assessment"
    ]
    
    for api_url in endpoints:
        print(f"\n🔍 Testing: {api_url}")
        print("-"*60)
        
        headers = {
            "Content-Type": "application/json",
            "Api-Key": API_KEY
        }
        
        # Try v3 format
        payload_v3 = {
            "images": [f"data:image/jpeg;base64,{test_image_base64}"],
            "similar_images": True,
            "health": "all"
        }
        
        # Try v2 format
        payload_v2 = {
            "images": [test_image_base64],
            "modifiers": ["crops_fast", "similar_images"],
            "plant_language": "en",
            "plant_details": ["common_names", "url", "description"]
        }
        
        # Try v3 first
        try:
            print("Trying v3 format...")
            response = requests.post(api_url, json=payload_v3, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200 or response.status_code == 201:
                print("✅ SUCCESS! This endpoint works with v3 format")
                print(f"Response keys: {response.json().keys()}")
                return api_url, "v3"
            else:
                print(f"❌ Failed with v3 format")
                print(f"Response: {response.text[:300]}")
                
        except Exception as e:
            print(f"❌ Error with v3 format: {e}")
        
        # Try v2 format
        try:
            print("\nTrying v2 format...")
            response = requests.post(api_url, json=payload_v2, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200 or response.status_code == 201:
                print("✅ SUCCESS! This endpoint works with v2 format")
                print(f"Response keys: {response.json().keys()}")
                return api_url, "v2"
            else:
                print(f"❌ Failed with v2 format")
                print(f"Response: {response.text[:300]}")
                
        except Exception as e:
            print(f"❌ Error with v2 format: {e}")
    
    print("\n" + "="*60)
    print("❌ All endpoints failed!")
    print("Possible issues:")
    print("1. API key is invalid or expired")
    print("2. API key doesn't have health_assessment access")
    print("3. Account needs activation")
    print("4. Free tier limitations")
    print("\n💡 Solutions:")
    print("- Check your Plant.id dashboard: https://web.plant.id/")
    print("- Verify API key is correct")
    print("- Check if you need to verify email")
    print("- Try regenerating API key")
    print("="*60)
    return None, None

if __name__ == "__main__":
    test_api_key()