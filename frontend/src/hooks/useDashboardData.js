import { useState, useEffect, useMemo, useRef } from "react"
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { takeOwnership, releaseOwnership, reassignVolunteer } from "../services/inquiryApi"
import { userService } from "../services/firebaseService"

export const useDashboardData = (currentUser, userRole, authLoading, showSuccess, showError, showWarning, showConfirmDialog) => {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [volunteers, setVolunteers] = useState([])
  const [loadingVolunteers, setLoadingVolunteers] = useState(false)

  // Ref to hold a map of coordinatorId to coordinatorName
  const coordinatorNamesRef = useRef({})

  // Helper function to convert various timestamp formats to JavaScript Date
  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null

    // Handle Firestore Timestamp object with _seconds property (from backend API)
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000)
    }

    // Handle Firestore Timestamp object with toDate method (from direct Firestore)
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate()
    }

    // Handle regular Date object or ISO string
    if (timestamp instanceof Date) {
      return timestamp
    }

    if (typeof timestamp === "string") {
      return new Date(timestamp)
    }

    return null
  }

  // Helper function to format date for display
  const formatDateForDisplay = (timestamp, fallbackDate = null, fallbackTime = null) => {
    const date = convertTimestamp(timestamp)

    if (date && !isNaN(date.getTime())) {
      return date.toLocaleString("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    // Fallback to date/time strings if timestamp conversion fails
    if (fallbackDate && fallbackTime) {
      return `${fallbackDate} ${fallbackTime}`
    }

    return "תאריך לא זמין"
  }

  // Fetch calls once
  useEffect(() => {
    const fetchCalls = async () => {
      if (authLoading || !currentUser) {
        if (!authLoading && !currentUser) {
          showError("יש להתחבר כדי לצפות בלוח המחוונים.")
        }
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        let fetchedInquiries = []
        if (userRole === 1) {
          // Coordinator role - get inquiries assigned to this coordinator OR unassigned ones
          console.log('🔥 Dashboard: Loading inquiries for coordinator...');
          
          try {
            // Try backend API first
            const backendUrl = import.meta.env.VITE_API_BASE || 
                              (import.meta.env.PROD ? 'https://magen-dvorim-adom-backend.railway.app' : 'http://localhost:3001');
            
            const response = await fetch(`${backendUrl}/api/inquiries?coordinatorId=${currentUser.uid}`)
            if (!response.ok) {
              throw new Error('Backend API failed')
            }
            fetchedInquiries = await response.json()
            console.log('✅ Dashboard: Loaded', fetchedInquiries.length, 'inquiries from backend API');
          } catch (apiError) {
            console.warn('Backend API failed, falling back to direct Firestore:', apiError.message);
            
            // Fallback to direct Firestore query
            const inquiriesRef = collection(db, "inquiry")
            const allInquiriesQuery = inquiriesRef
            const inquirySnap = await getDocs(allInquiriesQuery)
            const allInquiries = inquirySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
            
            // Filter for coordinator's inquiries and unassigned ones
            fetchedInquiries = allInquiries.filter(inquiry => {
              return !inquiry.coordinatorId || 
                     inquiry.coordinatorId === '' || 
                     inquiry.coordinatorId === currentUser.uid;
            });
            console.log('✅ Dashboard: Loaded', fetchedInquiries.length, 'inquiries from Firestore fallback');
          }
        } else {
          const inquiriesRef = collection(db, "inquiry")
          const allInquiriesQuery = inquiriesRef
          const inquirySnap = await getDocs(allInquiriesQuery)
          fetchedInquiries = inquirySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        }

        console.log('📊 Dashboard: Sample inquiry data:');
        if (fetchedInquiries.length > 0) {
          console.log(fetchedInquiries[0]);
        }

        // Collect all unique volunteer UIDs and coordinator UIDs
        const volunteerUids = new Set()
        const coordinatorUids = new Set()

        fetchedInquiries.forEach((call) => {
          // Handle both array and string formats for assignedVolunteers
          if (call.assignedVolunteers) {
            if (Array.isArray(call.assignedVolunteers)) {
              call.assignedVolunteers.forEach(uid => {
                if (uid && uid.trim() !== "") {
                  volunteerUids.add(uid)
                }
              })
            } else if (typeof call.assignedVolunteers === "string" && call.assignedVolunteers.trim() !== "") {
              volunteerUids.add(call.assignedVolunteers)
            }
          }
          if (call.coordinatorId && typeof call.coordinatorId === "string" && call.coordinatorId.trim() !== "") {
            coordinatorUids.add(call.coordinatorId)
          }
        })

        // Fetch volunteer names
        const uidToVolunteerName = {}
        await Promise.all(
          Array.from(volunteerUids).map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "user", uid))
              if (snap.exists()) {
                const d = snap.data()
                uidToVolunteerName[uid] = d.name || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()
              }
            } catch (e) {
              console.error("Error fetching volunteer name:", uid, e) /* ignore */
            }
          }),
        )

        // Fetch coordinator names
        const uidToCoordinatorName = {}
        await Promise.all(
          Array.from(coordinatorUids).map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "user", uid))
              if (snap.exists()) {
                const d = snap.data()
                uidToCoordinatorName[uid] = d.name || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()
              }
            } catch (e) {
              console.error("Error fetching coordinator name:", uid, e) /* ignore */
            }
          }),
        )
        coordinatorNamesRef.current = uidToCoordinatorName // Store for later use if needed

        // Merge names and ensure coordinatorId is present (or null)
        const withNames = fetchedInquiries.map((c) => {
          // Get assigned volunteer name (handle both array and string formats)
          let assignedVolunteerName = "-"
          if (c.assignedVolunteers) {
            if (Array.isArray(c.assignedVolunteers) && c.assignedVolunteers.length > 0) {
              assignedVolunteerName = uidToVolunteerName[c.assignedVolunteers[0]] ?? "-"
            } else if (typeof c.assignedVolunteers === "string") {
              assignedVolunteerName = uidToVolunteerName[c.assignedVolunteers] ?? "-"
            }
          }

          return {
            ...c,
            assignedVolunteerName,
            coordinatorId: c.coordinatorId || null,
            coordinatorName:
              c.coordinatorId && uidToCoordinatorName[c.coordinatorId] ? uidToCoordinatorName[c.coordinatorId] : "-", // Add coordinatorName
          }
        })

        setCalls(withNames)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching calls:", err)
        showError("Failed to fetch calls.")
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchCalls()
    }
  }, [currentUser, userRole, authLoading])

  // Status change handler
  const handleStatusChange = async (callId, newStatus) => {
    try {
      // Define statuses that require a volunteer to be assigned
      const statusesRequiringVolunteer = [
        "לפנייה שובץ מתנדב",
        "המתנדב בדרך",
        "הטיפול בנחיל הסתיים"
      ]

      // Define statuses that are before volunteer assignment
      const statusesBeforeVolunteerAssignment = [
        "נשלח קישור אך לא מולא טופס",
        "נפתחה פנייה (טופס מולא)"
      ]

      // Find the current call to check if it has a volunteer assigned
      const currentCall = calls.find(c => c.id === callId)
      
      if (!currentCall) {
        showError("לא נמצאה הפנייה");
        return
      }
      
      const hasVolunteerAssigned = currentCall && currentCall.assignedVolunteers && 
        ((Array.isArray(currentCall.assignedVolunteers) && currentCall.assignedVolunteers.length > 0) ||
         (typeof currentCall.assignedVolunteers === "string" && currentCall.assignedVolunteers !== "-" && currentCall.assignedVolunteers !== null && currentCall.assignedVolunteers !== ""))

      // Check if trying to set a status that requires a volunteer when none is assigned
      if (statusesRequiringVolunteer.includes(newStatus) && !hasVolunteerAssigned) {
        showError(`לא ניתן לשנות את הסטטוס ל"${newStatus}" ללא שיבוץ מתנדב. יש לשבץ מתנדב תחילה.`)
        return
      }

      // Check if the new status is before volunteer assignment
      const shouldRemoveVolunteer = statusesBeforeVolunteerAssignment.includes(newStatus)

      // If changing to early status and volunteer is assigned, show confirmation
      if (shouldRemoveVolunteer && hasVolunteerAssigned) {
        const confirmed = await showConfirmDialog({
          title: "שינוי סטטוס יסיר מתנדב",
          message: `שינוי הסטטוס ל"${newStatus}" יסיר את המתנדב המשובץ מהפנייה. האם אתה בטוח שברצונך להמשיך?`,
          confirmText: "כן, שנה סטטוס",
          cancelText: "ביטול",
          severity: "warning",
        })

        if (!confirmed) return
      }

      // Prepare the update object
      const updateData = { status: newStatus }
      
      // If status is set back to before volunteer assignment, remove volunteer
      if (shouldRemoveVolunteer) {
        updateData.assignedVolunteers = null
      }

      await updateDoc(doc(db, "inquiry", callId), updateData)
      
      setCalls((prev) => prev.map((c) => {
        if (c.id === callId) {
          const updatedCall = { ...c, status: newStatus }
          if (shouldRemoveVolunteer) {
            updatedCall.assignedVolunteers = null
            updatedCall.assignedVolunteerName = "-"
          }
          return updatedCall
        }
        return c
      }))
      
      if (shouldRemoveVolunteer && hasVolunteerAssigned) {
        showSuccess("סטטוס עודכן בהצלחה! המתנדב הוסר מהפנייה.")
      } else {
        showSuccess("סטטוס עודכן בהצלחה!")
      }
    } catch (err) {
      console.error(err)
      showError("נכשל בעדכון סטטוס.")
    }
  }

  // Closure change handler
  const handleClosureChange = async (callId, newClosureReason) => {
    try {
      // Find the current call to check ownership
      const currentCall = calls.find(c => c.id === callId)
      
      // Check if the coordinator has ownership of this inquiry
      if (!currentCall || currentCall.coordinatorId !== currentUser?.uid) {
        showError("לא ניתן לשנות את סיבת הסגירה ללא בעלות על הפנייה. יש לקחת בעלות על הפנייה תחילה.")
        return
      }

      await updateDoc(doc(db, "inquiry", callId), { closureReason: newClosureReason })
      setCalls((prev) => prev.map((c) => (c.id === callId ? { ...c, closureReason: newClosureReason } : c)))
      showSuccess("סיבת סגירה עודכנה בהצלחה!")
    } catch (err) {
      console.error(err)
      showError("נכשל בעדכון סיבת סגירה.")
    }
  }

  // Handle taking ownership of an unassigned report
  const handleTakeOwnership = async (inquiryId) => {
    if (!currentUser) {
      showError("שגיאה: משתמש לא מחובר")
      return
    }

    try {
      await takeOwnership(inquiryId, currentUser.uid)

      // Update the local state to reflect the ownership change
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === inquiryId
            ? {
                ...call,
                coordinatorId: currentUser.uid,
                coordinatorName: currentUser.displayName || currentUser.email || "רכז",
              }
            : call,
        ),
      )

      showSuccess("בעלות נלקחה בהצלחה!")
    } catch (error) {
      console.error("Error taking ownership:", error)
      if (error.response?.status === 409) {
        showWarning("הפנייה כבר שויכה לרכז אחר")
      } else {
        showError("שגיאה בלקיחת בעלות על הפנייה")
      }
    }
  }

  // Handle releasing ownership of an assigned report
  const handleReleaseOwnership = async (inquiryId) => {
    if (!currentUser) {
      showError("שגיאה: משתמש לא מחובר")
      return
    }

    const confirmed = await showConfirmDialog({
      title: "שחרור בעלות על הפנייה",
      message: "האם אתה בטוח שברצונך לשחרר את הבעלות על הפנייה? הפנייה תחזור למאגר הפניות הזמינות לכל הרכזים.",
      confirmText: "שחרר בעלות",
      cancelText: "ביטול",
      severity: "warning",
    })

    if (!confirmed) return

    try {
      await releaseOwnership(inquiryId, currentUser.uid)

      // Update the local state to reflect the ownership release
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === inquiryId
            ? {
                ...call,
                coordinatorId: null,
                coordinatorName: "-",
              }
            : call,
        ),
      )

      showSuccess("בעלות שוחררה בהצלחה! הפנייה חזרה למאגר הזמין.")
    } catch (error) {
      console.error("Error releasing ownership:", error)
      if (error.response?.status === 403) {
        showError("ניתן לשחרר רק פניות שבבעלותך")
      } else if (error.response?.status === 400) {
        showWarning("הפנייה אינה משויכת לאף רכז")
      } else {
        showError("שגיאה בשחרור בעלות על הפנייה")
      }
    }
  }

  // Fetch volunteers for reassignment
  const fetchVolunteers = async () => {
    if (volunteers.length > 0) return // Already loaded

    setLoadingVolunteers(true)
    try {
      const volunteerList = await userService.getVolunteers()
      setVolunteers(volunteerList)
    } catch (error) {
      console.error("Error fetching volunteers:", error)
      showError("שגיאה בטעינת רשימת המתנדבים")
    } finally {
      setLoadingVolunteers(false)
    }
  }

  // Handle volunteer reassignment
  const handleReassignVolunteer = async (inquiryId, newVolunteerId) => {
    if (!newVolunteerId) return

    // Find the current call to check ownership
    const currentCall = calls.find(c => c.id === inquiryId)
    
    if (!currentCall) {
      showError("לא נמצאה הפנייה");
      return
    }

    // Check if the coordinator has ownership of this inquiry - only if another coordinator owns it
    if (currentCall.coordinatorId && currentCall.coordinatorId !== currentUser?.uid) {
      showError("לא ניתן לשנות שיבוץ מתנדב - הפנייה כבר שייכת לרכז אחר.")
      return
    }

    // If no coordinator is assigned, take ownership automatically
    if (!currentCall.coordinatorId) {
      console.log('🔄 Taking automatic ownership for volunteer reassignment...');
      try {
        await takeOwnership(inquiryId, currentUser.uid);
      } catch (error) {
        console.error('Failed to take ownership:', error);
        showError("שגיאה בלקיחת בעלות על הפנייה.");
        return;
      }
    }

    try {
      await reassignVolunteer(inquiryId, newVolunteerId)

      // Find the new volunteer's name
      const newVolunteer = volunteers.find((v) => v.id === newVolunteerId)
      const newVolunteerName = newVolunteer
        ? newVolunteer.name || `${newVolunteer.firstName} ${newVolunteer.lastName}`
        : "מתנדב"

      // Update the local state
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === inquiryId
            ? {
                ...call,
                assignedVolunteers: [newVolunteerId],
                assignedVolunteerName: newVolunteerName,
                status: "לפנייה שובץ מתנדב",
                coordinatorId: currentUser.uid, // Ensure ownership is maintained
              }
            : call,
        ),
      )

      showSuccess("המתנדב הוחלף בהצלחה!")
    } catch (error) {
      console.error("Error reassigning volunteer:", error)
      showError("שגיאה בהחלפת המתנדב")
    }
  }

  return {
    calls,
    setCalls,
    loading,
    error,
    volunteers,
    loadingVolunteers,
    convertTimestamp,
    formatDateForDisplay,
    handleStatusChange,
    handleClosureChange,
    handleTakeOwnership,
    handleReleaseOwnership,
    fetchVolunteers,
    handleReassignVolunteer,
    coordinatorNamesRef
  }
}
