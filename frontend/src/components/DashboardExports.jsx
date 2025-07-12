import React from 'react'
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebaseConfig"

const DashboardExports = ({ 
  loading, 
  calls, 
  filterVolunteer, 
  filterStatus, 
  filterStartDate, 
  filterEndDate,
  formatDateForDisplay,
  convertTimestamp,
  showWarning,
  showSuccess,
  showError
}) => {

  // Helper for CSV export
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

  // Export Feedback Report
  const handleExportFeedback = async () => {
    try {
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
    }
  }

  // Specific Export functions for filtered data
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

  // General Report Export (exports entire table)
  const handleExportGeneralReport = () => {
    // Export all calls without any filtering
    const filename = `general_report_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(calls, filename)
  }

  return (
    <div className="export-section">
      <h3 className="export-title no-select">
        📊 הפקת דוחות
      </h3>

      <button
        onClick={handleExportFeedback}
        disabled={loading}
        className="export-button feedback no-select"
      >
        דוח משובים
      </button>

      <button
        onClick={handleExportVolunteerReport}
        disabled={loading}
        className="export-button volunteer no-select"
      >
        דוח מתנדב
      </button>

      <button
        onClick={handleExportStatusReport}
        disabled={loading}
        className="export-button status no-select"
      >
        דוח סטטוס
      </button>

      <button
        onClick={handleExportDateRangeReport}
        disabled={loading}
        className="export-button date-range no-select"
      >
        דוח תאריכים
      </button>

      <button
        onClick={handleExportGeneralReport}
        disabled={loading}
        className="export-button general no-select"
      >
        דוח פניות כללי
      </button>
    </div>
  )
}

export default DashboardExports
