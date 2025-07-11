import React from 'react'

const DashboardFilters = ({
  filterVolunteer,
  setFilterVolunteer,
  filterStatus,
  setFilterStatus,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  uniqueVolunteerNames,
  statusOptions,
  isMobileView,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  setCurrentPage,
  onClearAllFilters
}) => {
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

  return (
    <div className="filters-section">
      <h3 className="filters-header no-select">
        🔍 סינון נתונים
        {isMobileView && (
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className={`mobile-filter-toggle no-select ${isMobileFilterOpen ? 'open' : ''}`}
          >
            {isMobileFilterOpen ? "▲" : "▼"}
          </button>
        )}
      </h3>
      {(isMobileFilterOpen || !isMobileView) && (
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label no-select">
              פילטר מתנדב:
            </label>
            <select
              value={filterVolunteer}
              onChange={handleVolunteerFilterChange}
              className="filter-select"
            >
              <option value="">כל המתנדבים</option>
              {uniqueVolunteerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label no-select">
              פילטר סטטוס:
            </label>
            <select
              value={filterStatus}
              onChange={handleStatusFilterChange}
              className="filter-select"
            >
              <option value="">כל הסטטוסים</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label no-select">
              מתאריך:
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={handleStartDateFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label no-select">
              עד תאריך:
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={handleEndDateFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-end-align">
            <button
              onClick={onClearAllFilters}
              className="clear-filters-button no-select"
            >
              🗑️ נקה פילטרים
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardFilters
