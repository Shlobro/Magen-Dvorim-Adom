"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useNotification } from "../contexts/NotificationContext"
import { useDashboardData } from "../hooks/useDashboardData"
import DashboardFilters from "../components/DashboardFilters"
import DashboardExports from "../components/DashboardExports"
import DashboardTable from "../components/DashboardTable"
import DashboardModals from "../components/DashboardModals"
import "../styles/HomeScreen.css"
import "../styles/Dashboard.css"

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, userRole, loading: authLoading } = useAuth()
  const { showSuccess, showError, showWarning, showInfo, showConfirmDialog } = useNotification()

  // Use custom hook for data management
  const {
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
    handleReassignVolunteer
  } = useDashboardData(currentUser, userRole, authLoading, showSuccess, showError, showWarning, showConfirmDialog)

  // State for coordinator report link
  const [reportLink, setReportLink] = useState("")

  // Modal states
  const [selectedComment, setSelectedComment] = useState(null)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [selectedCallDetails, setSelectedCallDetails] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Filter States
  const [filterVolunteer, setFilterVolunteer] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("נפתחה פנייה (טופס מולא)")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Mobile filter visibility
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // Sorting States
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  // Constants
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
      setIsMobileView(window.innerWidth <= 768)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Generate report link when currentUser is available
  useEffect(() => {
    if (currentUser && userRole === 1) {
      const baseUrl = window.location.origin
      setReportLink(`${baseUrl}/report?coordinatorId=${currentUser.uid}`)
    } else {
      setReportLink("")
    }
  }, [currentUser, userRole])

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

  // Derived State: Unique Volunteer Names
  const uniqueVolunteerNames = useMemo(() => {
    console.log('🎯 Building unique volunteer names...');
    const names = new Set()
    calls.forEach((call) => {
      if (call.assignedVolunteerName && call.assignedVolunteerName !== "-") {
        names.add(call.assignedVolunteerName)
        console.log('  - Found volunteer name:', call.assignedVolunteerName);
      }
    })
    const result = Array.from(names).sort()
    console.log('🎯 Final unique volunteer names:', result);
    return result
  }, [calls])

  // Filtered Calls Logic with Pagination
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

  // Clear all filters function
  const handleClearAllFilters = () => {
    setFilterVolunteer("")
    setFilterStatus("נפתחה פנייה (טופס מולא)")
    setFilterStartDate("")
    setFilterEndDate("")
    setCurrentPage(1)
  }

  // Modal handlers
  const handleOpenComment = (comment) => {
    setSelectedComment(comment)
    setIsCommentModalOpen(true)
  }

  const handleCloseComment = () => {
    setSelectedComment(null)
    setIsCommentModalOpen(false)
  }

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
      
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `תמונת_דיווח_${inquiryId}_${new Date().toISOString().split('T')[0]}.jpg`
      document.body.appendChild(a)
      a.click()
      
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('שגיאה בהורדת התמונה')
    }
  }

  // Action handlers
  const handleAssignVolunteerClick = (inquiryId) => {
    const currentCall = calls.find(c => c.id === inquiryId)
    
    if (!currentCall || currentCall.coordinatorId !== currentUser?.uid) {
      showError("לא ניתן לשבץ מתנדב ללא בעלות על הפנייה. יש לקחת בעלות על הפנייה תחילה.")
      return
    }
    
    navigate(`/volunteer-map?inquiryId=${inquiryId}`)
  }

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

  // ui
  if (authLoading || loading)
    return (
      <div className="dashboard-loading-container">
        <div className="dashboard-loading-content">
          טוען נתונים...
        </div>
      </div>
    )

  if (error)
    return (
      <div className="dashboard-error-container">
        <div className="dashboard-error-content">
          שגיאה: {error}
        </div>
      </div>
    )

  if (!currentUser)
    return (
      <div className="dashboard-error-container">
        <div className="dashboard-auth-error">
          אנא התחבר כדי לגשת ללוח המחוונים.
        </div>
      </div>
    )

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-main-card">
          {/* Header Section */}
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              ניהול קריאות נחילים
            </h1>
            <div className="dashboard-subtitle">
              מערכת ניהול פניות ומעקב אחר מתנדבים
            </div>
          </div>
          <div className="dashboard-inner-content">
            {/* Coordinator Report Link Section */}
            {userRole === 1 && (
              <div className="coordinator-links-section">
                <div className="coordinator-links-title">
                  קישורים לניהול המערכת
                </div>
                <div className="coordinator-links-buttons">
                  <button
                    onClick={copyReportLink}
                    className="report-link-button no-select"
                  >
                    📋 העתק קישור לדיווח
                  </button>
                </div>
              </div>
            )}

            {/* Filters Component */}
            <DashboardFilters
              filterVolunteer={filterVolunteer}
              setFilterVolunteer={setFilterVolunteer}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              uniqueVolunteerNames={uniqueVolunteerNames}
              statusOptions={statusOptions}
              isMobileView={isMobileView}
              isMobileFilterOpen={isMobileFilterOpen}
              setIsMobileFilterOpen={setIsMobileFilterOpen}
              setCurrentPage={setCurrentPage}
              onClearAllFilters={handleClearAllFilters}
            />

            {/* Export Components */}
            <DashboardExports
              loading={loading}
              calls={calls}
              filterVolunteer={filterVolunteer}
              filterStatus={filterStatus}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
              formatDateForDisplay={formatDateForDisplay}
              convertTimestamp={convertTimestamp}
              showWarning={showWarning}
              showSuccess={showSuccess}
              showError={showError}
            />

            {/* Table Component */}
            <DashboardTable
              paginatedCalls={paginatedCalls}
              currentUser={currentUser}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              handleSort={handleSort}
              formatDateForDisplay={formatDateForDisplay}
              statusOptions={statusOptions}
              closureOptions={closureOptions}
              handleStatusChange={handleStatusChange}
              handleClosureChange={handleClosureChange}
              handleOpenComment={handleOpenComment}
              handleOpenDetails={handleOpenDetails}
              volunteers={volunteers}
              loadingVolunteers={loadingVolunteers}
              fetchVolunteers={fetchVolunteers}
              handleReassignVolunteer={handleReassignVolunteer}
              handleTakeOwnership={handleTakeOwnership}
              handleReleaseOwnership={handleReleaseOwnership}
              handleAssignVolunteerClick={handleAssignVolunteerClick}
              handleGenerateFeedbackLink={handleGenerateFeedbackLink}
            />

            {/* Pagination Controls */}
            {filteredCalls.length > itemsPerPage && (
              <div className="pagination-container">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-button no-select"
                >
                  הקודם →
                </button>

                <div className="pagination-info no-select">
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
                  className="pagination-button no-select"
                >
                  ← הבא
                </button>
              </div>
            )}

            {/* Footer Section */}
            <footer className="dashboard-footer no-select">
              © 2025 מגן דבורים אדום. כל הזכויות שמורות.
            </footer>
          </div>

          {/* Modal Components */}
          <DashboardModals
            isCommentModalOpen={isCommentModalOpen}
            selectedComment={selectedComment}
            handleCloseComment={handleCloseComment}
            isDetailsModalOpen={isDetailsModalOpen}
            selectedCallDetails={selectedCallDetails}
            handleCloseDetails={handleCloseDetails}
            formatDateForDisplay={formatDateForDisplay}
            handleOpenPhoto={handleOpenPhoto}
            handleDownloadPhoto={handleDownloadPhoto}
          />
        </div>
      </div>
    </div>
  )
}
