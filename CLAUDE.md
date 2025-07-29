# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Start both frontend and backend concurrently
npm start

# Start frontend only (development server)
npm run dev

# Start backend only
npm run start:backend
# or
cd backend && npm start
```

### Build and Deploy
```bash
# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Deploy to Firebase (automated scripts available)
deploy.cmd      # Windows CMD
deploy.ps1      # PowerShell
```

### Backend Scripts
```bash
cd backend

# Fix coordinate data issues
npm run fix-coordinates

# Monitor coordinate problems  
npm run monitor-coordinates
```

## Architecture Overview

### Full-Stack React + Express Application
- **Frontend**: React 18 + Vite, deployed to Firebase Hosting
- **Backend**: Node.js + Express, deployed to Railway  
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage for images
- **Maps**: Leaflet + OpenStreetMap for geographic features

### Key Architecture Patterns

#### Frontend Structure
- **Pages**: Main application screens (`frontend/src/pages/`)
- **Components**: Reusable UI components (`frontend/src/components/`)
- **Services**: API communication layers (`frontend/src/services/`)
- **Contexts**: React contexts for global state (Auth, Notifications)
- **Hooks**: Custom React hooks for data management

#### Backend Structure  
- **Routes**: Express route handlers (`backend/routes/`)
- **Controllers**: Business logic (`backend/controllers/`)
- **Services**: External integrations (Firebase, geocoding) (`backend/services/`)
- **Scripts**: Data maintenance utilities (`backend/scripts/`)

#### Data Flow
1. **Frontend** makes API calls via `frontend/src/services/api.js`
2. **Backend** receives requests through Express routes
3. **Firebase Admin SDK** handles Firestore operations in `backend/services/firestoreService.js`
4. **Real-time updates** flow through Firestore listeners in React components

### Core Domain Models

#### Users
- **Volunteers**: Bee removal specialists with location, experience levels, and performance ratings
- **Coordinators**: Administrative users who manage inquiries and volunteers
- **Authentication**: Firebase Auth with role-based access control

#### Inquiries  
- **Citizen Reports**: Bee swarm reports with photos, location, urgency
- **Status Workflow**: נפתחה פנייה → ממתינה למתנדב → בטיפול → נסגרה בהצלחה/ללא טיפול
- **Assignment System**: Algorithm matches volunteers by distance, experience, and availability

#### Geographic Features
- **Geocoding**: Automatic coordinate conversion via OpenStreetMap Nominatim
- **Location Validation**: Strict address validation for Israeli addresses
- **Map Integration**: Interactive Leaflet maps with custom bee-themed markers

### Critical Business Logic

#### Volunteer Scoring Algorithm (`backend/routes/userRoutes.js`) 
Weighted matching system:
- Distance (30%): Geographic proximity to inquiry
- Bee Experience (15%): Hands-on removal experience  
- Beekeeping Experience (10%): General bee handling
- Training Experience (15%): Formal training completion
- Performance History (30%): Past success rate

#### Excel Import System (`frontend/src/pages/VolunteerManagement.jsx`)
- Dynamic column detection from Row 3 Hebrew headers
- Geocoding validation for all addresses
- Automatic user creation with forced password change
- Skip columns A-C, rows 1-2; data starts Row 4

### Security Considerations
- **Firebase Rules**: Firestore security rules in `firestore.rules`
- **CORS Configuration**: Whitelist of allowed origins in backend
- **Content Security Policy**: Strict CSP headers in both frontend and backend
- **Input Validation**: Address geocoding prevents invalid location data

### Environment Configuration
- **Frontend**: Environment variables prefixed with `VITE_`
- **Backend**: Uses `.env` file for configuration
- **Production Detection**: Automatic backend URL selection based on `import.meta.env.PROD`
- **Firebase Config**: Client config in `frontend/src/firebaseConfig.js`, admin in `backend/privateKey.json`

### Database Schema Patterns
- **Collections**: `user`, `inquiry`, `userToInquiry` (assignments)
- **Document Structure**: Flat documents with embedded objects for performance
- **Real-time Listeners**: Components subscribe to Firestore changes
- **Server Timestamps**: All documents include server-side timestamps

### Development Workflow
1. Firebase project must be configured with Firestore, Auth, and Storage
2. Both frontend and backend run simultaneously during development
3. Frontend proxies API calls to backend via Vite dev server
4. Real-time features work through Firestore listeners, not WebSockets