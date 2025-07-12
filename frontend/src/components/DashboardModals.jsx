import React from 'react'

const DashboardModals = ({
  isCommentModalOpen,
  selectedComment,
  handleCloseComment,
  isDetailsModalOpen,
  selectedCallDetails,
  handleCloseDetails,
  formatDateForDisplay,
  handleOpenPhoto,
  handleDownloadPhoto
}) => {
  
  if (!isCommentModalOpen && !isDetailsModalOpen) {
    return null
  }

  return (
    <>
      {/* Comment Modal */}
      {isCommentModalOpen && selectedComment && (
        <div className="modal-overlay" onClick={handleCloseComment}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">הערות נוספות</h3>
              <button
                onClick={handleCloseComment}
                className="modal-close-button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="comment-text">{selectedComment}</p>
            </div>
          </div>
        </div>
      )}

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

              <div className="detail-card full-width">
                <div className="detail-label">הערות נוספות:</div>
                <div className="detail-value notes">
                  {selectedCallDetails.additionalDetails || "אין הערות נוספות"}
                </div>
              </div>

              {/* Photo section with download button */}
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
                    <button
                      onClick={() => handleDownloadPhoto(selectedCallDetails.photo, selectedCallDetails.id)}
                      className="download-photo-button"
                    >
                      📥 הורד תמונה
                    </button>
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
