// src/AdminPanel.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


function AdminPanel() {
  const [activeTab, setActiveTab] = useState('user');

  // Form states for User, Inquiry, and Link operations.
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
    sex: '',
    photo: '',
  });
  const [linkForm, setLinkForm] = useState({
    userID: '',
    inquiryID: '',
  });
  // For querying users
  const [queryFilters, setQueryFilters] = useState({
    userType: '',
    location: '',
  });
  const [queryResults, setQueryResults] = useState([]);

  // Handlers for form input changes
  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  // API call functions
  const submitUser = async () => {
    try {
      const res = await axios.post('http://localhost:3001/user', userForm);
      alert(res.data);
    } catch (err) {
      alert('Error saving user: ' + err.message);
    }
  };

  const submitInquiry = async () => {
    try {
      const res = await axios.post('http://localhost:3001/inquiry', inquiryForm);
      alert(res.data);
    } catch (err) {
      alert('Error saving inquiry: ' + err.message);
    }
  };

  const submitLink = async () => {
    try {
      const res = await axios.post('http://localhost:3001/link', linkForm);
      alert(res.data);
    } catch (err) {
      alert('Error linking user to inquiry: ' + err.message);
    }
  };

  const queryUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/users', {
        params: queryFilters,
      });
      setQueryResults(res.data);
    } catch (err) {
      alert('Error querying users: ' + err.message);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Firestore Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="user">User Management</TabsTrigger>
            <TabsTrigger value="inquiry">Inquiry Management</TabsTrigger>
            <TabsTrigger value="link">Link Management</TabsTrigger>
            <TabsTrigger value="query">Query Users</TabsTrigger>
          </TabsList>

          {/* USER MANAGEMENT */}
          <TabsContent value="user">
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  name="id"
                  placeholder="User ID"
                  value={userForm.id}
                  onChange={handleChange(setUserForm)}
                />
              </div>
              <div>
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  name="name"
                  placeholder="Name"
                  value={userForm.name}
                  onChange={handleChange(setUserForm)}
                />
              </div>
              <div>
                <Label htmlFor="user-phone">Phone</Label>
                <Input
                  id="user-phone"
                  name="phone"
                  placeholder="Phone"
                  value={userForm.phone}
                  onChange={handleChange(setUserForm)}
                />
              </div>
              <div>
                <Label htmlFor="user-location">Location</Label>
                <Input
                  id="user-location"
                  name="location"
                  placeholder="Location"
                  value={userForm.location}
                  onChange={handleChange(setUserForm)}
                />
              </div>
              <div>
                <Label htmlFor="user-type">User Type</Label>
                <Input
                  id="user-type"
                  name="userType"
                  placeholder="User Type"
                  value={userForm.userType}
                  onChange={handleChange(setUserForm)}
                />
              </div>
              <Button onClick={submitUser}>Save User</Button>
            </div>
          </TabsContent>

          {/* INQUIRY MANAGEMENT */}
          <TabsContent value="inquiry">
            <div className="space-y-4">
              <div>
                <Label htmlFor="inquiry-id">Inquiry ID</Label>
                <Input
                  id="inquiry-id"
                  name="id"
                  placeholder="Inquiry ID"
                  value={inquiryForm.id}
                  onChange={handleChange(setInquiryForm)}
                />
              </div>
              <div>
                <Label htmlFor="inquiry-date">Date (YYYY-MM-DD)</Label>
                <Input
                  id="inquiry-date"
                  name="date"
                  placeholder="Date"
                  value={inquiryForm.date}
                  onChange={handleChange(setInquiryForm)}
                />
              </div>
              <div>
                <Label htmlFor="inquiry-height">Height</Label>
                <Input
                  id="inquiry-height"
                  name="height"
                  placeholder="Height"
                  value={inquiryForm.height}
                  onChange={handleChange(setInquiryForm)}
                />
              </div>
              <div>
                <Label htmlFor="inquiry-sex">Sex</Label>
                <Input
                  id="inquiry-sex"
                  name="sex"
                  placeholder="Sex"
                  value={inquiryForm.sex}
                  onChange={handleChange(setInquiryForm)}
                />
              </div>
              <div>
                <Label htmlFor="inquiry-photo">Photo URL</Label>
                <Input
                  id="inquiry-photo"
                  name="photo"
                  placeholder="Photo URL"
                  value={inquiryForm.photo}
                  onChange={handleChange(setInquiryForm)}
                />
              </div>
              <Button onClick={submitInquiry}>Save Inquiry</Button>
            </div>
          </TabsContent>

          {/* LINK MANAGEMENT */}
          <TabsContent value="link">
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-userID">User ID</Label>
                <Input
                  id="link-userID"
                  name="userID"
                  placeholder="User ID"
                  value={linkForm.userID}
                  onChange={handleChange(setLinkForm)}
                />
              </div>
              <div>
                <Label htmlFor="link-inquiryID">Inquiry ID</Label>
                <Input
                  id="link-inquiryID"
                  name="inquiryID"
                  placeholder="Inquiry ID"
                  value={linkForm.inquiryID}
                  onChange={handleChange(setLinkForm)}
                />
              </div>
              <Button onClick={submitLink}>Create Link</Button>
            </div>
          </TabsContent>

          {/* QUERY USERS */}
          <TabsContent value="query">
            <div className="space-y-4">
              <div>
                <Label htmlFor="query-userType">User Type Filter</Label>
                <Input
                  id="query-userType"
                  name="userType"
                  placeholder="User Type"
                  onChange={handleChange(setQueryFilters)}
                />
              </div>
              <div>
                <Label htmlFor="query-location">Location Filter</Label>
                <Input
                  id="query-location"
                  name="location"
                  placeholder="Location"
                  onChange={handleChange(setQueryFilters)}
                />
              </div>
              <Button onClick={queryUsers}>Query Users</Button>
              <div className="mt-4">
                <h3 className="text-lg font-bold">Results:</h3>
                {queryResults.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  queryResults.map((user, index) => (
                    <div key={index} className="border p-2 rounded mb-2">
                      <p>ID: {user.id}</p>
                      <p>Name: {user.name}</p>
                      <p>Phone: {user.phone}</p>
                      <p>Location: {user.location}</p>
                      <p>User Type: {user.userType}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AdminPanel;
