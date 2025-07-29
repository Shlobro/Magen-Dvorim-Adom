import React from 'react'

const DashboardModals = ({
  isDetailsModalOpen,
  selectedCallDetails,
  handleCloseDetails,
  formatDateForDisplay,
  handleOpenPhoto
}) => {
  
  if (!isDetailsModalOpen) {
    return null
  }

  return (
    <>
      {/* Details Modal */}
      {isDetailsModalOpen && selectedCallDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                פרטי הפנייה המלאים
              </h3>
              <button
                onClick={handleCloseDetails}
                className="modal-close-button"
              >
                ✕
              </button>
            </div>

            <div className="modal-details-grid">
              <div className="modal-details-row">
                <div className="detail-card">
                  <div className="detail-label">שם מלא:</div>
                  <div className="detail-value">{selectedCallDetails.fullName}</div>
                </div>

                <div className="detail-card">
                  <div className="detail-label">מספר טלפון:</div>
                  <div className="detail-value">{selectedCallDetails.phoneNumber}</div>
                </div>
              </div>

              <div className="modal-details-row">
                <div className="detail-card">
                  <div className="detail-label">עיר:</div>
                  <div className="detail-value">{selectedCallDetails.city || "לא צוין"}</div>
                </div>

                <div className="detail-card">
                  <div className="detail-label">כתובת:</div>
                  <div className="detail-value">{selectedCallDetails.address || "לא צוין"}</div>
                </div>
              </div>

              <div className="detail-card full-width">
                <div className="detail-label">תאריך ושעת הפנייה:</div>
                <div className="detail-value">
                  {formatDateForDisplay(
                    selectedCallDetails.timestamp,
                    selectedCallDetails.date,
                    selectedCallDetails.time,
                  )}
                </div>
              </div>

              {/* Appearance Date */}
              {selectedCallDetails.appearanceDate && (
                <div className="detail-card full-width">
                  <div className="detail-label">תאריך הופעת הנחיל:</div>
                  <div className="detail-value appearance-date">
                    {new Date(selectedCallDetails.appearanceDate).toLocaleDateString('he-IL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {/* Location Description */}
              {selectedCallDetails.locationDescription && (
                <div className="detail-card full-width">
                  <div className="detail-label">תיאור מיקום מדויק:</div>
                  <div className="detail-value location-description">
                    {selectedCallDetails.locationDescription}
                  </div>
                </div>
              )}

              <div className="detail-card full-width">
                <div className="detail-label">הערות נוספות:</div>
                <div className="detail-value notes">
                  {selectedCallDetails.additionalDetails || "אין הערות נוספות"}
                </div>
              </div>

              {/* Photo section */}
              {selectedCallDetails.photo && (
                <div className="detail-card full-width">
                  <div className="detail-label">תמונת הדיווח:</div>
                  <div className="photo-container">
                    <img
                      src={selectedCallDetails.photo}
                      alt="תמונת הדיווח"
                      className="modal-photo"
                      onClick={() => handleOpenPhoto(selectedCallDetails.photo)}
                      title="לחץ לפתיחת התמונה בטאב חדש"
                    />
                  </div>
                </div>
              )}

              <div className="status-grid">
                <div className="status-card current">
                  <div className="status-label current">סטטוס נוכחי:</div>
                  <div className="status-value">
                    {selectedCallDetails.status}
                  </div>
                </div>

                <div className="status-card volunteer">
                  <div className="status-label volunteer">מתנדב משובץ:</div>
                  <div className="status-value">
                    {selectedCallDetails.assignedVolunteerName || "לא שובץ מתנדב"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardModals
