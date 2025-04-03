// frontend/src/pages/AdminPanel.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '/frontend/src/components/ui/Card';
import { Button } from '/frontend/src/components/ui/Button';
import { Input } from '/frontend/src/components/ui/input';
import { Label } from '/frontend/src/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '/frontend/src/components/ui/Tabs';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('user');

  // Form states
  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    phone: '',
    location: '',
    userType: '',
  });
  const [inquiryForm, setInquiryForm] = useState({
    id: '',
    date: '',
    height: '',
    status: '',
    photo: '',
  });
  const [linkForm, setLinkForm] = useState({
    userID: '',
    inquiryID: '',
  });
  const [queryFilters, setQueryFilters] = useState({
    userType: '',
    location: '',
  });
  const [queryResults, setQueryResults] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Use a ref to control the hidden file input
  const fileInputRef = useRef(null);

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // New: visible button triggers hidden file input
  const triggerFileInput = () => {
    if (!inquiryForm.id) {
      alert("Please fill out the Inquiry ID before selecting a photo.");
      return;
    }
    fileInputRef.current.click();
  };

  // Modified photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // No file selected

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      alert('Only image files (JPG, PNG, WEBP, GIF) are allowed.');
      // Clear the file input for re-selection
      e.target.value = null;
      return;
    }

    // If for some reason inquiry ID is still not set, show an alert and clear input
    if (!inquiryForm.id) {
      alert('Please fill out the Inquiry ID before uploading the photo.');
      e.target.value = null;
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('inquiryId', inquiryForm.id);

    try {
      setUploadingPhoto(true);
      const res = await axios.post('http://localhost:3001/inquiry/upload-photo', formData);
      setInquiryForm((prev) => ({ ...prev, photo: res.data.photoUrl }));
      alert('Photo uploaded and saved to Firestore.');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingPhoto(false);
      // Clear the file input so user must re-select if needed
      e.target.value = null;
    }
  };

  // Placeholder submission functions
  const submitUser = async () => {
    try {
      const res = await axios.post('http://localhost:3001/user', userForm);
      alert(res.data);
    } catch (err) {
      console.error(err);
      alert("Error saving user: " + err.message);
    }
  };

  const submitInquiry = async () => {
    try {
      const res = await axios.post('http://localhost:3001/inquiry', inquiryForm);
      alert(res.data);
    } catch (err) {
      console.error(err);
      alert("Error saving inquiry: " + err.message);
    }
  };

  const submitLink = async () => {
    try {
      const res = await axios.post('http://localhost:3001/link', linkForm);
      alert(res.data);
    } catch (err) {
      console.error(err);
      alert("Error linking user to inquiry: " + err.message);
    }
  };

  const queryUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/users', {
        params: queryFilters,
      });
      setQueryResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Error querying users: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md">
        <CardHeader className="border-b p-6">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Firestore Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab List */}
            <TabsList className="mb-4 flex space-x-2">
              <TabsTrigger value="user" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                User Management
              </TabsTrigger>
              <TabsTrigger value="inquiry" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                Inquiry Management
              </TabsTrigger>
              <TabsTrigger value="link" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                Link Management
              </TabsTrigger>
              <TabsTrigger value="query" className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                Query Users
              </TabsTrigger>
            </TabsList>
  
            {/* USER MANAGEMENT */}
            <TabsContent value="user">
              <div className="space-y-6">
                <div>
                  <div>
                    <Label htmlFor="user-id" className="block text-sm font-medium text-gray-700">
                      User ID:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="user-id"
                      name="id"
                      placeholder="User ID"
                      value={userForm.id}
                      onChange={handleChange(setUserForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="user-name" className="block text-sm font-medium text-gray-700">
                      Name:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="user-name"
                      name="name"
                      placeholder="Name"
                      value={userForm.name}
                      onChange={handleChange(setUserForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="user-phone" className="block text-sm font-medium text-gray-700">
                      Phone:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="user-phone"
                      name="phone"
                      placeholder="Phone"
                      value={userForm.phone}
                      onChange={handleChange(setUserForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="user-location" className="block text-sm font-medium text-gray-700">
                      Location:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="user-location"
                      name="location"
                      placeholder="Location"
                      value={userForm.location}
                      onChange={handleChange(setUserForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="user-type" className="block text-sm font-medium text-gray-700">
                      User Type:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="user-type"
                      name="userType"
                      placeholder="User Type"
                      value={userForm.userType}
                      onChange={handleChange(setUserForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 text-center">
                  <Button
                    onClick={submitUser}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                  >
                    Save User
                  </Button>
                </div>
              </div>
            </TabsContent>
  
            {/* INQUIRY MANAGEMENT */}
            <TabsContent value="inquiry">
              <div className="space-y-6">
                <div>
                  <div>
                    <Label htmlFor="inquiry-id" className="block text-sm font-medium text-gray-700">
                      Inquiry ID:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="inquiry-id"
                      name="id"
                      placeholder="Inquiry ID"
                      value={inquiryForm.id}
                      onChange={handleChange(setInquiryForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="inquiry-date" className="block text-sm font-medium text-gray-700">
                      Date (YYYY-MM-DD):
                    </Label>
                  </div>
                  <div tp>
                    <Input 
                      id="inquiry-date"
                      name="date"
                      placeholder="Date"
                      value={inquiryForm.date}
                      onChange={handleChange(setInquiryForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="inquiry-height" className="block text-sm font-medium text-gray-700">
                      Height:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="inquiry-height"
                      name="height"
                      placeholder="Height"
                      value={inquiryForm.height}
                      onChange={handleChange(setInquiryForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="inquiry-status" className="block text-sm font-medium text-gray-700">
                      Status:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="inquiry-status"
                      name="status"
                      placeholder="Status"
                      value={inquiryForm.status}
                      onChange={handleChange(setInquiryForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
  
                {/* Photo Upload Section */}
                <div>
                  <div>
                    <Label htmlFor="inquiry-photo-upload" className="block text-sm font-medium text-gray-700">
                      Upload Photo:
                    </Label>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={triggerFileInput}
                      className="mt-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Choose Photo
                    </Button>
                    {uploadingPhoto && (
                      <p className="text-sm text-gray-500 mt-2">Uploading photo...</p>
                    )}
                    {inquiryForm.photo && (
                      <div className="mt-2">
                        <p className="text-sm text-green-700 break-all">
                          Uploaded URL: {inquiryForm.photo}
                        </p>
                        <img
                          src={inquiryForm.photo}
                          alt="Uploaded Preview"
                      style={{ width: '500px', height: 'auto' }}
                      className="mt-2 rounded-md shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
  
                <div className="pt-2 text-center">
                  <Button
                    onClick={submitInquiry}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                  >
                    Save Inquiry
                  </Button>
                </div>
              </div>
            </TabsContent>
  
            {/* LINK MANAGEMENT */}
            <TabsContent value="link">
              <div className="space-y-6">
                <div>
                  <div>
                    <Label htmlFor="link-userID" className="block text-sm font-medium text-gray-700">
                      User ID:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="link-userID"
                      name="userID"
                      placeholder="User ID"
                      value={linkForm.userID}
                      onChange={handleChange(setLinkForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="link-inquiryID" className="block text-sm font-medium text-gray-700">
                      Inquiry ID:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="link-inquiryID"
                      name="inquiryID"
                      placeholder="Inquiry ID"
                      value={linkForm.inquiryID}
                      onChange={handleChange(setLinkForm)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 text-center">
                  <Button
                    onClick={submitLink}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                  >
                    Create Link
                  </Button>
                </div>
              </div>
            </TabsContent>
  
            {/* QUERY USERS */}
            <TabsContent value="query">
              <div className="space-y-6">
                <div>
                  <div>
                    <Label htmlFor="query-userType" className="block text-sm font-medium text-gray-700">
                      User Type Filter:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="query-userType"
                      name="userType"
                      placeholder="User Type"
                      onChange={handleChange(setQueryFilters)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="query-location" className="block text-sm font-medium text-gray-700">
                      Location Filter:
                    </Label>
                  </div>
                  <div>
                    <Input
                      id="query-location"
                      name="location"
                      placeholder="Location"
                      onChange={handleChange(setQueryFilters)}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 text-center">
                  <Button
                    onClick={queryUsers}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                  >
                    Query Users
                  </Button>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-800">Results:</h3>
                  {queryResults.length === 0 ? (
                    <p>No users found.</p>
                  ) : (
                    queryResults.map((user, index) => (
                      <div key={index} className="border p-4 rounded-md mb-4">
                        <p>
                          <span className="font-bold">ID:</span> {user.id}
                        </p>
                        <p>
                          <span className="font-bold">Name:</span> {user.name}
                        </p>
                        <p>
                          <span className="font-bold">Phone:</span> {user.phone}
                        </p>
                        <p>
                          <span className="font-bold">Location:</span> {user.location}
                        </p>
                        <p>
                          <span className="font-bold">User Type:</span> {user.userType}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </div>
    </div>
  );
}  

export default AdminPanel;
