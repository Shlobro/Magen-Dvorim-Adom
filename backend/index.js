// backend/index.js
import express from 'express';
import cors from 'cors';
import { geocodeAddress } from './services/geocodeAddress.js'; // ודא שהנתיב הזה נכון

const app = express();

// Middleware - חובה עבור תקשורת בין frontend ל-backend וניתוח גוף בקשות
app.use(cors()); // מאפשר בקשות Cross-Origin (למשל מה-frontend ל-backend)
app.use(express.json()); // מנתח גוף בקשות בפורמט JSON

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

// הגדרת השרת להאזנה לפורט
const PORT = process.env.PORT || 3001; // פורט 3001 הוא הנפוץ ל-backend ביישומי MERN
app.listen(PORT, () => {
  console.log(`השרת פועל על פורט ${PORT}`);
});