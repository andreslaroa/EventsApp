#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class CityEventsAPITester:
    def __init__(self, base_url="https://city-events-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_token = None
        self.user_id = None
        self.test_event_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200, use_cookies=True):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text
                return False, f"Status {response.status_code}: {error_detail}"
                
        except Exception as e:
            return False, f"Request failed: {str(e)}"

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, data = self.make_request('GET', 'categories')
        if success and 'categories' in data:
            categories = data['categories']
            expected_categories = ["Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community", "Other"]
            has_all_categories = all(cat in categories for cat in expected_categories)
            return self.log_test("Categories endpoint", has_all_categories, 
                               f"Expected categories, got: {categories}")
        return self.log_test("Categories endpoint", False, str(data))

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_data = {
            "name": "Test User",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        success, data = self.make_request('POST', 'auth/register', test_data, 200)
        if success and 'id' in data:
            self.user_id = data['id']
            # Check if cookies are set by making an auth check
            auth_success, auth_data = self.make_request('GET', 'auth/me')
            if auth_success:
                return self.log_test("User registration", True)
            else:
                return self.log_test("User registration", False, "Registration succeeded but auth cookies not set")
        return self.log_test("User registration", False, str(data))

    def test_user_login(self):
        """Test user login with existing user"""
        # First create a user
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        register_data = {
            "name": "Login Test User",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        # Register user
        reg_success, reg_data = self.make_request('POST', 'auth/register', register_data, 200)
        if not reg_success:
            return self.log_test("User login", False, f"Failed to create test user: {reg_data}")
        
        # Logout first
        self.make_request('POST', 'auth/logout')
        
        # Now test login
        login_data = {
            "email": test_email,
            "password": "TestPass123!"
        }
        
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        if success and 'id' in data:
            self.user_id = data['id']
            # Verify auth works
            auth_success, auth_data = self.make_request('GET', 'auth/me')
            return self.log_test("User login", auth_success, "Login succeeded but auth verification failed" if not auth_success else "")
        return self.log_test("User login", False, str(data))

    def test_get_events(self):
        """Test getting events (should have seeded data)"""
        success, data = self.make_request('GET', 'events')
        if success and 'events' in data:
            events = data['events']
            has_events = len(events) > 0
            return self.log_test("Get events", has_events, 
                               f"Expected seeded events, got {len(events)} events")
        return self.log_test("Get events", False, str(data))

    def test_events_filtering(self):
        """Test event filtering by category and search"""
        # Test category filter
        success, data = self.make_request('GET', 'events?category=Music')
        if not success:
            return self.log_test("Events filtering", False, f"Category filter failed: {data}")
        
        music_events = data.get('events', [])
        
        # Test search filter
        success, data = self.make_request('GET', 'events?search=festival')
        if not success:
            return self.log_test("Events filtering", False, f"Search filter failed: {data}")
        
        search_events = data.get('events', [])
        
        return self.log_test("Events filtering", True, 
                           f"Category filter returned {len(music_events)} events, search returned {len(search_events)} events")

    def test_create_event(self):
        """Test creating an event (requires auth)"""
        if not self.user_id:
            return self.log_test("Create event", False, "No authenticated user")
        
        future_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        event_data = {
            "title": "Test Event",
            "description": "This is a test event created by automated testing",
            "category": "Tech",
            "date": future_date,
            "time": "19:00",
            "location": "Test Venue",
            "address": "123 Test Street",
            "ticket_price": 25.0,
            "is_free": False,
            "organizer_name": "Test Organizer",
            "organizer_email": "organizer@test.com",
            "organizer_phone": "+1234567890"
        }
        
        success, data = self.make_request('POST', 'events', event_data, 200)
        if success and 'id' in data:
            self.test_event_id = data['id']
            return self.log_test("Create event", True)
        return self.log_test("Create event", False, str(data))

    def test_get_single_event(self):
        """Test getting a single event by ID"""
        if not self.test_event_id:
            return self.log_test("Get single event", False, "No test event created")
        
        success, data = self.make_request('GET', f'events/{self.test_event_id}')
        if success and 'id' in data and data['id'] == self.test_event_id:
            return self.log_test("Get single event", True)
        return self.log_test("Get single event", False, str(data))

    def test_bookmark_functionality(self):
        """Test bookmark add/remove/check functionality"""
        if not self.user_id or not self.test_event_id:
            return self.log_test("Bookmark functionality", False, "Missing user or event")
        
        # Add bookmark
        success, data = self.make_request('POST', f'bookmarks/{self.test_event_id}', {}, 200)
        if not success:
            return self.log_test("Bookmark functionality", False, f"Add bookmark failed: {data}")
        
        # Check bookmark
        success, data = self.make_request('GET', f'bookmarks/check/{self.test_event_id}')
        if not success or not data.get('is_bookmarked'):
            return self.log_test("Bookmark functionality", False, f"Check bookmark failed: {data}")
        
        # Get bookmarks list
        success, data = self.make_request('GET', 'bookmarks')
        if not success or 'bookmarks' not in data:
            return self.log_test("Bookmark functionality", False, f"Get bookmarks failed: {data}")
        
        bookmarks = data['bookmarks']
        bookmark_found = any(b['id'] == self.test_event_id for b in bookmarks)
        if not bookmark_found:
            return self.log_test("Bookmark functionality", False, "Event not found in bookmarks list")
        
        # Remove bookmark
        success, data = self.make_request('DELETE', f'bookmarks/{self.test_event_id}', {}, 200)
        if not success:
            return self.log_test("Bookmark functionality", False, f"Remove bookmark failed: {data}")
        
        # Verify removal
        success, data = self.make_request('GET', f'bookmarks/check/{self.test_event_id}')
        if success and not data.get('is_bookmarked'):
            return self.log_test("Bookmark functionality", True)
        
        return self.log_test("Bookmark functionality", False, "Bookmark not properly removed")

    def test_logout(self):
        """Test logout functionality"""
        success, data = self.make_request('POST', 'auth/logout', {}, 200)
        if not success:
            return self.log_test("Logout", False, str(data))
        
        # Verify we're logged out
        success, data = self.make_request('GET', 'auth/me', {}, 401)
        return self.log_test("Logout", success, "Still authenticated after logout" if not success else "")

    def test_auth_required_endpoints(self):
        """Test that protected endpoints require authentication"""
        # Ensure we're logged out
        self.make_request('POST', 'auth/logout')
        
        # Test protected endpoints
        protected_tests = [
            ('GET', 'bookmarks', {}, 401),
            ('GET', 'auth/me', {}, 401)
        ]
        
        all_passed = True
        for method, endpoint, data, expected_status in protected_tests:
            success, response = self.make_request(method, endpoint, data, expected_status)
            if not success:
                all_passed = False
                print(f"   ❌ {method} {endpoint} - Expected {expected_status}, got different status")
        
        return self.log_test("Auth required endpoints", all_passed)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting City Events API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Basic functionality tests
        self.test_categories_endpoint()
        self.test_get_events()
        self.test_events_filtering()
        
        # Auth tests
        self.test_user_registration()
        self.test_user_login()
        
        # Authenticated functionality tests
        self.test_create_event()
        self.test_get_single_event()
        self.test_bookmark_functionality()
        
        # Security tests
        self.test_auth_required_endpoints()
        self.test_logout()
        
        # Summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    tester = CityEventsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())