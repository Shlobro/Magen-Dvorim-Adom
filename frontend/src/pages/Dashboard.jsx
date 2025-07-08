"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/HomeScreen.css"
import { fetchCoordinatorInquiries, takeOwnership, releaseOwnership, reassignVolunteer } from "../services/inquiryApi"
import { userService } from "../services/firebaseService"
import { useNotification } from "../contexts/NotificationContext"

export default function Dashboard() {
  // Debug log to confirm new version is loaded
  console.log('📊 Dashboard loaded - Fixed volunteer filter & removed free search v1.0.1 (Jan 6, 2025)');
  
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { currentUser, userRole, loading: authLoading } = useAuth()
  const { showSuccess, showError, showWarning, showInfo, showConfirmDialog } = useNotification()

  // State for coordinator report link
  const [reportLink, setReportLink] = useState("")

  // Ref to hold a map of coordinatorId to coordinatorName
  const coordinatorNamesRef = useRef({})
  // New state for managing the modal/popup for comments:
  const [selectedComment, setSelectedComment] = useState(null)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  // Add after the existing comment modal states
  const [selectedCallDetails, setSelectedCallDetails] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

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

  // ───────────────────────────── Filter States
  const [filterVolunteer, setFilterVolunteer] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("נפתחה פנייה (טופס מולא)")
  // Removed searchTerm - no longer needed

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // New state for mobile filter visibility
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // State for volunteers list (for reassignment)
  const [volunteers, setVolunteers] = useState([])
  const [loadingVolunteers, setLoadingVolunteers] = useState(false)

  // ───────────────────────────── Sorting States
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  // Sorting function
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Get sorted data
  const getSortedCalls = (callsToSort) => {
    if (!sortColumn) return callsToSort

    return [...callsToSort].sort((a, b) => {
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]

      // Handle special cases for different column types
      switch (sortColumn) {
        case 'fullName':
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
          break
        case 'address':
          aValue = `${a.city || ''} ${a.address || ''}`.trim().toLowerCase()
          bValue = `${b.city || ''} ${b.address || ''}`.trim().toLowerCase()
          break
        case 'timestamp':
          aValue = convertTimestamp(a.timestamp) || new Date(0)
          bValue = convertTimestamp(b.timestamp) || new Date(0)
          break
        case 'status':
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
          break
        case 'assignedVolunteerName':
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
          break
        case 'coordinatorName':
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
          break
        case 'closureReason':
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
          break
        default:
          aValue = (aValue || '').toString().toLowerCase()
          bValue = (bValue || '').toString().toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const statusOptions = [
    "נשלח קישור אך לא מולא טופס",
    "נפתחה פנייה (טופס מולא)",
    "לפנייה שובץ מתנדב",
    "המתנדב בדרך",
    "הטיפול בנחיל הסתיים",
    "הפנייה נסגרה",
  ]

  const closureOptions = ["נפתר עצמאית", "לא ניתן לטפל", "מיקום לא נגיש", "מתנדב לא הגיע", "אחר"]

  // Effect to determine if it's a mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768) // Adjust breakpoint as needed
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Set initial value

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ───────────────────────────────── fetch calls once
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
          // Coordinator role - get ALL inquiries, not just assigned ones
          console.log('🔥 Dashboard: Loading all inquiries for coordinator...');
          const inquiriesRef = collection(db, "inquiry")
          const allInquiriesQuery = inquiriesRef
          const inquirySnap = await getDocs(allInquiriesQuery)
          fetchedInquiries = inquirySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          console.log('✅ Dashboard: Loaded', fetchedInquiries.length, 'inquiries');
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
          if (
            call.assignedVolunteers &&
            typeof call.assignedVolunteers === "string" &&
            call.assignedVolunteers.trim() !== ""
          ) {
            volunteerUids.add(call.assignedVolunteers)
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
        const withNames = fetchedInquiries.map((c) => ({
          ...c,
          assignedVolunteerName: uidToVolunteerName[c.assignedVolunteers] ?? "-",
          coordinatorId: c.coordinatorId || null,
          coordinatorName:
            c.coordinatorId && uidToCoordinatorName[c.coordinatorId] ? uidToCoordinatorName[c.coordinatorId] : "-", // Add coordinatorName
        }))

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

  // Generate report link when currentUser is available
  useEffect(() => {
    if (currentUser && userRole === 1) {
      // Only generate for coordinators
      const baseUrl = window.location.origin
      setReportLink(`${baseUrl}/report?coordinatorId=${currentUser.uid}`)
    } else {
      setReportLink("") // Clear link if not a coordinator
    }
  }, [currentUser, userRole])

  const copyReportLink = () => {
    if (reportLink) {
      const tempInput = document.createElement("input")
      tempInput.value = reportLink
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand("copy")
      document.body.removeChild(tempInput)
      showSuccess("הקישור לדיווח הועתק בהצלחה!")
    }
  }

  // Add functions to handle opening and closing the comment modal:
  const handleOpenComment = (comment) => {
    setSelectedComment(comment)
    setIsCommentModalOpen(true)
  }

  const handleCloseComment = () => {
    setSelectedComment(null)
    setIsCommentModalOpen(false)
  }

  // Add after the handleCloseComment function
  const handleOpenDetails = (call) => {
    setSelectedCallDetails(call)
    setIsDetailsModalOpen(true)
  }
  const handleCloseDetails = () => {
    setSelectedCallDetails(null)
    setIsDetailsModalOpen(false)
  }
  // Photo modal handlers
  const handleOpenPhoto = (photoUrl) => {
    window.open(photoUrl, '_blank')
  }

  const handleDownloadPhoto = async (photoUrl, inquiryId) => {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary anchor element for download
      const a = document.createElement('a')
      a.href = url
      a.download = `תמונת_דיווח_${inquiryId}_${new Date().toISOString().split('T')[0]}.jpg`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('שגיאה בהורדת התמונה')
    }
  }

  // ───────────────────────────── Derived State: Unique Volunteer Names
  const uniqueVolunteerNames = useMemo(() => {
    console.log('🎯 Building unique volunteer names...');
    const names = new Set()
    calls.forEach((call) => {
      if (call.assignedVolunteerName && call.assignedVolunteerName !== "-") {
        names.add(call.assignedVolunteerName)
        console.log('  - Found volunteer name:', call.assignedVolunteerName);
      }
    })
    // Don't add "ללא מתנדב" option - removed as requested
    const result = Array.from(names).sort()
    console.log('🎯 Final unique volunteer names:', result);
    return result
  }, [calls])

  // ───────────────────────────── Filtered Calls Logic with Pagination
  const filteredCalls = useMemo(() => {
    console.log('🔍 Dashboard Filter Debug:');
    console.log('  - Total calls:', calls.length);
    console.log('  - filterVolunteer:', filterVolunteer);
    console.log('  - filterStatus:', filterStatus);
    
    const filtered = calls.filter((call) => {
      let match = true

      // Volunteer filter
      if (filterVolunteer && filterVolunteer !== "") {
        console.log(`  - Checking volunteer filter for call ${call.id}:`);
        console.log(`    - Call assignedVolunteerName: "${call.assignedVolunteerName}"`);
        console.log(`    - Filter value: "${filterVolunteer}"`);
        
        // Show calls assigned to specific volunteer
        if (call.assignedVolunteerName !== filterVolunteer) {
          console.log(`    - FILTERED OUT: Different volunteer`);
          match = false
        } else {
          console.log(`    - MATCH: Same volunteer`);
        }
      }

      if (filterStatus && call.status !== filterStatus) {
        console.log(`  - FILTERED OUT by status: "${call.status}" != "${filterStatus}"`);
        match = false
      }
      
      if ((filterStartDate || filterEndDate) && match) {
        const callDate = convertTimestamp(call.timestamp)
        let fallbackDate = null
        if (!callDate && call.date && call.time) {
          try {
            const [day, month, year] = call.date.split(".").map(Number)
            const [hours, minutes] = call.time.split(":").map(Number)
            fallbackDate = new Date(year, month - 1, day, hours, minutes)
          } catch (e) {
            console.warn("Could not parse date/time strings for filtering:", call.date, call.time, e)
          }
        }
        const effectiveCallDate = callDate || fallbackDate
        if (!effectiveCallDate) return false

        const start = filterStartDate ? new Date(filterStartDate) : null
        if (start) start.setHours(0, 0, 0, 0)

        const end = filterEndDate ? new Date(filterEndDate) : null
        if (end) end.setHours(23, 59, 59, 999)

        if (start && effectiveCallDate < start) match = false
        if (end && effectiveCallDate > end) match = false
      }

      return match
    })
    
    console.log('🔍 Filter results:');
    console.log('  - Filtered calls count:', filtered.length);
    if (filtered.length > 0) {
      console.log('  - Sample filtered call:', {
        id: filtered[0].id,
        fullName: filtered[0].fullName,
        assignedVolunteerName: filtered[0].assignedVolunteerName,
        status: filtered[0].status
      });
    }

    // Apply sorting to filtered results
    return getSortedCalls(filtered)
  }, [calls, filterVolunteer, filterStartDate, filterEndDate, filterStatus, sortColumn, sortDirection])

  // Paginated data
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCalls.slice(startIndex, endIndex)
  }, [filteredCalls, currentPage, itemsPerPage])

  // Total pages calculation
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterVolunteer, filterStartDate, filterEndDate, filterStatus])
  const handleVolunteerFilterChange = (e) => {
    setFilterVolunteer(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value)
    setCurrentPage(1)
  }

  const handleStartDateFilterChange = (e) => {
    setFilterStartDate(e.target.value)
    // If a start date is selected, clear end date if it's before start date
    if (e.target.value && filterEndDate && new Date(e.target.value) > new Date(filterEndDate)) {
      setFilterEndDate("")
    }
    setCurrentPage(1)
  }

  const handleEndDateFilterChange = (e) => {
    setFilterEndDate(e.target.value)
    setCurrentPage(1)
  }

  // Clear all filters function
  const handleClearAllFilters = () => {
    setFilterVolunteer("")
    setFilterStatus("נפתחה פנייה (טופס מולא)") // Reset to default
    setFilterStartDate("")
    setFilterEndDate("")
    setCurrentPage(1)
  }  // ───────────────────────────── status / closure handlers
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
      
      const hasVolunteerAssigned = currentCall && currentCall.assignedVolunteers && currentCall.assignedVolunteers !== "-" && currentCall.assignedVolunteers !== null

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

  const handleAssignVolunteerClick = (inquiryId) => {
    // Find the current call to check ownership
    const currentCall = calls.find(c => c.id === inquiryId)
    
    // Check if the coordinator has ownership of this inquiry
    if (!currentCall || currentCall.coordinatorId !== currentUser?.uid) {
      showError("לא ניתן לשבץ מתנדב ללא בעלות על הפנייה. יש לקחת בעלות על הפנייה תחילה.")
      return
    }
    
    navigate(`/volunteer-map?inquiryId=${inquiryId}`)
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
                assignedVolunteers: newVolunteerId,
                assignedVolunteerName: newVolunteerName,
                status: "לפנייה שובץ מתנדב",
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

  // ───────────────────────────── Generate feedback link handler
  const handleGenerateFeedbackLink = async (inquiryId) => {
    const baseUrl = window.location.origin
    const feedbackLink = `${baseUrl}/feedback?inquiryId=${inquiryId}`

    const confirmed = await showConfirmDialog({
      title: "פתיחת קישור משוב",
      message: `הקישור למשוב יפתח בחלון חדש. ניתן להעתיק ולשלוח לפונה.\n\n${feedbackLink}`,
      confirmText: "פתח קישור",
      cancelText: "ביטול",
      severity: "info",
    })

    if (confirmed) {
      window.open(feedbackLink, "_blank")
      showInfo("הקישור למשוב נפתח בחלון חדש")
    }
  }

  // ───────────────────────────── Helper for CSV export
  const exportToCsv = (data, filename) => {
    if (data.length === 0) {
      showWarning("אין נתונים להפקת דוח בקריטריונים הנוכחיים.")
      return
    }
    const headers = [
      "מס' פניה",
      "שם מלא פונה",
      "טלפון פונה",
      "עיר",
      "כתובת",
      "הערות",
      "תאריך דיווח",
      "סטטוס",
      "סיבת סגירה",
      "שם מתנדב משובץ",
      "שם רכז",
    ]
    const rows = data.map((call, index) => {
      // Use the helper function to handle timestamps consistently
      const dateString = formatDateForDisplay(call.timestamp, call.date, call.time)

      return [
        index + 1, // Sequential number instead of hash ID
        call.fullName,
        call.phoneNumber,
        call.city || "",
        call.address,
        call.additionalDetails,
        dateString,
        call.status,
        call.closureReason || "",
        call.assignedVolunteerName || "-",
        call.coordinatorName || "",
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    })

    const csvContent = headers.map((h) => `"${h}"`).join(",") + "\n" + rows.join("\n")

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess("דוח הופק בהצלחה!")
    }
  }

  // ───────────────────────────── Export Feedback Report
  const handleExportFeedback = async () => {
    try {
      setLoading(true)
      const feedbackSnap = await getDocs(collection(db, "feedback"))
      const feedbackData = feedbackSnap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          inquiryId: data.inquiryId || "",
          fullName: data.fullName || "",
          phoneNumber: data.phoneNumber || "",
          volunteerName: data.volunteerName || "",
          rating: data.rating || 0,
          comments: data.comments || "",
          timestamp: formatDateForDisplay(data.timestamp),
        }
      })

      if (feedbackData.length === 0) {
        showWarning("אין נתוני משוב להפקת דוח.")
        setLoading(false)
        return
      }
      const headers = ["מס' קריאה", "שם מלא", "מספר טלפון", "שם מתנדב", "דירוג", "הערות", "תאריך ושעת משוב"]

      const rows = feedbackData.map((row, index) =>
        [index + 1, row.fullName, row.phoneNumber, row.volunteerName, row.rating, row.comments, row.timestamp]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(","),
      )

      const csvContent = headers.map((h) => `"${h}"`).join(",") + "\n" + rows.join("\n")

      const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `feedback_report_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showSuccess("דוח משובים הופק בהצלחה!")
      }
    } catch (err) {
      console.error("Error exporting feedback:", err)
      showError("שגיאה בהפקת דוח משובים.")
    } finally {
      setLoading(false)
    }
  }

  // ───────────────────────────── Specific Export functions for filtered data
  const handleExportVolunteerReport = () => {
    let dataToExport = calls
    let reportName = "כל_המתנדבים"

    if (filterVolunteer) {
      dataToExport = calls.filter((call) => call.assignedVolunteerName === filterVolunteer)
      reportName = filterVolunteer.replace(/ /g, "_")
    }

    const filename = `volunteer_report_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(dataToExport, filename)
  }

  const handleExportStatusReport = () => {
    let dataToExport = calls
    let reportName = "כל_הסטטוסים"

    if (filterStatus) {
      dataToExport = calls.filter((call) => call.status === filterStatus)
      reportName = filterStatus.replace(/ /g, "_")
    }

    const filename = `status_report_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(dataToExport, filename)
  }

  const handleExportDateRangeReport = () => {
    let dataToExport = calls
    let reportName = "כל_התאריכים"

    const currentYear = new Date().getFullYear()
    const defaultStartDate = new Date(currentYear, 0, 1)
    const defaultEndDate = new Date(currentYear, 11, 31)

    const actualStartDate = filterStartDate ? new Date(filterStartDate) : defaultStartDate
    const actualEndDate = filterEndDate ? new Date(filterEndDate) : defaultEndDate

    actualStartDate.setHours(0, 0, 0, 0)
    actualEndDate.setHours(23, 59, 59, 999)
    if (filterStartDate || filterEndDate) {
      dataToExport = calls.filter((call) => {
        // Use the helper function to handle timestamps consistently
        const callDate = convertTimestamp(call.timestamp)

        let fallbackDate = null
        if (!callDate && call.date && call.time) {
          try {
            const [day, month, year] = call.date.split(".").map(Number)
            const [hours, minutes] = call.time.split(":").map(Number)
            fallbackDate = new Date(year, month - 1, day, hours, minutes)
          } catch (e) {
            console.warn("Could not parse date/time strings for filtering in export:", call.date, call.time, e)
          }
        }
        const effectiveCallDate = callDate || fallbackDate
        if (!effectiveCallDate) return false

        return effectiveCallDate >= actualStartDate && effectiveCallDate <= actualEndDate
      })
      reportName = `${filterStartDate || "תחילה"}_${filterEndDate || "סוף"}`
    } else {
      dataToExport = calls.filter((call) => {
        // Handle timestamp properly - could be Firestore Timestamp, ISO string, or undefined
        let callDate = null
        if (call.timestamp) {
          if (typeof call.timestamp?.toDate === "function") {
            // Firestore Timestamp object
            callDate = call.timestamp.toDate()
          } else if (typeof call.timestamp === "string" || call.timestamp instanceof Date) {
            // ISO string or Date object
            callDate = new Date(call.timestamp)
          }
        }

        let fallbackDate = null
        if (!callDate && call.date && call.time) {
          try {
            const [day, month, year] = call.date.split(".").map(Number)
            const [hours, minutes] = call.time.split(":").map(Number)
            fallbackDate = new Date(year, month - 1, day, hours, minutes)
          } catch (e) {
            console.warn(
              "Could not parse date/time strings for filtering in export (default):",
              call.date,
              call.time,
              e,
            )
          }
        }
        const effectiveCallDate = callDate || fallbackDate
        if (!effectiveCallDate) return false

        return effectiveCallDate >= defaultStartDate && effectiveCallDate <= defaultEndDate
      })
    }

    const filename = `date_range_report_${reportName.replace(/ /g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(dataToExport, filename)
  }

  // ───────────────────────────── General Report Export (exports entire table)
  const handleExportGeneralReport = () => {
    // Export all calls without any filtering
    const filename = `general_report_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(calls, filename)
  }

  // ───────────────────────────── ui
  if (authLoading || loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          fontSize: "1.1em",
          color: "#666",
        }}
      >
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#f8f9fa",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          טוען נתונים...
        </div>
      </div>
    )

  if (error)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#fff5f5",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            border: "1px solid #fed7d7",
            color: "#e53e3e",
          }}
        >
          שגיאה: {error}
        </div>
      </div>
    )

  if (!currentUser)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#fff5f5",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            border: "1px solid #fed7d7",
            color: "#e53e3e",
          }}
        >
          אנא התחבר כדי לגשת ללוח המחוונים.
        </div>
      </div>
    )

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "40px 30px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: "0 0 10px 0",
                fontSize: "2.5em",
                fontWeight: "700",
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              ניהול קריאות נחילים
            </h1>
            <div
              style={{
                fontSize: "1.1em",
                opacity: "0.9",
                fontWeight: "400",
              }}
            >
              מערכת ניהול פניות ומעקב אחר מתנדבים
            </div>
          </div>
          <div style={{ padding: "30px" }}>
            {/* Coordinator Report Link Section */}
            {userRole === 1 && (
              <div
                style={{
                  marginBottom: "40px",
                  textAlign: "center",
                  padding: "25px",
                  background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                  borderRadius: "12px",
                  border: "1px solid #e1f5fe",
                }}
              >
                <div
                  style={{
                    marginBottom: "20px",
                    fontSize: "1.1em",
                    color: "#1565c0",
                    fontWeight: "600",
                  }}
                >
                  קישורים לניהול המערכת
                </div>
                <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={copyReportLink}
                    style={{
                      background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                      color: "white",
                      padding: "15px 30px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1.1em",
                      fontWeight: "600",
                      boxShadow: "0 4px 15px rgba(0,123,255,0.3)",
                      transition: "all 0.3s ease",
                      transform: "translateY(0)",
                    }}
                    className="no-select"
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)"
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,123,255,0.4)"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,123,255,0.3)"
                    }}
                  >
                    📋 העתק קישור לדיווח
                  </button>
                </div>
              </div>
            )}

            {/* Filters Section */}
            <div
              style={{
                marginBottom: "30px",
                padding: "30px",
                background: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
              }}
            >
              <h3
                style={{
                  margin: "0 0 25px 0",
                  color: "#495057",
                  fontSize: "1.3em",
                  fontWeight: "600",
                  textAlign: "right",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                className="no-select"
              >
                🔍 סינון נתונים
                {isMobileView && (
                  <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.5em",
                      cursor: "pointer",
                      color: "#495057",
                      transition: "transform 0.3s ease",
                      transform: isMobileFilterOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    className="no-select"
                  >
                    {isMobileFilterOpen ? "▲" : "▼"}
                  </button>
                )}
              </h3>
              {(isMobileFilterOpen || !isMobileView) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    direction: "rtl",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#495057",
                        fontSize: "0.95em",
                      }}
                      className="no-select"
                    >
                      פילטר מתנדב:
                    </label>
                    <select
                      value={filterVolunteer}
                      onChange={handleVolunteerFilterChange}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        fontSize: "1em",
                        background: "white",
                        transition: "border-color 0.3s ease",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e9ecef")}
                    >
                      <option value="">כל המתנדבים</option>
                      {uniqueVolunteerNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#495057",
                        fontSize: "0.95em",
                      }}
                      className="no-select"
                    >
                      פילטר סטטוס:
                    </label>
                    <select
                      value={filterStatus}
                      onChange={handleStatusFilterChange}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        fontSize: "1em",
                        background: "white",
                        transition: "border-color 0.3s ease",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e9ecef")}
                    >
                      <option value="">כל הסטטוסים</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#495057",
                        fontSize: "0.95em",
                      }}
                      className="no-select"
                    >
                      מתאריך:
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={handleStartDateFilterChange}
                      style={{
                        width: "85%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        fontSize: "1em",
                        background: "white",
                        transition: "border-color 0.3s ease",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e9ecef")}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#495057",
                        fontSize: "0.95em",
                      }}
                      className="no-select"
                    >
                      עד תאריך:
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={handleEndDateFilterChange}
                      style={{
                        width: "85%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        fontSize: "1em",
                        background: "white",
                        transition: "border-color 0.3s ease",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e9ecef")}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "end" }}>
                    <button
                      onClick={handleClearAllFilters}
                      style={{
                        background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                        color: "white",
                        padding: "12px 20px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.95em",
                        fontWeight: "600",
                        boxShadow: "0 3px 10px rgba(108,117,125,0.2)",
                        transition: "all 0.3s ease",
                        whiteSpace: "nowrap",
                      }}
                      className="no-select"
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = "0 5px 15px rgba(108,117,125,0.3)"
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = "0 3px 10px rgba(108,117,125,0.2)"
                      }}
                    >
                      🗑️ נקה פילטרים
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export Buttons Section */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "15px",
                marginBottom: "40px",
                justifyContent: "center",
                padding: "25px",
                background: "#e8f5e9",
                borderRadius: "12px",
                border: "1px solid #c8e6c9",
              }}
            >
              <h3
                style={{
                  width: "100%",
                  margin: "0 0 20px 0",
                  color: "#2e7d32",
                  fontSize: "1.2em",
                  fontWeight: "600",
                  textAlign: "center",
                }}
                className="no-select"
              >
                📊 הפקת דוחות
              </h3>

              <button
                onClick={handleExportFeedback}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                  color: "white",
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1em",
                  fontWeight: "600",
                  boxShadow: "0 3px 10px rgba(0,123,255,0.2)",
                  transition: "all 0.3s ease",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                className="no-select"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,123,255,0.3)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,123,255,0.2)"
                }}
              >
                דוח משובים
              </button>

              <button
                onClick={handleExportVolunteerReport}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
                  color: "white",
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1em",
                  fontWeight: "600",
                  boxShadow: "0 3px 10px rgba(76,175,80,0.2)",
                  transition: "all 0.3s ease",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                className="no-select"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(76,175,80,0.3)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(76,175,80,0.2)"
                }}
              >
                דוח מתנדב
              </button>

              <button
                onClick={handleExportStatusReport}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #FFC107 0%, #FFA000 100%)",
                  color: "#333",
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1em",
                  fontWeight: "600",
                  boxShadow: "0 3px 10px rgba(255,193,7,0.2)",
                  transition: "all 0.3s ease",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                className="no-select"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(255,193,7,0.3)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(255,193,7,0.2)"
                }}
              >
                דוח סטטוס
              </button>

              <button
                onClick={handleExportDateRangeReport}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                  color: "white",
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1em",
                  fontWeight: "600",
                  boxShadow: "0 3px 10px rgba(108,117,125,0.2)",
                  transition: "all 0.3s ease",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                className="no-select"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(108,117,125,0.3)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(108,117,125,0.2)"
                }}
              >
                דוח תאריכים
              </button>

              <button
                onClick={handleExportGeneralReport}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)",
                  color: "white",
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1em",
                  fontWeight: "600",
                  boxShadow: "0 3px 10px rgba(156,39,176,0.2)",
                  transition: "all 0.3s ease",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                className="no-select"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(156,39,176,0.3)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(156,39,176,0.2)"
                }}
              >
                דוח פניות כללי
              </button>
            </div>

            {/* Table Section */}
            <div style={{ overflowX: "auto", marginBottom: "30px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  direction: "rtl",
                }}
              >
                <thead>
                  <tr style={{ background: "#f0f4f7" }}>
                    {[
                      { label: "שם מלא", key: "fullName" },
                      { label: "כתובת מלאה", key: "address" },
                      { label: "פרטים מלאים", key: null },
                      { label: "תאריך דיווח", key: "timestamp" },
                      { label: "סטטוס", key: "status" },
                      { label: "סיבת סגירה", key: "closureReason" },
                      { label: "מתנדב משובץ", key: "assignedVolunteerName" },
                      { label: "רכז מטפל", key: "coordinatorName" },
                      { label: "פעולות", key: null },
                    ].map((column) => (
                      <th
                        key={column.label}
                        style={{
                          padding: "15px 25px",
                          textAlign: "right",
                          borderBottom: "2px solid #dae1e8",
                          fontWeight: "700",
                          color: "#34495e",
                          backgroundColor: "#eef4f9",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          cursor: column.key ? "pointer" : "default",
                          transition: "background-color 0.2s ease",
                        }}
                        className={column.key ? "sortable no-select" : "no-select"}
                        onClick={() => column.key && handleSort(column.key)}
                        onMouseOver={(e) => {
                          if (column.key) {
                            e.currentTarget.style.backgroundColor = "#ddeaf4"
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#eef4f9"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{column.label}</span>
                          {column.key && (
                            <span style={{ 
                              marginLeft: "8px", 
                              fontSize: "12px",
                              opacity: sortColumn === column.key ? 1 : 0.3,
                              transition: "opacity 0.2s ease"
                            }}>
                              {sortColumn === column.key ? 
                                (sortDirection === 'asc' ? '▲' : '▼') : 
                                '⇅'
                              }
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedCalls.map((call, index) => {
                    const isUnassigned = !call.coordinatorId
                    const rowBg = isUnassigned ? "#fffaf0" : index % 2 === 0 ? "#ffffff" : "#f9fcfd"

                    return (
                      <tr
                        key={call.id}
                        style={{
                          borderBottom: "1px solid #eceff1",
                          backgroundColor: rowBg,
                          transition: "background-color 0.3s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = isUnassigned ? "#ffe0b2" : "#e3f2fd")
                        }
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                      >
                        <td style={{ padding: "15px 25px", whiteSpace: "nowrap" }}>{call.fullName}</td>
                        <td style={{ padding: "15px 25px" }}>
                          {`${call.city || ""} ${call.address || ""}`.trim() || "-"}
                        </td>
                        <td style={{ padding: "15px 25px", textAlign: "center" }}>
                          <button
                            onClick={() => handleOpenDetails(call)}
                            style={{
                              background: "linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)",
                              color: "white",
                              padding: "8px 12px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.9em",
                              fontWeight: "600",
                              boxShadow: "0 2px 8px rgba(111,66,193,0.2)",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              margin: "0 auto",
                            }}
                            className="no-select"
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = "translateY(-1px)"
                              e.currentTarget.style.boxShadow = "0 3px 10px rgba(111,66,193,0.3)"
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)"
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(111,66,193,0.2)"
                            }}
                            title="לחץ לצפייה בפרטים המלאים"
                          >
                            📋 פרטים
                          </button>
                        </td>
                        <td style={{ padding: "15px 25px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <div style={{ fontSize: "0.9em", fontWeight: "600" }}>
                              {formatDateForDisplay(call.timestamp, call.date, call.time).split(" ")[0]}
                            </div>
                            <div style={{ fontSize: "0.8em", color: "#666" }}>
                              {formatDateForDisplay(call.timestamp, call.date, call.time).split(" ")[1]}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "15px 25px" }}>
                          <select
                            value={call.status || ""}
                            onChange={(e) => handleStatusChange(call.id, e.target.value)}
                            disabled={false}
                            style={{
                              padding: "10px 15px",
                              borderRadius: "6px",
                              border: "1px solid #b0bec5",
                              minWidth: "180px",
                              backgroundColor: "white",
                              fontSize: "0.95em",
                              cursor: "pointer",
                              opacity: 1,
                            }}
                            title="שינוי סטטוס פנייה"
                          >
                            {statusOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "15px 25px" }}>
                          {call.status === "הפנייה נסגרה" && (
                            <select
                              value={call.closureReason || ""}
                              onChange={(e) => handleClosureChange(call.id, e.target.value)}
                              disabled={call.coordinatorId !== currentUser?.uid}
                              style={{
                                padding: "10px 15px",
                                borderRadius: "6px",
                                border: "1px solid #b0bec5",
                                minWidth: "180px",
                                backgroundColor: call.coordinatorId !== currentUser?.uid ? "#f5f5f5" : "white",
                                fontSize: "0.95em",
                                cursor: call.coordinatorId !== currentUser?.uid ? "not-allowed" : "pointer",
                                opacity: call.coordinatorId !== currentUser?.uid ? 0.6 : 1,
                              }}
                              title={call.coordinatorId !== currentUser?.uid ? "יש לקחת בעלות על הפנייה כדי לשנות את סיבת הסגירה" : ""}
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
                        <td style={{ padding: "15px 25px", whiteSpace: "nowrap" }}>
                          {call.assignedVolunteers && call.assignedVolunteers !== "-" ? (
                            <div style={{ minWidth: "180px" }}>
                              <div style={{ fontSize: "0.9em", marginBottom: "5px", color: "#666" }}>
                                נוכחי: {call.assignedVolunteerName}
                              </div>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleReassignVolunteer(call.id, e.target.value)
                                    e.target.value = ""
                                  }
                                }}
                                onFocus={fetchVolunteers}
                                disabled={loadingVolunteers || call.coordinatorId !== currentUser?.uid}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  border: "1px solid #b0bec5",
                                  fontSize: "0.85em",
                                  backgroundColor: call.coordinatorId !== currentUser?.uid ? "#f5f5f5" : "white",
                                  cursor: call.coordinatorId !== currentUser?.uid ? "not-allowed" : "pointer",
                                  opacity: call.coordinatorId !== currentUser?.uid ? 0.6 : 1,
                                }}
                                title={call.coordinatorId !== currentUser?.uid ? "יש לקחת בעלות על הפנייה כדי להחליף מתנדב" : ""}
                              >
                                <option value="">החלף מתנדב...</option>
                                {volunteers.map((volunteer) => (
                                  <option
                                    key={volunteer.id}
                                    value={volunteer.id}
                                    disabled={volunteer.id === call.assignedVolunteers}
                                  >
                                    {volunteer.name || `${volunteer.firstName} ${volunteer.lastName}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span style={{ color: "#999", fontStyle: "italic" }}>לא שובץ מתנדב</span>
                          )}
                        </td>
                        <td style={{ padding: "15px 25px", whiteSpace: "nowrap" }}>
                          {isUnassigned ? (
                            <span style={{ color: "#e67e22", fontStyle: "italic", fontWeight: "500" }}>
                              לא שויך לרכז
                            </span>
                          ) : (
                            call.coordinatorName
                          )}
                        </td>
                        <td
                          style={{
                            padding: "15px 25px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            alignItems: "flex-end",
                          }}
                        >
                          {/* Container for ownership and assign volunteer buttons - side by side */}
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                            {call.coordinatorId === null || call.coordinatorId === "" ? (
                              <button
                                onClick={() => handleTakeOwnership(call.id)}
                                style={{
                                  background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                                  color: "#fff",
                                  padding: "10px 18px",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "0.9em",
                                  fontWeight: "600",
                                  boxShadow: "0 2px 8px rgba(255,152,0,0.2)",
                                  transition: "all 0.2s ease",
                                  width: "fit-content",
                                }}
                                className="no-select"
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)"
                                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(255,152,0,0.3)"
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)"
                                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,152,0,0.2)"
                                }}
                              >
                                קח בעלות
                              </button>
                            ) : call.coordinatorId === currentUser?.uid ? (
                              <button
                                onClick={() => handleReleaseOwnership(call.id)}
                                style={{
                                  background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                                  color: "#fff",
                                  padding: "10px 18px",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "0.9em",
                                  fontWeight: "600",
                                  boxShadow: "0 2px 8px rgba(220,53,69,0.2)",
                                  transition: "all 0.2s ease",
                                  width: "fit-content",
                                }}
                                className="no-select"
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)"
                                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(220,53,69,0.3)"
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)"
                                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(220,53,69,0.2)"
                                }}
                              >
                                שחרר בעלות
                              </button>
                            ) : null}

                            {call.status === "נפתחה פנייה (טופס מולא)" && (
                              <button
                                onClick={() => handleAssignVolunteerClick(call.id)}
                                disabled={call.coordinatorId !== currentUser?.uid}
                                style={{
                                  background: call.coordinatorId !== currentUser?.uid 
                                    ? "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)" 
                                    : "linear-gradient(135deg, #28a745 0%, #218838 100%)",
                                  color: "#fff",
                                  padding: "10px 18px",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: call.coordinatorId !== currentUser?.uid ? "not-allowed" : "pointer",
                                  fontSize: "0.9em",
                                  fontWeight: "600",
                                  boxShadow: call.coordinatorId !== currentUser?.uid 
                                    ? "0 2px 8px rgba(108,117,125,0.2)" 
                                    : "0 2px 8px rgba(40,167,69,0.2)",
                                  transition: "all 0.2s ease",
                                  width: "fit-content",
                                  opacity: call.coordinatorId !== currentUser?.uid ? 0.6 : 1,
                                }}
                                className="no-select"
                                title={call.coordinatorId !== currentUser?.uid ? "יש לקחת בעלות על הפנייה כדי לשבץ מתנדב" : ""}
                                onMouseOver={(e) => {
                                  if (call.coordinatorId === currentUser?.uid) {
                                    e.currentTarget.style.transform = "translateY(-1px)"
                                    e.currentTarget.style.boxShadow = "0 3px 10px rgba(40,167,69,0.3)"
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (call.coordinatorId === currentUser?.uid) {
                                    e.currentTarget.style.transform = "translateY(0)"
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(40,167,69,0.2)"
                                  }
                                }}
                              >
                                שבץ מתנדב
                              </button>
                            )}
                          </div>

                          {call.status === "הפנייה נסגרה" && (
                            <button
                              onClick={() => handleGenerateFeedbackLink(call.id)}
                              style={{
                                background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
                                color: "#fff",
                                padding: "10px 18px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.9em",
                                fontWeight: "600",
                                boxShadow: "0 2px 8px rgba(23,162,184,0.2)",
                                transition: "all 0.2s ease",
                                width: "fit-content",
                              }}
                              className="no-select"
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-1px)"
                                e.currentTarget.style.boxShadow = "0 3px 10px rgba(23,162,184,0.3)"
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0)"
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(23,162,184,0.2)"
                              }}
                            >
                              צור קישור למשוב
                            </button>
                          )}

                          {call.status !== "נפתחה פנייה (טופס מולא)" && call.status !== "הפנייה נסגרה" && (
                            <span
                              style={{ color: "#888", fontStyle: "italic", fontSize: "0.8em", whiteSpace: "nowrap" }}
                              className="no-select"
                            >
                              אין פעולות זמינות
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {paginatedCalls.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "#999",
                          fontSize: "1.1em",
                          fontWeight: "500",
                        }}
                        className="no-select"
                      >
                        אין נתונים להצגה (נסה לשנות פילטרים)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredCalls.length > itemsPerPage && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "15px",
                  marginTop: "30px",
                  padding: "25px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? "#e9ecef" : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                    color: currentPage === 1 ? "#6c757d" : "white",
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "1em",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  className="no-select"
                >
                  הקודם →
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "1.1em",
                    fontWeight: "600",
                    color: "#495057",
                  }}
                  className="no-select"
                >
                  <span>
                    עמוד {currentPage} מתוך {totalPages}
                  </span>
                  <span style={{ color: "#6c757d", fontSize: "0.9em" }}>
                    (מציג {paginatedCalls.length} מתוך {filteredCalls.length} רשומות)
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    background:
                      currentPage === totalPages ? "#e9ecef" : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                    color: currentPage === totalPages ? "#6c757d" : "white",
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "1em",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  className="no-select"
                >
                  ← הבא
                </button>
              </div>
            )}

            {/* Footer Section */}
            <footer
              style={{
                marginTop: "40px",
                paddingTop: "25px",
                borderTop: "1px solid #e0e0e0",
                textAlign: "center",
                color: "#777",
                fontSize: "0.9em",
              }}
              className="no-select"
            >
              © 2025 מגן דבורים אדום. כל הזכויות שמורות.
            </footer>
          </div>

          {/* Details Modal */}
          {isDetailsModalOpen && selectedCallDetails && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                padding: "20px",
              }}
              onClick={handleCloseDetails}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "30px",
                  maxWidth: "700px",
                  maxHeight: "80vh",
                  overflow: "auto",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                  position: "relative",
                  direction: "rtl",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "25px",
                    borderBottom: "2px solid #f0f0f0",
                    paddingBottom: "15px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "#333",
                      fontSize: "1.4em",
                      fontWeight: "600",
                    }}
                  >
                    פרטי הפנייה המלאים
                  </h3>
                  <button
                    onClick={handleCloseDetails}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.5em",
                      cursor: "pointer",
                      color: "#666",
                      padding: "5px",
                      borderRadius: "50%",
                      width: "35px",
                      height: "35px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0"
                      e.currentTarget.style.color = "#333"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                      e.currentTarget.style.color = "#666"
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "grid", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>שם מלא:</div>
                      <div style={{ fontSize: "1.1em", color: "#333" }}>{selectedCallDetails.fullName}</div>
                    </div>

                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>מספר טלפון:</div>
                      <div style={{ fontSize: "1.1em", color: "#333" }}>{selectedCallDetails.phoneNumber}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>עיר:</div>
                      <div style={{ fontSize: "1.1em", color: "#333" }}>{selectedCallDetails.city || "לא צוין"}</div>
                    </div>

                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>כתובת:</div>
                      <div style={{ fontSize: "1.1em", color: "#333" }}>{selectedCallDetails.address || "לא צוין"}</div>
                    </div>
                  </div>

                  <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>תאריך ושעת הפנייה:</div>
                    <div style={{ fontSize: "1.1em", color: "#333" }}>
                      {formatDateForDisplay(
                        selectedCallDetails.timestamp,
                        selectedCallDetails.date,
                        selectedCallDetails.time,
                      )}
                    </div>
                  </div>

                  <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>הערות נוספות:</div>
                    <div
                      style={{
                        fontSize: "1.1em",
                        color: "#333",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        minHeight: "60px",
                        maxHeight: "200px",
                        overflow: "auto",
                        padding: "10px",
                        background: "white",
                        borderRadius: "6px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      {selectedCallDetails.additionalDetails || "אין הערות נוספות"}
                    </div>
                  </div>

                  {/* Photo section with download button */}
                  {selectedCallDetails.photo && (
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#495057", marginBottom: "8px" }}>תמונת הדיווח:</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
                        <img
                          src={selectedCallDetails.photo}
                          alt="תמונת הדיווח"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "transform 0.2s ease",
                          }}
                          onClick={() => handleOpenPhoto(selectedCallDetails.photo)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)"
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "scale(1)"
                          }}
                          title="לחץ לפתיחת התמונה בטאב חדש"
                        />
                        <button
                          onClick={() => handleDownloadPhoto(selectedCallDetails.photo, selectedCallDetails.id)}
                          style={{
                            background: "linear-gradient(135deg, #28a745 0%, #218838 100%)",
                            color: "white",
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.9em",
                            fontWeight: "600",
                            boxShadow: "0 2px 8px rgba(40,167,69,0.2)",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)"
                            e.currentTarget.style.boxShadow = "0 3px 10px rgba(40,167,69,0.3)"
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)"
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(40,167,69,0.2)"
                          }}
                        >
                          📥 הורד תמונה
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#2e7d32", marginBottom: "8px" }}>סטטוס נוכחי:</div>
                      <div style={{ fontSize: "1.1em", color: "#333", fontWeight: "500" }}>
                        {selectedCallDetails.status}
                      </div>
                    </div>

                    <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#1565c0", marginBottom: "8px" }}>מתנדב משובץ:</div>
                      <div style={{ fontSize: "1.1em", color: "#333" }}>
                        {selectedCallDetails.assignedVolunteerName || "לא שובץ מתנדב"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
       