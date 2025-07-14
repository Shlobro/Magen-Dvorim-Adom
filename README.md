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
- **Firebase Storage** - Cloud image storage
- **Multer 1.4.5** - File upload handling
- **CORS 2.8.5** - Cross-origin resource sharing

### External Services
- **OpenStreetMap** + **Nominatim** - Maps and geocoding
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Real-time database
- **Firebase Storage** - Image storage and optimization

## Installation Guide

### Prerequisites
- Node.js (version 18.0.0 or higher)
- npm or yarn package manager
- Firebase account with Firestore and Storage enabled

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

### 5. Firebase Storage Configuration

Make sure your Firebase project has Storage enabled in a US region for image upload functionality.

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

### 7. Deploying to Production

To deploy your application to Firebase hosting:

```bash
# Build the production version
npm run build

# Deploy to Firebase hosting
firebase deploy --only hosting
```

**Automated Deployment Scripts**: For convenience, you can use the provided scripts:
- **Windows CMD**: `deploy.cmd` - Double-click or run from command prompt
- **PowerShell**: `deploy.ps1` - Run with `.\deploy.ps1`

Both scripts will automatically run the build and deployment commands with error handling and progress indicators.

**Note**: Make sure you have Firebase CLI installed and are logged in:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # Only needed for first-time setup
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
- Image optimization through Firebase Storage
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
- Firebase for their comprehensive services
- The open-source community for the tools and libraries used

## Account Management Features

### Self-Deletion for Users
Both volunteers and coordinators can delete their own accounts through their profile pages:

#### Volunteers
- **Route**: `DELETE /api/users/self/:id`
- **Access**: Available in Volunteer Profile page
- **Security**: Requires password confirmation
- **Validation**: 
  - Prevents deletion if volunteer has active assigned inquiries
  - Automatically removes volunteer from completed inquiries
  - Requires current password verification

#### Coordinators
- **Route**: `DELETE /api/coordinators/self/:id`
- **Access**: Available in Coordinator Profile page
- **Security**: Requires password confirmation
- **Process**: 
  - Deletes Firestore user document
  - Removes Firebase Authentication user
  - Logs deletion for audit purposes

#### Safety Features
- Password verification required
- Active inquiry checking for volunteers
- Confirmation dialog with warning message
- Automatic logout and redirect after deletion
- Error handling for various failure scenarios

---

## Excel Upload Documentation

### Updated Excel Upload Functionality for Volunteers - Dynamic Column Detection

The Excel upload feature has been updated to use dynamic column detection based on Hebrew column names in Row 3. This makes the system more flexible and robust.

#### Excel File Structure Expected

The system now uses dynamic column detection with the following structure:

##### Skip Rules
- **Columns A, B, C**: Completely ignored (A=empty, B=index numbers, C=timestamp)
- **Rows 1, 2**: Completely ignored (headers/metadata)
- **Row 3**: MUST contain Hebrew column names for detection
- **Data starts from Row 4**

##### Dynamic Column Detection
The system searches Row 3 for these Hebrew column names:

| Hebrew Column Name | Field Name | Description | Required |
|-------------------|------------|-------------|----------|
| שם פרטי | firstName | First Name | ✓ |
| שם משפחה | lastName | Last Name | ✓ |
| דוא"ל | email | Email | ✓ |
| מספר נייד | phoneNumber | Phone Number | Optional |
| מס זהות | idNumber | ID Number | Optional |
| כתובת | address | Address | Optional* |
| עיר/יישוב | city | City | Optional* |
| עיר | city | City (alternative) | Optional* |
| יישוב | city | Settlement (alternative) | Optional* |
| ניסיון בפינוי | beeExperience | Bee Removal Experience | Optional |
| ניסיון בגידול | beekeepingExperience | Beekeeping Experience | Optional |
| הדרכות | hasTraining | Training | Optional |
| היתר עבודה בגובה | heightPermit | Height Work Permit | Optional |
| קבלת פינוי בעבר | previousEvacuation | Previous Evacuation | Optional |
| חותמת זמן | signupDate | Signup Date/Timestamp | Optional |
| תאריך | signupDate | Date (alternative) | Optional |
| תאריך הרשמה | signupDate | Signup Date (alternative) | Optional |

**Note**: Columns with names like "קרבה לפינוי" and "ניקוד/משקל" are automatically ignored as they are calculated fields.

