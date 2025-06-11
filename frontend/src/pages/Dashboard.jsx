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
      if (filterVolunteer) {
        return call.assignedVolunteerName === filterVolunteer;
      }
      if (filterStatus) {
        return call.status === filterStatus;
      }
      if (filterStartDate || filterEndDate) {
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

        if (start && effectiveCallDate < start) return false;
        if (end && effectiveCallDate > end) return false;
        return true;
      }

      return true;
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
    setFilterEndDate('');
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
      'תאריך דיווח', 'סטטוס', 'סיבת סגירה', 'שם מתנדב משובץ', 'שם רכז' // Changed from 'מזהה רכז' to 'שם רכז'
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
      call.coordinatorName || '', // Use coordinatorName
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
  if (authLoading || loading) return <div className="loading">טוען נתונים...</div>;
  if (error) return <div className="error">שגיאה: {error}</div>;
  if (!currentUser) return <div className="error">אנא התחבר כדי לגשת ללוח המחוונים.</div>;


  return (
    <div className="dashboard-container" style={{ padding: 20 }}>
      <div className="dashboard-card" style={{ maxWidth: 1200, margin: 'auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>
          ניהול קריאות נחילים
        </h1>

        {userRole === 1 && ( // Only show this section for coordinators
          <div style={{
            marginBottom: '30px',
            textAlign: 'center',
            padding: '10px 0', // Reduced padding
            borderBottom: '1px solid #eee', // Subtle border
          }}>
            <p style={{ marginBottom: '15px', fontSize: '0.9em', color: '#555' }}>
              העתק קישור לשליחת פנייה עבורך:
            </p>
            <button
              onClick={copyReportLink}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              העתק קישור לדיווח
            </button>
          </div>
        )}

        {/* ───────────────────────────── Filters Section ───────────────────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '30px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          justifyContent: 'flex-end',
          direction: 'rtl'
        }}>
          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label htmlFor="filterVolunteer" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              פילטר מתנדב:
            </label>
            <select
              id="filterVolunteer"
              value={filterVolunteer}
              onChange={handleVolunteerFilterChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">כל המתנדבים</option>
              {uniqueVolunteerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label htmlFor="filterStatus" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              פילטר סטטוס:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={handleStatusFilterChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">כל הסטטוסים</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label htmlFor="filterStartDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              מתאריך:
            </label>
            <input
              type="date"
              id="filterStartDate"
              value={filterStartDate}
              onChange={handleStartDateFilterChange}
              style={{ width: '90%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label htmlFor="filterEndDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              עד תאריך:
            </label>
            <input
              type="date"
              id="filterEndDate"
              value={filterEndDate}
              onChange={handleEndDateFilterChange}
              style={{ width: '90%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
        {/* ───────────────────────────── End Filters Section ───────────────────────────── */}

        {/* ───────────────────────────── Specific Export Buttons (Unified and repositioned) ───────────────────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleExportFeedback}
            disabled={loading}
            style={{
              backgroundColor: '#0056b3', // Dark blue
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '0.9em',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.style.color = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0056b3'; e.currentTarget.style.color = '#fff'; }}
          >
            דוח משובים
          </button>

          <button
            onClick={handleExportVolunteerReport}
            disabled={loading}
            style={{
              backgroundColor: '#0056b3', // Dark blue
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '0.9em',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.style.color = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0056b3'; e.currentTarget.style.color = '#fff'; }}
          >
            דוח מתנדב
          </button>

          <button
            onClick={handleExportStatusReport}
            disabled={loading}
            style={{
              backgroundColor: '#0056b3', // Dark blue
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '0.9em',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.style.color = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0056b3'; e.currentTarget.style.color = '#fff'; }}
          >
            דוח סטטוס
          </button>

          <button
            onClick={handleExportDateRangeReport}
            disabled={loading}
            style={{
              backgroundColor: '#0056b3', // Dark blue
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '0.9em',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.style.color = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0056b3'; e.currentTarget.style.color = '#fff'; }}
          >
            דוח תאריכים
          </button>
        </div>
        {/* ───────────────────────────── End Specific Export Buttons ───────────────────────────── */}


        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                {[
                  'שם מלא', 'טלפון', 'עיר', 'כתובת', 'הערות', 'תאריך דיווח',
                  'סטטוס', 'סיבת סגירה', 'מתנדב משובץ', 'רכז מטפל', 'פעולות', // Changed 'מזהה רכז' to 'רכז מטפל'
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'right',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredCalls.map((call) => {
                const isUnassigned = !call.coordinatorId;

                return (
                  <tr
                    key={call.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: isUnassigned ? '#fffaf0' : 'inherit',
                    }}
                  >
                    <td style={{ padding: '10px 20px' }}>{call.fullName}</td>
                    <td style={{ padding: '10px 20px' }}>{call.phoneNumber}</td>
                    <td style={{ padding: '10px 20px' }}>{call.city || '-'}</td>
                    <td style={{ padding: '10px 20px' }}>{call.address}</td>
                    <td style={{ padding: '10px 20px' }}>{call.additionalDetails || '-'}</td>
                    <td style={{ padding: '10px 20px' }}>
                      {call.timestamp?.toDate().toLocaleString() || `${call.date} ${call.time}`}
                    </td>

                    <td style={{ padding: '10px 20px' }}>
                      <select
                        value={call.status || ''}
                        onChange={(e) => handleStatusChange(call.id, e.target.value)}
                        style={{ padding: 8, borderRadius: 5, minWidth: 180 }}
                      >
                        {statusOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '10px 20px' }}>
                      {call.status === 'הפנייה נסגרה' && (
                        <select
                          value={call.closureReason || ''}
                          onChange={(e) =>
                            handleClosureChange(call.id, e.target.value)
                          }
                          style={{ padding: 8, borderRadius: 5, minWidth: 180 }}
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

                    <td style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                      {call.assignedVolunteerName}
                    </td>
                    <td style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                      {isUnassigned ? (
                        <span style={{ color: '#888', fontStyle: 'italic' }}>
                          לא שויך לרכז
                        </span>
                      ) : (
                        call.coordinatorName // Display coordinator's name
                      )}
                    </td>

                    <td style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {call.status === 'נפתחה פנייה (טופס מולא)' && (
                        <button
                          onClick={() => handleAssignVolunteerClick(call.id)}
                          style={{
                            backgroundColor: '#28a745',
                            color: '#fff',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: 5,
                            cursor: 'pointer',
                            marginBottom: '5px'
                          }}
                        >
                          שבץ מתנדב
                        </button>
                      )}

                      {call.status === 'הפנייה נסגרה' && (
                        <button
                          onClick={() => handleGenerateFeedbackLink(call.id)}
                          style={{
                            backgroundColor: '#007bff',
                            color: '#fff',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: 5,
                            cursor: 'pointer',
                          }}
                        >
                          צור קישור למשוב
                        </button>
                      )}

                      {call.status !== 'נפתחה פנייה (טופס מולא)' && call.status !== 'הפנייה נסגרה' && (
                          <span>אין פעולות זמינות</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                    אין נתונים להצגה (נסה לשנות פילטרים)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="footer" style={{ marginTop: 40 }}>
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}