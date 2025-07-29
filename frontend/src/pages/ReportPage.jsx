// src/pages/ReportPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/ReportPage.css'; // Importing the CSS file for styling
import { FaBell, FaUpload } from 'react-icons/fa';
import { saveInquiry, uploadPhoto } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { validateAddressGeocoding } from '../services/geocoding';

export default function ReportPage() {
  const [swarmType, setSwarmType] = useState('דבורים');
  const [wasSprayed, setWasSprayed] = useState('לא');
  const [hadPreviousContact, setHadPreviousContact] = useState('לא');
  const [previousCoordinatorName, setPreviousCoordinatorName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [heightFloor, setHeightFloor] = useState('');
  const [email, setEmail] = useState('');
  const [coordinatorPhoneNumber, setCoordinatorPhoneNumber] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [firstSeenDate, setFirstSeenDate] = useState('');
  const [reporterComments, setReporterComments] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { showSuccess, showError } = useNotification();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get('coordinatorId');
    if (idFromUrl) {
      setCoordinatorId(idFromUrl);
      console.log('Coordinator ID from URL:', idFromUrl);
    }
  }, [location.search]);

  // Check if coordinator ID is required but missing
  if (!coordinatorId) {
    return (
      <div className="report-page">
        <div className="report-card">
          <h2 className="form-title">גישה מוגבלת</h2>
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            fontSize: '1.1em',
            lineHeight: '1.6'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '20px' }}>🔒</div>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>דיווח על נחיל זמין רק דרך רכז</h3>
            <p style={{ margin: '0 0 10px 0' }}>
              כדי לדווח על נחיל דבורים, יש לפנות לרכז המקומי שלכם.
            </p>
            <p style={{ margin: '0', fontSize: '0.9em', opacity: '0.8' }}>
              הרכז יספק לכם קישור ייעודי לביצוע הדיווח.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageName(e.target.files[0].name);
    } else {
      setImageFile(null);
      setImageName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!swarmType || !wasSprayed || !hadPreviousContact || !firstName || !lastName || !phoneNumber || !city || !address || !heightFloor || !email || !coordinatorPhoneNumber || !locationDescription) {
      showError('אנא מלא את כל שדות החובה המסומנים בכוכבית (*).');
      setLoading(false);
      return;
    }
    if (hadPreviousContact === 'כן' && !previousCoordinatorName) {
        showError('נא לציין את שם הרכז אליו פנית בעבר.');
        setLoading(false);
        return;
    }
    if (!imageFile) {
      showError('חובה להעלות תמונה של הנחיל.');
      setLoading(false);
      return;
    }
    if (!agreeToTerms) {
      showError('חובה לאשר את תנאי השירות כדי לשלוח דיווח.');
      setLoading(false);
      return;
    }

    try {
      const geocodingResult = await validateAddressGeocoding(address, city);
      if (!geocodingResult.isValid) {
        let errorMessage = geocodingResult.error;
        if (geocodingResult.suggestion) {
          errorMessage += `\n\n${geocodingResult.suggestion}`;
        }
        showError(errorMessage);
        setLoading(false);
        return;
      }
      
      const inquiryData = {
        swarmType,
        wasSprayed,
        hadPreviousContact,
        previousCoordinatorName: hadPreviousContact === 'כן' ? previousCoordinatorName : '',
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        phoneNumber,
        city,
        address,
        heightFloor,
        email,
        coordinatorPhoneNumber,
        locationDescription,
        firstSeenDate,
        reporterComments,
        status: "נפתחה פנייה (טופס מולא)",
        inquiryDate: new Date().toLocaleDateString('he-IL'),
        inquiryTime: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        coordinatorId: coordinatorId || null,
      };

      const response = await saveInquiry(inquiryData, coordinatorId);
      const inquiryId = response.id;

      if (imageFile && inquiryId) {
        await uploadPhoto(inquiryId, imageFile, 'single');
      }

      showSuccess('הפנייה נשלחה בהצלחה! תודה רבה על הדיווח.');
      
      setSwarmType('דבורים');
      setWasSprayed('לא');
      setHadPreviousContact('לא');
      setPreviousCoordinatorName('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setCity('');
      setAddress('');
      setHeightFloor('');
      setEmail('');
      setCoordinatorPhoneNumber('');
      setLocationDescription('');
      setFirstSeenDate('');
      setReporterComments('');
      setImageFile(null);
      setImageName('');
      setCoordinatorId('');
      setAgreeToTerms(false);
    } catch (error) {
      console.error('שגיאה בשליחת הפנייה:', error);
      showError(`שגיאה בשליחת הפנייה: ${error.message || 'נסה שוב מאוחר יותר.'}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="report-page">
      <div className="report-card">
        <h2 className="form-title">דיווח על נחיל דבורים</h2>

        <form className="report-form" onSubmit={handleSubmit}>

          <div className="readonly-field">
            <label>תאריך הפניה:</label>
            <span>{new Date().toLocaleDateString('he-IL')}</span>
          </div>

          <div className="radio-group">
            <label>* נחיל:</label>
            <input type="radio" id="bees" name="swarmType" value="דבורים" checked={swarmType === 'דבורים'} onChange={(e) => setSwarmType(e.target.value)} />
            <label htmlFor="bees">דבורים</label>
            <input type="radio" id="other" name="swarmType" value="חרק אחר" checked={swarmType === 'חרק אחר'} onChange={(e) => setSwarmType(e.target.value)} />
            <label htmlFor="other">חרק אחר</label>
          </div>
          <div className="radio-group">
            <label>* האם בוצע ריסוס:</label>
            <input type="radio" id="sprayedYes" name="wasSprayed" value="כן" checked={wasSprayed === 'כן'} onChange={(e) => setWasSprayed(e.target.value)} />
            <label htmlFor="sprayedYes">כן</label>
            <input type="radio" id="sprayedNo" name="wasSprayed" value="לא" checked={wasSprayed === 'לא'} onChange={(e) => setWasSprayed(e.target.value)} />
            <label htmlFor="sprayedNo">לא</label>
          </div>
          <div className="radio-group">
            <label>* הייתה פנייה קודמת לרכז אחר:</label>
            <input type="radio" id="contactYes" name="hadPreviousContact" value="כן" checked={hadPreviousContact === 'כן'} onChange={(e) => setHadPreviousContact(e.target.value)} />
            <label htmlFor="contactYes">כן</label>
            <input type="radio" id="contactNo" name="hadPreviousContact" value="לא" checked={hadPreviousContact === 'לא'} onChange={(e) => setHadPreviousContact(e.target.value)} />
            <label htmlFor="contactNo">לא</label>
          </div>
          {hadPreviousContact === 'כן' && (
            <input type="text" placeholder="שם הרכז אליו פנית *" required value={previousCoordinatorName} onChange={(e) => setPreviousCoordinatorName(e.target.value)} />
          )}
          <input type="text" placeholder="* שם פרטי" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="* שם משפחה" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input type="tel" placeholder="* טלפון/נייד" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ direction: 'rtl', textAlign: 'right' }} />
          <input type="email" placeholder="* דואר אלקטרוני (פונה)" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="text" placeholder="* עיר/ישוב" required value={city} onChange={(e) => setCity(e.target.value)} />
          <input type="text" placeholder="* כתובת מלאה (רחוב ומספר בית)" required value={address} onChange={(e) => setAddress(e.target.value)} />
          <input type="text" placeholder="* קומה/גובה" required value={heightFloor} onChange={(e) => setHeightFloor(e.target.value)} />
          <input type="tel" placeholder="* נייד רכז (אליו פנו)" required value={coordinatorPhoneNumber} onChange={(e) => setCoordinatorPhoneNumber(e.target.value)} style={{ direction: 'rtl', textAlign: 'right' }}/>
          <textarea placeholder="* תיאור מיקום הנחיל (לא דבורים בודדות)" rows={3} required value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)}></textarea>
          <label className="date-label">מתי נראה לראשונה:</label>
          <input type="date" value={firstSeenDate} onChange={(e) => setFirstSeenDate(e.target.value)} className="date-input" />
          <textarea placeholder="הערות הפונה" rows={4} value={reporterComments} onChange={(e) => setReporterComments(e.target.value)}></textarea>

          <label className="file-upload required-upload">
            <input type="file" onChange={handleFileChange} accept="image/*" required />
            <FaUpload className="upload-icon" />
            {imageName ? imageName : 'העלאת תמונה של הנחיל (פתח כניסה/יציאה) *'}
          </label>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'שולח...' : (<><FaBell className="button-icon" /> שלח דיווח</>)}
          </button>

          <div className="terms-container">
            <div className="terms-text-block">
              <span className="terms-highlight">לידיעת הפונה - עצם מילוי בקשת הפינוי מהווה הסכמת הפונה:</span>
              <br /><br />
              ידוע לי שאם יתברר שהפינוי כרוך בפירוק / הסרה / פגיעה בקיר / תריס / חרת עץ וכיו"ב, שבמסמך נתחיל והוסכם על דעת הפונה והמתנדב ו/או לעמותת "מגן דברים אדום", אין למתנדב על ביצוע הפינוי הנ"ל, כמו כן אין ולא תהיה שום אחריות או התחייבות להחזיר את המצב לקדמותו או לתקן את הנפגע. כמו כן לא תהיה שום אחריות למתנדב ו/או לעמותת "מגן דברים אדום" לגבי כל פגיעה בנפש או כל צד ג' במהלך הפינוי.
              <br /><br />
              עמותת "מגן דברים אדום", רשאים לשלול אלי טופס משוב לגבי הפינוי ו/או דיווח אחר.
            </div>
            
            <div className="terms-agreement-row">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                required
                className="terms-checkbox"
              />
              <label htmlFor="agreeToTerms" className="terms-agreement-label">
                <span className="terms-highlight">אני מאשר/ת שקראתי והבנתי את התנאים הנ"ל ומסכים/ה לפעול על פיהם.</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}