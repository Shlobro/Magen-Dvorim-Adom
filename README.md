# Magen Dvorim Adom - Bee Hive Removal Management System

## About Us
This project was developed as part of coursework at Azrieli College by:
- Shalom Ben Shimshon
- [Other team members]

The system was created for the "Magen Dvorim Adom" organization, which aims to help save bee swarms in Israel by coordinating between citizens reporting bee swarms and skilled volunteers.

## Project Overview

An advanced inquiry management system that enables:
- Reporting bee swarms by citizens
- Managing volunteers and coordinators
- Assigning volunteers to inquiries based on location and experience
- Tracking treatment status
- Interactive volunteer map
- Coordinator dashboard with analytics
- Real-time notifications and updates

## Technology Stack

### Frontend
- **React 18.3.1** - JavaScript library for building user interfaces
- **Vite 6.3.5** - Fast and modern build tool
- **Material-UI 7.1.2** - React component library
- **React Router DOM 7.4.1** - Navigation between pages
- **Leaflet 1.9.4** + **React-Leaflet 4.2.1** - Interactive maps
- **Chart.js 4.4.3** - Charts and analytics
- **Axios 1.8.4** - HTTP requests
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### Backend
- **Node.js** + **Express 5.1.0** - Server and API
- **Firebase Admin SDK 13.2.0** - Database and authentication
- **Firestore** - NoSQL database
- **Multer 1.4.5** - File upload handling
- **Cloudinary 2.6.0** - Cloud image storage
- **CORS 2.8.5** - Cross-origin resource sharing

### External Services
- **OpenStreetMap** + **Nominatim** - Maps and geocoding
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Real-time database
- **Cloudinary** - Image storage and optimization

## Installation Guide

### Prerequisites
- Node.js (version 18.0.0 or higher)
- npm or yarn package manager
- Firebase account
- Cloudinary account

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd magen-dvorim-adom

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Return to root directory
cd ..
```

### 2. Firebase Configuration

1. Create a new project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Create a Service Account in Project Settings > Service Accounts
5. Download the JSON file and place it as `backend/privateKey.json`

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
VITE_API_BASE=http://localhost:3001

# Backend
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase (optional - if not using privateKey.json)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Firebase Client Configuration

Create `frontend/src/firebaseConfig.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 5. Cloudinary Configuration

Sign up for a [Cloudinary account](https://cloudinary.com/) and add your credentials to the `.env` file.

### 6. Running the Application

```bash
# Start both frontend and backend
npm start

# Or run separately:
# Backend (in backend directory)
cd backend
npm start

# Frontend (in root directory)
npm run dev
```

## Project Structure

```
magen-dvorim-adom/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # Business logic controllers
│   ├── routes/             # API routes
│   ├── services/           # External service integrations
│   ├── middlewares/        # Custom middleware
│   └── scripts/            # Utility scripts
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── contexts/       # React contexts
│       ├── services/       # API services
│       └── utils/          # Utility functions
├── public/                 # Static assets
└── package.json           # Root dependencies
```

## Key Features

### 1. Inquiry Management
- Citizens can report bee swarms through a user-friendly form
- Photo upload with location tagging
- Status tracking from submission to resolution
- Automatic geocoding of addresses

### 2. Volunteer Management
- Volunteer registration and profile management
- Skill-based assignment algorithm
- Performance tracking and ratings
- Real-time availability status

### 3. Coordinator Dashboard
- Overview of all inquiries and volunteers
- Assignment management interface
- Analytics and reporting
- Volunteer approval system

### 4. Interactive Map
- Real-time view of inquiries and volunteers
- Geographic proximity-based assignments
- Custom bee-themed markers
- Mobile-responsive design

### 5. Real-time Updates
- Live notifications for new inquiries
- Status updates across all connected clients
- Firestore real-time listeners

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Inquiries
- `GET /inquiry` - Get all inquiries
- `POST /inquiry` - Create new inquiry
- `PUT /inquiry/:id` - Update inquiry
- `DELETE /inquiry/:id` - Delete inquiry
- `POST /inquiry/:id/assign` - Assign volunteers

### Users
- `GET /user` - Get all users
- `POST /user` - Create user
- `PUT /user/:id` - Update user
- `DELETE /user/:id` - Delete user
- `GET /user/volunteers` - Get volunteers with scoring

### Links (Assignments)
- `GET /link` - Get user-inquiry assignments
- `POST /link` - Create assignment
- `DELETE /link` - Remove assignment

## Business Logic

### Volunteer Scoring Algorithm
The system uses a weighted scoring algorithm to match volunteers with inquiries:
- **Distance (30%)** - Geographic proximity
- **Bee Experience (15%)** - Hands-on removal experience
- **Beekeeping Experience (10%)** - General bee handling knowledge
- **Training Experience (15%)** - Formal training completion
- **Performance History (30%)** - Past success rate

### Status Workflow
1. **נפתחה פנייה** - Inquiry submitted
2. **ממתינה למתנדב** - Waiting for volunteer assignment
3. **בטיפול** - Assigned to volunteer
4. **נסגרה בהצלחה** - Successfully resolved
5. **נסגרה ללא טיפול** - Closed without treatment

## Security Features

- Firebase Authentication for secure user management
- Role-based access control (Coordinators vs Volunteers)
- Input validation and sanitization
- Secure file upload handling

## Performance Optimizations

- React.memo for component optimization
- useMemo/useCallback for expensive calculations
- Lazy loading for route-based code splitting
- Image optimization through Cloudinary
- Firestore query optimization with indexes
- Client-side caching for frequently accessed data

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Internet Explorer 11+ (with polyfills)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Azrieli College for providing the educational framework
- Magen Dvorim Adom organization for the project requirements
- Firebase and Cloudinary for their services
- The open-source community for the tools and libraries used

---

*This project was developed as part of academic coursework at Azrieli College.*
