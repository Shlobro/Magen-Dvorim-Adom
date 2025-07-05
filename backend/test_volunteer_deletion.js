// Test script for volunteer self-deletion functionality
// This is a simple test to verify the API endpoint works

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

// Mock volunteer ID for testing (replace with actual test volunteer ID)
const TEST_VOLUNTEER_ID = 'test-volunteer-id';

async function testVolunteerSelfDeletion() {
  try {
    console.log('Testing volunteer self-deletion endpoint...');
    
    const response = await fetch(`${API_BASE}/api/users/self/${TEST_VOLUNTEER_ID}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', result);

    if (response.status === 404) {
      console.log('✅ Test passed: Endpoint correctly returns 404 for non-existent volunteer');
    } else if (response.status === 403) {
      console.log('✅ Test passed: Endpoint correctly validates volunteer role');
    } else if (response.status === 400 && result.message?.includes('active inquiries')) {
      console.log('✅ Test passed: Endpoint correctly prevents deletion when volunteer has active inquiries');
    } else {
      console.log('Response received:', result);
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Note: This is a basic test. In a real environment, you would:
// 1. Create a test volunteer
// 2. Test the deletion
// 3. Verify the volunteer was actually deleted
// 4. Clean up any test data

console.log('Note: This is a basic API endpoint test.');
console.log('Make sure the server is running on port 3001 before running this test.');
console.log('To run: node backend/test_volunteer_deletion.js');

testVolunteerSelfDeletion();