##### ⚠️ Address Geocoding Validation
**CRITICAL**: The system now performs STRICT geocoding validation on all addresses:
- If an address and/or city is provided, it MUST be geocodable (convertible to latitude/longitude coordinates)
- Volunteers with addresses that cannot be geocoded will be **REJECTED** and not added to the system
- The system uses OpenStreetMap Nominatim service with Israeli address recognition
- Common street prefixes like "רחוב", "רח'", "רח״" are automatically handled
- Ensure all addresses and city names are accurate, complete, and recognizable

*Optional* fields with asterisk (*) are optional but must be geocodable if provided.

##### Date/Timestamp Field
The system now processes timestamp/date fields with the following supported formats:
- **"1/6/22 0:26"** - M/D/YY H:MM format
- **"1/6/2022 0:26"** - M/D/YYYY H:MM format
- **Excel serial date numbers** - Automatic conversion
- **ISO date strings** - Standard format support
- **Date objects** - Direct Date object handling

The date field is optional and will be stored as the volunteer's signup date.

##### Boolean Field Values
For boolean fields, the system accepts:
- `1`, `"1"`, `true`, `"true"`, `"כן"`, `"yes"` = True
- `0`, `"0"`, `false`, `"false"`, `"לא"`, `"no"`, or empty = False

#### Features Implemented

##### Backend (`/api/users/bulk-create`)
1. **Bulk user creation** with proper error handling
2. **Duplicate detection** by email
3. **Firebase Auth integration** - creates users with default password
4. **Geocoding support** - converts addresses to coordinates
5. **Password forcing** - sets `requirePasswordChange: true` for all imported users
6. **Comprehensive error reporting**

##### Frontend (VolunteerManagement.jsx)
1. **Dynamic column detection** - searches Row 3 for Hebrew column names
2. **Flexible Excel parsing** - works regardless of column order
3. **Smart data validation** - checks required fields based on detected columns
4. **Progress tracking** - shows upload progress
5. **Error reporting** - detailed error messages with row numbers
6. **Phone number formatting** - automatically adds '0' prefix if missing
7. **Debug logging** - console logs for troubleshooting column detection

##### Password Management
1. **Default password**: `123456` for all imported users
2. **Force password change**: Users must change password on first login
3. **Password change component**: Dedicated UI for password updates
4. **Protected routes**: Blocks access until password is changed

#### Usage Instructions

1. **Prepare Excel File**:
   - Columns A, B, C contain irrelevant data (will be skipped)
   - Rows 1-2 contain headers or irrelevant data (will be skipped)
   - **Row 3 MUST contain Hebrew column names** (see list above)
   - Data should start from Row 4
   - Required Hebrew names in Row 3: שם פרטי, שם משפחה, דוא"ל

2. **Upload Process**:
   - Go to Volunteer Management page
   - Click "העלאת קובץ Excel"
   - Select your Excel file
   - System will automatically detect columns based on Row 3 headers
   - Monitor progress in the dialog
   - Review any errors reported

3. **First Login for Imported Users**:
   - Users log in with email and password `123456`
   - System automatically prompts for password change
   - User must set new password before accessing the system

#### Error Handling

##### Common Errors and Solutions:
- **"לא נמצאו עמודות חובה בשורה 3"**: Required Hebrew column names missing in Row 3
- **"חסרים שם פרטי"**: First name is missing or empty
- **"חסרים שם משפחה"**: Last name is missing or empty  
- **"חסרים דוא"ל תקין"**: Email is missing or invalid format
- **"משתמש קיים"**: User with this email already exists
- **"שגיאה ביצירת משתמש"**: Firebase Auth error (check email format)

##### Debug Information:
- Console logs show header row detection and column mapping
- Console logs show extracted data for first few rows
- Row numbers in error messages refer to Excel row numbers
- Progress bar shows processing status
- Detailed error list in upload dialog

#### Testing

To test the functionality:

1. Create an Excel file with the described structure
2. Ensure Row 3 contains the exact Hebrew column names
3. Upload through the Volunteer Management interface
4. Check console logs for column detection and data extraction
5. Verify users were created in Firebase
6. Test login with default password and password change flow

#### Advantages of Dynamic Column Detection

1. **Flexible column order**: Columns can be in any order as long as Row 3 has proper Hebrew names
2. **Robust parsing**: No dependency on fixed column positions
3. **Better error handling**: Clear messages when required columns are missing
4. **Easier maintenance**: Adding new fields only requires updating the column mappings
5. **User-friendly**: Works with various Excel file formats and layouts

#### Security Notes

- Default password is temporary and must be changed
- Users cannot access protected routes until password is changed
- All imported users are flagged with `isExcelImported: true`
- Password change history is tracked

---

*This project was developed as part of academic coursework at Azrieli College.*
