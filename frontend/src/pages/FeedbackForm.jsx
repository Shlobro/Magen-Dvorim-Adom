// frontend/src/pages/FeedbackForm.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/HomeScreen.css'; // נשתמש בסגנונות הקיימים לצורך עקביות

export default function FeedbackForm() {
  const [inquiryId, setInquiryId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [volunteerName, setVolunteerName] = useState(''); // שם המתנדב שטיפל
  const [rating, setRating] = useState(0); // דירוג מ-1 עד 5
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // ──────────────────────────────────────────
  // Fetch inquiry details if inquiryId is provided in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get('inquiryId');

    if (idFromUrl) {
      setInquiryId(idFromUrl);
      const fetchInquiryDetails = async () => {
        try {
          const inquiryRef = doc(db, 'inquiry', idFromUrl);
          const inquirySnap = await getDoc(inquiryRef);

          if (inquirySnap.exists()) {
            const data = inquirySnap.data();
            setFullName(data.fullName || '');
            setPhoneNumber(data.phoneNumber || '');

            // Try to fetch volunteer name if assignedVolunteers exists
            if (data.assignedVolunteers) {
              const volunteerRef = doc(db, 'user', data.assignedVolunteers);
              const volunteerSnap = await getDoc(volunteerRef);
              if (volunteerSnap.exists()) {
                const volData = volunteerSnap.data();
                setVolunteerName(volData.name || `${volData.firstName || ''} ${volData.lastName || ''}`.trim());
              }
            }
          } else {
            setError('מזהה פנייה לא נמצא.');
          }
        } catch (err) {
          console.error('Error fetching inquiry details:', err);
          setError('שגיאה בטעינת פרטי הפנייה.');
        }
      };
      fetchInquiryDetails();
    }
  }, [location.search]);

  // ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!inquiryId || !fullName || !phoneNumber || rating === 0) {
      setError('אנא מלא את כל השדות המסומנים בכוכבית ואת הדירוג.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'feedback'), {
        inquiryId,
        fullName,
        phoneNumber,
        volunteerName: volunteerName || 'לא צוין', // לשמור את שם המתנדב כפי שנשלף או "לא צוין"
        rating,
        comments,
        timestamp: new Date(),
      });
      setSuccess('תודה רבה על המשוב שלך! נשמח ללמוד ולשפר.');
      // איפוס טופס לאחר שליחה מוצלחת
      setInquiryId(''); // לא לאפס אם הגיע מ-URL
      setFullName('');
      setPhoneNumber('');
      setVolunteerName('');
      setRating(0);
      setComments('');

      // ניתן להפנות את המשתמש לדף תודה או לדף הבית
      setTimeout(() => navigate('/'), 3000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('אירעה שגיאה בשליחת המשוב. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  return (
    <div className="home-page"> {/* השתמש בקלאס קיים */}
      <section className="intro">
        <h1 className="main-title">טופס משוב על טיפול בנחיל</h1>
        <p className="main-paragraph">
          תודה על פנייתך לעמותת מגן דבורים אדום! נשמח לקבל ממך משוב על הטיפול בנחיל הדבורים. המשוב שלך חשוב לנו מאוד לצורך שיפור השירות.
        </p>
      </section>

      <form className="report-form" onSubmit={handleSubmit}> {/* השתמש בקלאס קיים */}
        <div className="report-page"> {/* השתמש בקלאס קיים */}
          <div className="report-card"> {/* השתמש בקלאס קיים */}

            <input
              type="text"
              placeholder="מזהה פנייה (אם ידוע)"
              value={inquiryId}
              onChange={(e) => setInquiryId(e.target.value)}
              disabled={!!new URLSearchParams(location.search).get('inquiryId')} // disable if from URL
            />
            <input
              type="text"
              placeholder="שם מלא *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="מספר טלפון *"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="שם המתנדב/ת שטיפל/ה (אופציונלי)"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
            />

            <div style={{ marginBottom: '15px', textAlign: 'right', direction: 'rtl', fontSize: '1.1em', color: '#555' }}>
              <label>דירוג הטיפול (1 - הכי פחות מרוצה, 5 - הכי מרוצה) *</label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '2.5em',
                      color: star <= rating ? '#FFD700' : '#CCCCCC', // Gold for selected, grey for unselected
                    }}
                  >
                    &#9733; {/* Unicode star character */}
                  </span>
                ))}
              </div>
            </div>

            <textarea
              placeholder="הערות נוספות ומשוב מפורט"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="5"
            ></textarea>

            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {success && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'שולח...' : 'שלח משוב'}
            </button>
          </div>
        </div>
      </form>

      <footer className="footer">© 2025 מגן דבורים אדום. כל הזכויות שמורות.</footer>
    </div>
  );
}