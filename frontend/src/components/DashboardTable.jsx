import React from 'react'
import { getTableRowClasses, getVolunteerAssignmentClasses, getClosureSelectClasses, shouldShowButton } from "../utils/dashboardUtils"

const DashboardTable = ({
  paginatedCalls,
  currentUser,
  sortColumn,
  sortDirection,
  handleSort,
  formatDateForDisplay,
  statusOptions,
  closureOptions,
  handleStatusChange,
  handleClosureChange,
  handleOpenComment,
  handleOpenDetails,
  volunteers,
  loadingVolunteers,
  fetchVolunteers,
  handleReassignVolunteer,
  handleTakeOwnership,
  handleReleaseOwnership,
  handleAssignVolunteerClick,
  handleGenerateFeedbackLink
}) => {

  const getSortIcon = (columnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'asc' ? '▲' : '▼'
    }
    return '⇅'
  }

  return (
    <div className="table-container">
      <table className="dashboard-table">
        <thead>
          <tr className="table-header">
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
                className={`table-header-cell ${column.key ? 'sortable' : ''} no-select`}
                onClick={() => column.key && handleSort(column.key)}
              >
                <div className="header-content">
                  <span>{column.label}</span>
                  {column.key && (
                    <span className={`sort-indicator ${sortColumn === column.key ? 'active' : 'inactive'}`}>
                      {getSortIcon(column.key)}
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
            const rowClasses = getTableRowClasses(isUnassigned, index)

            return (
              <tr key={call.id} className={rowClasses}>
                <td className="table-cell">
                  <div className="name-container">
                    <span className="full-name">{call.fullName}</span>
                    <span className="phone-number">{call.phoneNumber}</span>
                  </div>
                </td>

                <td className="table-cell nowrap">
                  <div className="address-container">
                    <span className="city">{call.city || "לא צוין"}</span>
                    <span className="address">{call.address || "לא צוין"}</span>
                  </div>
                </td>

                <td className="table-cell">
                  <div className="details-container">
                    {call.additionalDetails && (
                      <button
                        onClick={() => handleOpenComment(call.additionalDetails)}
                        className="comment-button no-select"
                        title="הצג הערות"
                      >
                        💬 הערות
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDetails(call)}
                      className="details-button no-select"
                      title="הצג פרטים מלאים"
                    >
                      📋 פרטים
                    </button>
                  </div>
                </td>

                <td className="table-cell nowrap">
                  {formatDateForDisplay(call.timestamp, call.date, call.time)}
                </td>

                <td className="table-cell">
                  {call.status === "הפנייה נסגרה" ? (
                    <span className="status-text closed">{call.status}</span>
                  ) : (
                    <select
                      value={call.status}
                      onChange={(e) => handleStatusChange(call.id, e.target.value)}
                      className="status-select"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td className="table-cell">
                  {call.status === "הפנייה נסגרה" && (
                    <select
                      value={call.closureReason || ""}
                      onChange={(e) => handleClosureChange(call.id, e.target.value)}
                      className={getClosureSelectClasses(call.coordinatorId, currentUser?.uid)}
                      disabled={call.coordinatorId !== currentUser?.uid}
                      title={call.coordinatorId !== currentUser?.uid ? "יש לקחת בעלות על הפנייה כדי לשנות סיבת סגירה" : ""}
                    >
                      <option value="">בחר סיבת סגירה</option>
                      {closureOptions.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td className="table-cell nowrap">
                  {call.assignedVolunteers && call.assignedVolunteers !== "-" ? (
                    <div className="volunteer-assignment">
                      <div className="current-volunteer">
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
                        className={getVolunteerAssignmentClasses(call.coordinatorId, currentUser?.uid)}
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

                <td className="table-cell nowrap">
                  {isUnassigned ? (
                    <span style={{ color: "#e67e22", fontStyle: "italic", fontWeight: "500" }}>
                      לא שויך לרכז
                    </span>
                  ) : (
                    call.coordinatorName
                  )}
                </td>

                <td className="table-cell">
                  <div className="action-buttons">
                    {shouldShowButton(call.status, call.coordinatorId, currentUser?.uid, 'takeOwnership') && (
                      <button
                        onClick={() => handleTakeOwnership(call.id)}
                        className="take-ownership-button no-select"
                      >
                        קח בעלות
                      </button>
                    )}

                    {shouldShowButton(call.status, call.coordinatorId, currentUser?.uid, 'releaseOwnership') && (
                      <button
                        onClick={() => handleReleaseOwnership(call.id)}
                        className="release-ownership-button no-select"
                      >
                        שחרר בעלות
                      </button>
                    )}

                    {shouldShowButton(call.status, call.coordinatorId, currentUser?.uid, 'assignVolunteer') && (
                      <button
                        onClick={() => handleAssignVolunteerClick(call.id)}
                        disabled={call.coordinatorId !== currentUser?.uid}
                        className="assign-volunteer-button no-select"
                        title={call.coordinatorId !== currentUser?.uid ? "יש לקחת בעלות על הפנייה כדי לשבץ מתנדב" : ""}
                      >
                        שבץ מתנדב
                      </button>
                    )}

                    {shouldShowButton(call.status, call.coordinatorId, currentUser?.uid, 'feedbackLink') && (
                      <button
                        onClick={() => handleGenerateFeedbackLink(call.id)}
                        className="feedback-link-button no-select"
                      >
                        צור קישור למשוב
                      </button>
                    )}

                    {shouldShowButton(call.status, call.coordinatorId, currentUser?.uid, 'noActions') && (
                      <span className="action-disabled-text no-select">
                        אין פעולות זמינות
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}

          {paginatedCalls.length === 0 && (
            <tr className="empty-state-row">
              <td colSpan={9} className="empty-state-cell no-select">
                אין נתונים להצגה (נסה לשנות פילטרים)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DashboardTable
