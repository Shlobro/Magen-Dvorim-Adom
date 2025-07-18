// backend/index.js
import express from 'express';
import cors from 'cors';
import { geocodeAddress } from './services/geocodeAddress.js'; // ודא שהנתיב הזה נכון
import inquiryRoutes from './routes/inquiryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';

const app = express();

// Middleware - חובה עבור תקשורת בין frontend ל-backend וניתוח גוף בקשות
const corsOptions = {
  origin: [
    'https://magendovrimadom.web.app',
    'https://magendovrimadom.firebaseapp.com', 
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions)); // מאפשר בקשות Cross-Origin עם הגדרות מפורטות
app.use(express.json()); // מנתח גוף בקשות בפורמט JSON

// Routes
app.use('/api', inquiryRoutes);
app.use('/api', userRoutes);
app.use('/api/coordinators', coordinatorRoutes);

// ==================================================================
// נקודת קצה חדשה עבור Geocoding (לשימוש ישיר מה-frontend SignUp)
// ==================================================================
app.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body; // הכתובת נשלחת בגוף הבקשה
    if (!address) {
      return res.status(400).send('כתובת נדרשת עבור Geocoding.');
    }
    const coords = await geocodeAddress(address); // קורא לפונקציית ה-Geocoding
    if (coords) {
      res.status(200).json(coords); // מחזיר את הקואורדינטות (lat, lng)
    } else {
      res.status(404).send('לא ניתן היה למצוא קואורדינטות לכתובת.');
    }
  } catch (error) {
    console.error('שגיאת Geocoding ב-backend:', error);
    res.status(500).send('שגיאה בביצוע Geocoding לכתובת.');
  }
});

// ==================================================================
// נקודת קצה עבור הורדת תמונות מFirebase Storage
// ==================================================================
app.get('/download-photo', async (req, res) => {
  try {
    const { url } = req.query; // הURL של התמונה מגיע כquery parameter
    
    if (!url) {
      return res.status(400).json({ error: 'URL נדרש עבור הורדת התמונה' });
    }

    // בדיקה שזה URL של Firebase Storage
    if (!url.includes('firebasestorage.googleapis.com')) {
      return res.status(400).json({ error: 'ניתן להוריד רק תמונות מFirebase Storage' });
    }

    console.log('📸 Downloading photo from:', url);

    // הורדת התמונה מFirebase Storage
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MagenDovrumAdom-Backend/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Firebase Storage response error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `שגיאה בהורדת התמונה מFirebase: ${response.status} ${response.statusText}` 
      });
    }

    // קביעת content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // הגדרת headers לCORS ולתמונה
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Cache-Control', 'no-cache');
    
    // הזרמת התמונה
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
    console.log('✅ Photo downloaded and sent successfully');
    
  } catch (error) {
    console.error('❌ Error downloading photo:', error);
    res.status(500).json({ error: `שגיאה בהורדת התמונה: ${error.message}` });
  }
});

// הוספת OPTIONS handler לCORS preflight
app.options('/download-photo', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.sendStatus(200);
});

// הגדרת השרת להאזנה לפורט
const PORT = process.env.PORT || 3001; // פורט 3001 הוא הנפוץ ל-backend ביישומי MERN
app.listen(PORT, () => {
  console.log(`השרת פועל על פורט ${PORT}`);
});