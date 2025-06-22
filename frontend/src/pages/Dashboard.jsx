import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomeScreen.css';

export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser, userRole, loading: authLoading } = useAuth();

  // State for coordinator report link
  const [reportLink, setReportLink] = useState('');

  // Ref to hold a map of coordinatorId to coordinatorName
  const coordinatorNamesRef = useRef({});

  // ───────────────────────────── Filter States
  const [filterVolunteer, setFilterVolunteer] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const statusOptions = [
    'נשלח קישור אך לא מולא טופס',
    'נפתחה פנייה (טופס מולא)',
    'לפנייה שובץ מתנדב',
    'המתנדב בדרך',
    'הטיפול בנחיל הסתיים',
    'הפנייה נסגרה',
  ];

  const closureOptions = [
    'נפתר עצמאית',
    'לא ניתן לטפל',
    'מיקום לא נגיש',
    'מתנדב לא הגיע',
    'אחר',
  ];

  // ───────────────────────────────── fetch calls once
  useEffect(() => {
    const fetchCalls = async () => {
      if (authLoading || !currentUser) {
        if (!authLoading && !currentUser) {
          setError('יש להתחבר כדי לצפות בלוח המחוונים.');
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let inquiriesRef = collection(db, 'inquiry');
        let fetchedInquiries = [];

        if (userRole === 1) { // Coordinator role
          const assignedToCoordinatorQuery = query(
            inquiriesRef,
            where('coordinatorId', '==', currentUser.uid)
          );
          const unassignedNullQuery = query(
            inquiriesRef,
            where('coordinatorId', '==', null)
          );
          const unassignedEmptyStringQuery = query(
            inquiriesRef,
            where('coordinatorId', '==', '')
          );

          const [assignedSnap, nullSnap, emptyStringSnap] = await Promise.all([
            getDocs(assignedToCoordinatorQuery),
            getDocs(unassignedNullQuery),
            getDocs(unassignedEmptyStringQuery)
          ]);

          fetchedInquiries = [
            ...assignedSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...nullSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...emptyStringSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          ];
          const uniqueInquiries = Array.from(new Map(fetchedInquiries.map(item => [item['id'], item])).values());
          fetchedInquiries = uniqueInquiries;

        } else { // Admin or other roles
          const allInquiriesQuery = inquiriesRef;
          const inquirySnap = await getDocs(allInquiriesQuery);
          fetchedInquiries = inquirySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        // Collect all unique volunteer UIDs and coordinator UIDs
        const volunteerUids = new Set();
        const coordinatorUids = new Set();

        fetchedInquiries.forEach(call => {
          if (call.assignedVolunteers && typeof call.assignedVolunteers === 'string' && call.assignedVolunteers.trim() !== '') {
            volunteerUids.add(call.assignedVolunteers);
          }
          if (call.coordinatorId && typeof call.coordinatorId === 'string' && call.coordinatorId.trim() !== '') {
            coordinatorUids.add(call.coordinatorId);
          }
        });

        // Fetch volunteer names
        const uidToVolunteerName = {};
        await Promise.all(
          Array.from(volunteerUids).map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'user', uid));
              if (snap.exists()) {
                const d = snap.data();
                uidToVolunteerName[uid] = d.name || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
              }
            } catch (e) { console.error("Error fetching volunteer name:", uid, e); /* ignore */ }
          })
        );

        // Fetch coordinator names
        const uidToCoordinatorName = {};
        await Promise.all(
          Array.from(coordinatorUids).map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'user', uid));
              if (snap.exists()) {
                const d = snap.data();
                uidToCoordinatorName[uid] = d.name || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
              }
            } catch (e) { console.error("Error fetching coordinator name:", uid, e); /* ignore */ }
          })
        );
        coordinatorNamesRef.current = uidToCoordinatorName; // Store for later use if needed

        // Merge names and ensure coordinatorId is present (or null)
        const withNames = fetchedInquiries.map((c) => ({
          ...c,
          assignedVolunteerName: uidToVolunteerName[c.assignedVolunteers] ?? '-',
          coordinatorId: c.coordinatorId || null,
          coordinatorName: (c.coordinatorId && uidToCoordinatorName[c.coordinatorId]) ? uidToCoordinatorName[c.coordinatorId] : '-', // Add coordinatorName
        }));

        setCalls(withNames);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching calls:', err);
        setError('Failed to fetch calls.');
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchCalls();
    }
  }, [currentUser, userRole, authLoading]);

  // Generate report link when currentUser is available
  useEffect(() => {
    if (currentUser && userRole === 1) { // Only generate for coordinators
      const baseUrl = window.location.origin;
      setReportLink(`${baseUrl}/report?coordinatorId=${currentUser.uid}`);
    } else {
      setReportLink(''); // Clear link if not a coordinator
    }
  }, [currentUser, userRole]);

  const copyReportLink = () => {
    if (reportLink) {
        const tempInput = document.createElement('input');
        tempInput.value = reportLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('הקישור לדיווח הועתק בהצלחה!');
    }
  };


  // ───────────────────────────── Derived State: Unique Volunteer Names
  const uniqueVolunteerNames = useMemo(() => {
    const names = new Set();
    calls.forEach(call => {
      if (call.assignedVolunteerName && call.assignedVolunteerName !== '-') {
        names.add(call.assignedVolunteerName);
      }
    });
    return Array.from(names).sort();
  }, [calls]);

  // ───────────────────────────── Filtered Calls Logic
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      let match = true;

      if (filterVolunteer && call.assignedVolunteerName !== filterVolunteer) {
        match = false;
      }
      if (filterStatus && call.status !== filterStatus) {
        match = false;
      }
      if ((filterStartDate || filterEndDate) && match) {
        const callDate = call.timestamp?.toDate();
        let fallbackDate = null;
        if (!callDate && call.date && call.time) {
            try {
                const [day, month, year] = call.date.split('.').map(Number);
                const [hours, minutes] = call.time.split(':').map(Number);
                fallbackDate = new Date(year, month - 1, day, hours, minutes);
            } catch (e) {
                console.warn("Could not parse date/time strings for filtering:", call.date, call.time, e);
            }
        }
        const effectiveCallDate = callDate || fallbackDate;
        if (!effectiveCallDate) return false;


        const start = filterStartDate ? new Date(filterStartDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = filterEndDate ? new Date(filterEndDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && effectiveCallDate < start) match = false;
        if (end && effectiveCallDate > end) match = false;
      }

      return match;
    });
  }, [calls, filterVolunteer, filterStartDate, filterEndDate, filterStatus]);


  // ───────────────────────────── Handlers for filters
  const handleVolunteerFilterChange = (e) => {
    setFilterVolunteer(e.target.value);
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setFilterVolunteer('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleStartDateFilterChange = (e) => {
    setFilterStartDate(e.target.value);
    // If a start date is selected, clear end date if it's before start date
    if (e.target.value && filterEndDate && new Date(e.target.value) > new Date(filterEndDate)) {
      setFilterEndDate('');
    }
    setFilterVolunteer('');
    setFilterStatus('');
  };

  const handleEndDateFilterChange = (e) => {
    setFilterEndDate(e.target.value);
    setFilterVolunteer('');
    setFilterStatus('');
  };

  // ───────────────────────────── status / closure handlers
  const handleStatusChange = async (callId, newStatus) => {
    try {
      await updateDoc(doc(db, 'inquiry', callId), { status: newStatus });
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, status: newStatus } : c))
      );
      alert('סטטוס עודכן בהצלחה!');
    } catch (err) {
      console.error(err);
      alert('נכשל בעדכון סטטוס.');
    }
  };

  const handleClosureChange = async (callId, newClosureReason) => {
    try {
      await updateDoc(doc(db, 'inquiry', callId), { closureReason: newClosureReason });
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, closureReason: newClosureReason } : c))
      );
      alert('סיבת סגירה עודכנה בהצלחה!');
    } catch (err) {
      console.error(err);
      alert('נכשל בעדכון סיבת סגירה.');
    }
  };

  const handleAssignVolunteerClick = (inquiryId) => {
    navigate(`/volunteer-map?inquiryId=${inquiryId}`);
  };

  // ───────────────────────────── Generate feedback link handler
  const handleGenerateFeedbackLink = (inquiryId) => {
    const baseUrl = window.location.origin;
    const feedbackLink = `${baseUrl}/feedback?inquiryId=${inquiryId}`;
    window.open(feedbackLink, '_blank');
    alert(`קישור למשוב נוצר ונפתח בחלון חדש:\n${feedbackLink}\nניתן להעתיק ולשלוח לפונה.`);
  };

  // ───────────────────────────── Helper for CSV export
  const exportToCsv = (data, filename) => {
    if (data.length === 0) {
      alert('אין נתונים להפקת דוח בקריטריונים הנוכחיים.');
      return;
    }

    const headers = [
      'מזהה קריאה', 'שם מלא פונה', 'טלפון פונה', 'עיר', 'כתובת', 'הערות',
      'תאריך דיווח', 'סטטוס', 'סיבת סגירה', 'שם מתנדב משובץ', 'שם רכז'
    ];

    const rows = data.map(call => [
      call.id,
      call.fullName,
      call.phoneNumber,
      call.city || '',
      call.address,
      call.additionalDetails,
      call.timestamp?.toDate().toLocaleString() || `${call.date} ${call.time}`,
      call.status,
      call.closureReason || '',
      call.assignedVolunteerName || '-',
      call.coordinatorName || '',
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

    const csvContent = headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('דוח הופק בהצלחה!');
    }
  };

  // ───────────────────────────── Export Feedback Report
  const handleExportFeedback = async () => {
    try {
      setLoading(true);
      const feedbackSnap = await getDocs(collection(db, 'feedback'));
      const feedbackData = feedbackSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          inquiryId: data.inquiryId || '',
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          volunteerName: data.volunteerName || '',
          rating: data.rating || 0,
          comments: data.comments || '',
          timestamp: data.timestamp?.toDate().toLocaleString() || '',
        };
      });

      if (feedbackData.length === 0) {
        alert('אין נתוני משוב להפקת דוח.');
        setLoading(false);
        return;
      }

      const headers = [
        'מזהה משוב', 'מזהה פנייה', 'שם מלא', 'מספר טלפון',
        'שם מתנדב', 'דירוג', 'הערות', 'תאריך ושעת משוב'
      ];

      const rows = feedbackData.map(row => [
        row.id, row.inquiryId, row.fullName, row.phoneNumber,
        row.volunteerName, row.rating, row.comments, row.timestamp
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

      const csvContent = headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `feedback_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('דוח משובים הופק בהצלחה!');
      }
    } catch (err) {
      console.error('Error exporting feedback:', err);
      setError('שגיאה בהפקת דוח משובים.');
    } finally {
      setLoading(false);
    }
  };


  // ───────────────────────────── Specific Export functions for filtered data
  const handleExportVolunteerReport = () => {
    let dataToExport = calls;
    let reportName = 'כל_המתנדבים';

    if (filterVolunteer) {
      dataToExport = calls.filter(call => call.assignedVolunteerName === filterVolunteer);
      reportName = filterVolunteer.replace(/ /g, '_');
    }

    const filename = `volunteer_report_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(dataToExport, filename);
  };

  const handleExportStatusReport = () => {
    let dataToExport = calls;
    let reportName = 'כל_הסטטוסים';

    if (filterStatus) {
      dataToExport = calls.filter(call => call.status === filterStatus);
      reportName = filterStatus.replace(/ /g, '_');
    }

    const filename = `status_report_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(dataToExport, filename);
  };

  const handleExportDateRangeReport = () => {
    let dataToExport = calls;
    let reportName = 'כל_התאריכים';

    const currentYear = new Date().getFullYear();
    const defaultStartDate = new Date(currentYear, 0, 1);
    const defaultEndDate = new Date(currentYear, 11, 31);

    let actualStartDate = filterStartDate ? new Date(filterStartDate) : defaultStartDate;
    let actualEndDate = filterEndDate ? new Date(filterEndDate) : defaultEndDate;

    actualStartDate.setHours(0, 0, 0, 0);
    actualEndDate.setHours(23, 59, 59, 999);

    if (filterStartDate || filterEndDate) {
      dataToExport = calls.filter(call => {
        const callDate = call.timestamp?.toDate();
        let fallbackDate = null;
        if (!callDate && call.date && call.time) {
            try {
                const [day, month, year] = call.date.split('.').map(Number);
                const [hours, minutes] = call.time.split(':').map(Number);
                fallbackDate = new Date(year, month - 1, day, hours, minutes);
            } catch (e) {
                console.warn("Could not parse date/time strings for filtering in export:", call.date, call.time, e);
            }
        }
        const effectiveCallDate = callDate || fallbackDate;
        if (!effectiveCallDate) return false;

        return effectiveCallDate >= actualStartDate && effectiveCallDate <= actualEndDate;
      });
      reportName = `${filterStartDate || 'תחילה'}_${filterEndDate || 'סוף'}`;
    } else {
      dataToExport = calls.filter(call => {
        const callDate = call.timestamp?.toDate();
        let fallbackDate = null;
        if (!callDate && call.date && call.time) {
            try {
                const [day, month, year] = call.date.split('.').map(Number);
                const [hours, minutes] = call.time.split(':').map(Number);
                fallbackDate = new Date(year, month - 1, day, hours, minutes);
            } catch (e) {
                console.warn("Could not parse date/time strings for filtering in export (default):", call.date, call.time, e);
            }
        }
        const effectiveCallDate = callDate || fallbackDate;
        if (!effectiveCallDate) return false;

        return effectiveCallDate >= defaultStartDate && effectiveCallDate <= defaultEndDate;
      });
    }

    const filename = `date_range_report_${reportName.replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(dataToExport, filename);
  };


  // ───────────────────────────── ui
  if (authLoading || loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      fontSize: '1.1em',
      color: '#666'
    }}>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        טוען נתונים...
      </div>
    </div>
  );
  
  if (error) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh'
    }}>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#fff5f5',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #fed7d7',
        color: '#e53e3e'
      }}>
        שגיאה: {error}
      </div>
    </div>
  );
  
  if (!currentUser) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh'
    }}>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#fff5f5',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #fed7d7',
        color: '#e53e3e'
      }}>
        אנא התחבר כדי לגשת ללוח המחוונים.
      </div>
    </div>
  );


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px 30px',
            textAlign: 'center'
          }}>
            <h1 style={{
              margin: '0 0 10px 0',
              fontSize: '2.5em',
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              ניהול קריאות נחילים
            </h1>
            <div style={{
              fontSize: '1.1em',
              opacity: '0.9',
              fontWeight: '400'
            }}>
              מערכת ניהול פניות ומעקב אחר מתנדבים
            </div>
          </div>

          <div style={{ padding: '30px' }}>
            {/* Coordinator Report Link Section */}
            {userRole === 1 && (
              <div style={{
                marginBottom: '40px',
                textAlign: 'center',
                padding: '25px',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                borderRadius: '12px',
                border: '1px solid #e1f5fe'
              }}>
                <div style={{
                  marginBottom: '20px',
                  fontSize: '1.1em',
                  color: '#1565c0',
                  fontWeight: '600'
                }}>
                  קישור לשליחת פנייה עבורך
                </div>
                <button
                  onClick={copyReportLink}
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,123,255,0.3)';
                  }}
                >
                  📋 העתק קישור לדיווח
                </button>
              </div>
            )}

            {/* Filters Section */}
            <div style={{
              marginBottom: '30px',
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                margin: '0 0 25px 0',
                color: '#495057',
                fontSize: '1.3em',
                fontWeight: '600',
                textAlign: 'right'
              }}>
                🔍 סינון נתונים
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                direction: 'rtl'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    פילטר מתנדב:
                  </label>
                  <select
                    value={filterVolunteer}
                    onChange={handleVolunteerFilterChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  >
                    <option value="">כל המתנדבים</option>
                    {uniqueVolunteerNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    פילטר סטטוס:
                  </label>
                  <select
                    value={filterStatus}
                    onChange={handleStatusFilterChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  >
                    <option value="">כל הסטטוסים</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    מתאריך:
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={handleStartDateFilterChange}
                    style={{
                      width: '85%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    עד תאריך:
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={handleEndDateFilterChange}
                    style={{
                      width: '85%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  />
                </div>
              </div>
            </div>

            {/* Export Buttons Section */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              marginBottom: '40px',
              justifyContent: 'center',
              padding: '25px',
              background: '#e8f5e9', /* Light green for export section */
              borderRadius: '12px',
              border: '1px solid #c8e6c9'
            }}>
              <h3 style={{
                width: '100%',
                margin: '0 0 20px 0',
                color: '#2e7d32', /* Darker green */
                fontSize: '1.2em',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                📊 הפקת דוחות
              </h3>

              <button
                onClick={handleExportFeedback}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: 'white',
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  boxShadow: '0 3px 10px rgba(0,123,255,0.2)',
                  transition: 'all 0.3s ease',
                  flex: '1 1 auto',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,123,255,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,123,255,0.2)'; }}
              >
                דוח משובים
              </button>

              <button
                onClick={handleExportVolunteerReport}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                  color: 'white',
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  boxShadow: '0 3px 10px rgba(76,175,80,0.2)',
                  transition: 'all 0.3s ease',
                  flex: '1 1 auto',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(76,175,80,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(76,175,80,0.2)'; }}
              >
                דוח מתנדב
              </button>

              <button
                onClick={handleExportStatusReport}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
                  color: '#333',
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  boxShadow: '0 3px 10px rgba(255,193,7,0.2)',
                  transition: 'all 0.3s ease',
                  flex: '1 1 auto',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,193,7,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(255,193,7,0.2)'; }}
              >
                דוח סטטוס
              </button>

              <button
                onClick={handleExportDateRangeReport}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                  color: 'white',
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  boxShadow: '0 3px 10px rgba(108,117,125,0.2)',
                  transition: 'all 0.3s ease',
                  flex: '1 1 auto',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(108,117,125,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(108,117,125,0.2)'; }}
              >
                דוח תאריכים
              </button>
            </div>

            {/* Table Section */}
            <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                direction: 'rtl'
              }}>
                <thead>
                  <tr style={{ background: '#f0f4f7' }}>
                    {[
                      'שם מלא', 'טלפון', 'עיר', 'כתובת', 'הערות', 'תאריך דיווח',
                      'סטטוס', 'סיבת סגירה', 'מתנדב משובץ', 'רכז מטפל', 'פעולות',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '15px 25px',
                          textAlign: 'right',
                          borderBottom: '2px solid #dae1e8',
                          fontWeight: '700',
                          color: '#34495e',
                          backgroundColor: '#eef4f9', /* Ensure header background for stickiness if table scrolls */
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCalls.map((call, index) => {
                    const isUnassigned = !call.coordinatorId;
                    const rowBg = isUnassigned ? '#fffaf0' : (index % 2 === 0 ? '#ffffff' : '#f9fcfd');

                    return (
                      <tr
                        key={call.id}
                        style={{
                          borderBottom: '1px solid #eceff1',
                          backgroundColor: rowBg,
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = isUnassigned ? '#ffe0b2' : '#e3f2fd'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = rowBg}
                      >
                        <td style={{ padding: '15px 25px', whiteSpace: 'nowrap' }}>{call.fullName}</td>
                        <td style={{ padding: '15px 25px', whiteSpace: 'nowrap' }}>{call.phoneNumber}</td>
                        <td style={{ padding: '15px 25px' }}>{call.city || '-'}</td>
                        <td style={{ padding: '15px 25px' }}>{call.address}</td>
                        <td style={{ padding: '15px 25px', maxWidth: '250px', overflowWrap: 'break-word' }}>{call.additionalDetails || '-'}</td>
                        <td style={{ padding: '15px 25px', whiteSpace: 'nowrap' }}>
                          {call.timestamp?.toDate().toLocaleString('he-IL') || `${call.date} ${call.time}`}
                        </td>

                        <td style={{ padding: '15px 25px' }}>
                          <select
                            value={call.status || ''}
                            onChange={(e) => handleStatusChange(call.id, e.target.value)}
                            style={{
                              padding: '10px 15px',
                              borderRadius: '6px',
                              border: '1px solid #b0bec5',
                              minWidth: '180px',
                              backgroundColor: 'white',
                              fontSize: '0.95em',
                              cursor: 'pointer'
                            }}
                          >
                            {statusOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ padding: '15px 25px' }}>
                          {call.status === 'הפנייה נסגרה' && (
                            <select
                              value={call.closureReason || ''}
                              onChange={(e) =>
                                handleClosureChange(call.id, e.target.value)
                              }
                              style={{
                                padding: '10px 15px',
                                borderRadius: '6px',
                                border: '1px solid #b0bec5',
                                minWidth: '180px',
                                backgroundColor: 'white',
                                fontSize: '0.95em',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">בחר סיבה</option>
                              {closureOptions.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td style={{ padding: '15px 25px', whiteSpace: 'nowrap' }}>
                          {call.assignedVolunteerName}
                        </td>
                        <td style={{ padding: '15px 25px', whiteSpace: 'nowrap' }}>
                          {isUnassigned ? (
                            <span style={{ color: '#e67e22', fontStyle: 'italic', fontWeight: '500' }}>
                              לא שויך לרכז
                            </span>
                          ) : (
                            call.coordinatorName
                          )}
                        </td>

                        <td style={{ padding: '15px 25px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          {call.status === 'נפתחה פנייה (טופס מולא)' && (
                            <button
                              onClick={() => handleAssignVolunteerClick(call.id)}
                              style={{
                                background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
                                color: '#fff',
                                padding: '10px 18px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(40,167,69,0.2)',
                                transition: 'all 0.2s ease',
                                width: 'fit-content'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(40,167,69,0.3)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,167,69,0.2)'; }}
                            >
                              שבץ מתנדב
                            </button>
                          )}

                          {call.status === 'הפנייה נסגרה' && (
                            <button
                              onClick={() => handleGenerateFeedbackLink(call.id)}
                              style={{
                                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                color: '#fff',
                                padding: '10px 18px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(23,162,184,0.2)',
                                transition: 'all 0.2s ease',
                                width: 'fit-content'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(23,162,184,0.3)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(23,162,184,0.2)'; }}
                            >
                              צור קישור למשוב
                            </button>
                          )}

                          {call.status !== 'נפתחה פנייה (טופס מולא)' && call.status !== 'הפנייה נסגרה' && (
                              <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8em', whiteSpace: 'nowrap' }}>אין פעולות זמינות</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCalls.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em', fontWeight: '500' }}>
                        אין נתונים להצגה (נסה לשנות פילטרים)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            <footer style={{
              marginTop: '40px',
              paddingTop: '25px',
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
              color: '#777',
              fontSize: '0.9em'
            }}>
              © 2025 מגן דבורים אדום. כל הזכויות שמורות.
            </footer>
          </div> {/* End padding div */}
        </div> {/* End dashboard card inner */}
      </div> {/* End max-width container */}
    </div> // End dashboard container
  );
}