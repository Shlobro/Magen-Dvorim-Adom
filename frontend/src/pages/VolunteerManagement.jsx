"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Container,
  Card,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Paper,
  Avatar,
  Chip,
  Fade,
  Grow,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import { 
  People, 
  Email, 
  Phone, 
  LocationOn, 
  PersonRemove, 
  Warning, 
  Search, 
  FilterList,
  ExpandMore,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material"
import { useNotification } from "../contexts/NotificationContext"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001"

export default function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState([])
  const { showSuccess, showError, showConfirmDialog } = useNotification()
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  
  // Add state for volunteer details modal
  const [selectedVolunteerDetails, setSelectedVolunteerDetails] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [beeExperienceFilter, setBeeExperienceFilter] = useState("")
  const [beekeepingExperienceFilter, setBeekeepingExperienceFilter] = useState("")
  const [hasTrainingFilter, setHasTrainingFilter] = useState("")
  const [heightPermitFilter, setHeightPermitFilter] = useState("")
  
  // Sorting states
  const [sortField, setSortField] = useState("")
  const [sortDirection, setSortDirection] = useState("asc") // "asc" or "desc"

  // Fetch all volunteers
  useEffect(() => {    setLoading(true)
    axios
      .get(`${API_BASE}/api/users`)
      .then((res) => {
        setVolunteers(res.data.filter((u) => u.userType === 2))
        setLoading(false)
      })
      .catch((err) => {
        showError("שגיאה בטעינת מתנדבים")
        setLoading(false)
      })
  }, [])
  // Handle delete confirmation
  const handleDeleteClick = async (volunteer) => {
    const confirmed = await showConfirmDialog({
      title: 'אישור הסרת מתנדב',
      message: `האם אתה בטוח שברצונך להסיר את המתנדב ${volunteer.name || `${volunteer.firstName || ""} ${volunteer.lastName || ""}`} מהמערכת? פעולה זו אינה ניתנת לביטול.`,
      confirmText: 'הסר מתנדב',
      cancelText: 'ביטול',
      severity: 'error',
    });
    
    if (!confirmed) return;
    
    setRemovingId(volunteer.id);
    
    try {
      await axios.delete(`${API_BASE}/api/users/${volunteer.id}`)
      setVolunteers(volunteers.filter((v) => v.id !== volunteer.id))
      showSuccess("המתנדב הוסר בהצלחה מהמערכת")
    } catch (e) {
      showError("שגיאה בהסרת מתנדב")
    }

    setRemovingId(null)  }

  // Handle opening volunteer details modal
  const handleOpenVolunteerDetails = (volunteer) => {
    setSelectedVolunteerDetails(volunteer)
    setIsDetailsModalOpen(true)
  }

  // Handle closing volunteer details modal
  const handleCloseVolunteerDetails = () => {
    setSelectedVolunteerDetails(null)
    setIsDetailsModalOpen(false)
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setCityFilter("")
    setBeeExperienceFilter("")
    setBeekeepingExperienceFilter("")
    setHasTrainingFilter("")
    setHeightPermitFilter("")
    setSortField("")
    setSortDirection("asc")
  }

  // Get unique cities for filter dropdown
  const uniqueCities = [...new Set(volunteers.map(v => v.city || v.location).filter(Boolean))]

  // Filter and sort volunteers
  const filteredAndSortedVolunteers = volunteers
    .filter(volunteer => {
      // General search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const name = (volunteer.name || `${volunteer.firstName || ""} ${volunteer.lastName || ""}`).toLowerCase()
        const email = (volunteer.email || "").toLowerCase()
        const phone = (volunteer.phoneNumber || "").toLowerCase()
        const city = (volunteer.city || volunteer.location || "").toLowerCase()
        
        if (!name.includes(searchLower) && 
            !email.includes(searchLower) && 
            !phone.includes(searchLower) && 
            !city.includes(searchLower)) {
          return false
        }
      }

      // City filter
      if (cityFilter && (volunteer.city || volunteer.location) !== cityFilter) {
        return false
      }

      // Experience filters
      if (beeExperienceFilter !== "" && volunteer.beeExperience !== (beeExperienceFilter === "true")) {
        return false
      }

      if (beekeepingExperienceFilter !== "" && volunteer.beekeepingExperience !== (beekeepingExperienceFilter === "true")) {
        return false
      }

      if (hasTrainingFilter !== "" && volunteer.hasTraining !== (hasTrainingFilter === "true")) {
        return false
      }

      if (heightPermitFilter !== "" && volunteer.heightPermit !== (heightPermitFilter === "true")) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (!sortField) return 0

      let aVal, bVal
      
      switch (sortField) {
        case "name":
          aVal = (a.name || `${a.firstName || ""} ${a.lastName || ""}`).toLowerCase()
          bVal = (b.name || `${b.firstName || ""} ${b.lastName || ""}`).toLowerCase()
          break
        case "email":
          aVal = (a.email || "").toLowerCase()
          bVal = (b.email || "").toLowerCase()
          break
        case "phone":
          aVal = a.phoneNumber || ""
          bVal = b.phoneNumber || ""
          break
        case "city":
          aVal = (a.city || a.location || "").toLowerCase()
          bVal = (b.city || b.location || "").toLowerCase()
          break
        case "beeExperience":
          aVal = a.beeExperience ? 1 : 0
          bVal = b.beeExperience ? 1 : 0
          break
        case "beekeepingExperience":
          aVal = a.beekeepingExperience ? 1 : 0
          bVal = b.beekeepingExperience ? 1 : 0
          break
        case "hasTraining":
          aVal = a.hasTraining ? 1 : 0
          bVal = b.hasTraining ? 1 : 0
          break
        case "heightPermit":
          aVal = a.heightPermit ? 1 : 0
          bVal = b.heightPermit ? 1 : 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Get sort icon for column headers
  const getSortIcon = (field) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress size={80} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
              טוען רשימת מתנדבים...
            </Typography>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 4,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textAlign: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
                <People sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  ניהול מתנדבים
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: "auto" }}>              ניהול וצפייה ברשימת המתנדבים הרשומים במערכת
            </Typography>
          </Paper>
        </Fade>

        {/* Content */}
        {volunteers.length === 0 ? (
          <Fade in>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                maxWidth: 600,
                mx: "auto",
                textAlign: "center",
                p: 6,
              }}
            >
              <Avatar sx={{ mx: "auto", mb: 3, width: 80, height: 80, bgcolor: "grey.100" }}>
                <People sx={{ fontSize: 40, color: "grey.400" }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                אין מתנדבים רשומים
              </Typography>
              <Typography variant="body1" color="text.secondary">
                עדיין לא נרשמו מתנדבים במערכת
              </Typography>
            </Card>
          </Fade>
        ) : (
          <Grow in timeout={600}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #1976d215 0%, #1976d205 100%)",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#1976d2", width: 48, height: 48 }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                      רשימת מתנדבים
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filteredAndSortedVolunteers.length} מתנדבים פעילים במערכת
                      {filteredAndSortedVolunteers.length !== volunteers.length && 
                        ` (מתוך ${volunteers.length} סה"כ)`}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Search and Filter Section */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FilterList />
                    <Typography variant="h6" fontWeight="bold">
                      חיפוש וסינון מתנדבים
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "20px",
                      direction: "rtl",
                    }}
                  >
                    {/* General Search */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <TextField
                        fullWidth
                        label="חיפוש כללי"
                        placeholder="חיפוש לפי שם, אימייל, טלפון או עיר..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                        }}
                        sx={{ mb: 2 }}
                      />
                    </div>

                    {/* City Filter */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "0.95em",
                        }}
                      >
                        סינון לפי עיר:
                      </label>
                      <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
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
                        <option value="">כל העיירות</option>
                        {uniqueCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    {/* Experience Filters */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          color: "#495057",
                          fontSize: "0.95em",
                        }}
                      >
                        ניסיון פינוי נחילים:
                      </label>
                      <select
                        value={beeExperienceFilter}
                        onChange={(e) => setBeeExperienceFilter(e.target.value)}
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
                        <option value="">הכל</option>
                        <option value="true">כן</option>
                        <option value="false">לא</option>
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
                      >
                        ניסיון גידול דבורים:
                      </label>
                      <select
                        value={beekeepingExperienceFilter}
                        onChange={(e) => setBeekeepingExperienceFilter(e.target.value)}
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
                        <option value="">הכל</option>
                        <option value="true">כן</option>
                        <option value="false">לא</option>
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
                      >
                        עבר הדרכות:
                      </label>
                      <select
                        value={hasTrainingFilter}
                        onChange={(e) => setHasTrainingFilter(e.target.value)}
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
                        <option value="">הכל</option>
                        <option value="true">כן</option>
                        <option value="false">לא</option>
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
                      >
                        היתר עבודה בגובה:
                      </label>
                      <select
                        value={heightPermitFilter}
                        onChange={(e) => setHeightPermitFilter(e.target.value)}
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
                        <option value="">הכל</option>
                        <option value="true">כן</option>
                        <option value="false">לא</option>
                      </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div style={{ gridColumn: "1 / -1", marginTop: "20px" }}>
                      <button
                        onClick={clearFilters}
                        disabled={!searchTerm && !cityFilter && !beeExperienceFilter && 
                                 !beekeepingExperienceFilter && !hasTrainingFilter && 
                                 !heightPermitFilter && !sortField}
                        style={{
                          padding: "12px 24px",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "1em",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          background: (!searchTerm && !cityFilter && !beeExperienceFilter && 
                                     !beekeepingExperienceFilter && !hasTrainingFilter && 
                                     !heightPermitFilter && !sortField) 
                                    ? "#e9ecef" : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                          color: (!searchTerm && !cityFilter && !beeExperienceFilter && 
                                 !beekeepingExperienceFilter && !hasTrainingFilter && 
                                 !heightPermitFilter && !sortField) 
                                ? "#6c757d" : "white",
                          boxShadow: (!searchTerm && !cityFilter && !beeExperienceFilter && 
                                     !beekeepingExperienceFilter && !hasTrainingFilter && 
                                     !heightPermitFilter && !sortField) 
                                    ? "none" : "0 4px 8px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.transform = "translateY(-2px)"
                            e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.transform = "translateY(0)"
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)"
                          }
                        }}
                      >
                        🗑️ נקה את כל הסינונים
                      </button>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>

              <TableContainer dir="rtl">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: "bold", fontSize: "1rem", width: "20%", cursor: "pointer" }}
                        onClick={() => handleSort("name")}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <People sx={{ fontSize: 20, color: "text.secondary" }} />
                          שם מלא
                          {getSortIcon("name")}
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: "bold", fontSize: "1rem", width: "20%", cursor: "pointer" }}
                        onClick={() => handleSort("email")}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Email sx={{ fontSize: 20, color: "text.secondary" }} />
                          אימייל
                          {getSortIcon("email")}
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: "bold", fontSize: "1rem", width: "15%", cursor: "pointer" }}
                        onClick={() => handleSort("phone")}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Phone sx={{ fontSize: 20, color: "text.secondary" }} />
                          טלפון
                          {getSortIcon("phone")}
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: "bold", fontSize: "1rem", width: "15%", cursor: "pointer" }}
                        onClick={() => handleSort("city")}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LocationOn sx={{ fontSize: 20, color: "text.secondary" }} />
                          עיר
                          {getSortIcon("city")}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", fontSize: "1rem", textAlign: "center", width: "15%" }}
                      >
                        פרטים מלאים
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", fontSize: "1rem", textAlign: "center", width: "15%" }}
                      >
                        פעולות
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedVolunteers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <People sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              {volunteers.length === 0 ? "אין מתנדבים במערכת" : "לא נמצאו מתנדבים התואמים לקריטריונים"}
                            </Typography>
                            {volunteers.length > 0 && (
                              <Button onClick={clearFilters} variant="outlined" sx={{ mt: 2 }}>
                                נקה סינונים
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedVolunteers.map((volunteer, index) => (
                      <Fade in timeout={800 + index * 100} key={volunteer.id}>
                        <TableRow
                          sx={{
                            "&:hover": {
                              bgcolor: "grey.50",
                            },
                            transition: "background-color 0.2s ease",
                          }}
                        >                          <TableCell align="right" sx={{ width: "20%" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: "primary.light",
                                  width: 40,
                                  height: 40,
                                  fontSize: "1rem",
                                  fontWeight: "bold",
                                }}
                              >
                                {(volunteer.name || volunteer.firstName || "מ").charAt(0)}
                              </Avatar>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                  {volunteer.name || `${volunteer.firstName || ""} ${volunteer.lastName || ""}`}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                                  {volunteer.beeExperience && (
                                    <Chip label="פינוי" size="small" color="success" variant="outlined" 
                                          sx={{ fontSize: "0.65rem", height: "16px" }} />
                                  )}
                                  {volunteer.beekeepingExperience && (
                                    <Chip label="גידול" size="small" color="info" variant="outlined" 
                                          sx={{ fontSize: "0.65rem", height: "16px" }} />
                                  )}
                                  {volunteer.hasTraining && (
                                    <Chip label="הדרכות" size="small" color="primary" variant="outlined" 
                                          sx={{ fontSize: "0.65rem", height: "16px" }} />
                                  )}
                                  {volunteer.heightPermit && (
                                    <Chip label="גובה" size="small" color="warning" variant="outlined" 
                                          sx={{ fontSize: "0.65rem", height: "16px" }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ width: "20%" }}>
                            <Typography variant="body1" sx={{ fontFamily: "monospace" }} noWrap>
                              {volunteer.email}
                            </Typography>
                          </TableCell>                          <TableCell align="right" sx={{ width: "15%" }}>
                            <Typography variant="body1" sx={{ fontFamily: "monospace" }} noWrap>
                              {volunteer.phoneNumber || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ width: "15%" }}>
                            <Chip
                              label={volunteer.city || volunteer.location || "לא צוין"}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 500, maxWidth: "100%" }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: "center", width: "15%" }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleOpenVolunteerDetails(volunteer)}
                              sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 2,
                                "&:hover": {
                                  bgcolor: "primary.light",
                                  color: "white",
                                },
                              }}
                            >
                              פרטים מלאים
                            </Button>
                          </TableCell>
                          <TableCell sx={{ textAlign: "center", width: "15%" }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              disabled={removingId === volunteer.id}
                              onClick={() => handleDeleteClick(volunteer)}
                              startIcon={
                                removingId === volunteer.id ? <CircularProgress size={16} /> : <PersonRemove />
                              }
                              sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 2,
                                "&:hover": {
                                  bgcolor: "error.light",
                                  color: "white",
                                },
                              }}
                            >
                              {removingId === volunteer.id ? "מסיר..." : "הסר"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grow>
        )}
      </Container>
      
      {/* Volunteer Details Modal */}
      {isDetailsModalOpen && selectedVolunteerDetails && (
        <Dialog
          open={isDetailsModalOpen}
          onClose={handleCloseVolunteerDetails}
          maxWidth="md"
          fullWidth
          dir="rtl"
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: "80vh",
            }
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "2px solid #f0f0f0",
              pb: 2,
              mb: 3,
              fontSize: "1.4em",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            פרטי המתנדב המלאים
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* Personal Information */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    שם פרטי:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.firstName || "לא צוין"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    שם משפחה:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.lastName || "לא צוין"}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    מספר טלפון:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.phoneNumber || "לא צוין"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    אימייל:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.email || "לא צוין"}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    עיר:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.city || "לא צוין"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                    כתובת:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.address || 
                     `${selectedVolunteerDetails.streetName || ""} ${selectedVolunteerDetails.houseNumber || ""}`.trim() || 
                     "לא צוין"}
                  </Typography>
                </Paper>
              </Box>

              <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                  מספר זהות:
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                  {selectedVolunteerDetails.idNumber || "לא צוין"}
                </Typography>
              </Paper>

              {/* Experience Information */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3 }}>
                <Paper sx={{ p: 2, background: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
                    ניסיון בפינוי נחילי דבורים:
                  </Typography>
                  <Chip 
                    label={selectedVolunteerDetails.beeExperience === true ? "כן" : 
                           selectedVolunteerDetails.beeExperience === false ? "לא" : 
                           selectedVolunteerDetails.beeExperience || "לא צוין"}
                    color={selectedVolunteerDetails.beeExperience === true ? "success" : "default"}
                    sx={{ fontWeight: 500 }}
                  />
                </Paper>

                <Paper sx={{ p: 2, background: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
                    ניסיון בגידול דבורים:
                  </Typography>
                  <Chip 
                    label={selectedVolunteerDetails.beekeepingExperience === true ? "כן" : 
                           selectedVolunteerDetails.beekeepingExperience === false ? "לא" : 
                           selectedVolunteerDetails.beekeepingExperience || "לא צוין"}
                    color={selectedVolunteerDetails.beekeepingExperience === true ? "success" : "default"}
                    sx={{ fontWeight: 500 }}
                  />
                </Paper>

                <Paper sx={{ p: 2, background: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
                    עבר הדרכות:
                  </Typography>
                  <Chip 
                    label={selectedVolunteerDetails.hasTraining === true ? "כן" : 
                           selectedVolunteerDetails.hasTraining === false ? "לא" : "לא צוין"}
                    color={selectedVolunteerDetails.hasTraining === true ? "success" : "default"}
                    sx={{ fontWeight: 500 }}
                  />
                </Paper>

                <Paper sx={{ p: 2, background: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
                    היתר עבודה בגובה:
                  </Typography>
                  <Chip 
                    label={selectedVolunteerDetails.heightPermit === true ? "כן" : 
                           selectedVolunteerDetails.heightPermit === false ? "לא" : "לא צוין"}
                    color={selectedVolunteerDetails.heightPermit === true ? "success" : "default"}
                    sx={{ fontWeight: 500 }}
                  />
                </Paper>
              </Box>

              <Paper sx={{ p: 2, background: "#f8f9fa", borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#495057", mb: 1 }}>
                  פרטים נוספים:
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: "1.1em", 
                    color: "#333",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    minHeight: "60px",
                    maxHeight: "200px",
                    overflow: "auto",
                    p: 2,
                    background: "white",
                    borderRadius: 1,
                    border: "1px solid #e9ecef",
                  }}
                >
                  {selectedVolunteerDetails.additionalDetails || "אין פרטים נוספים"}
                </Typography>
              </Paper>

              {/* Registration Information */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Paper sx={{ p: 2, background: "#fff3e0", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#f57c00", mb: 1 }}>
                    תאריך הרשמה:
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1.1em", color: "#333" }}>
                    {selectedVolunteerDetails.signupDate ||
                     (selectedVolunteerDetails.createdAt 
                      ? new Date(selectedVolunteerDetails.createdAt).toLocaleDateString("he-IL")
                      : "לא זמין")}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, background: "#fff3e0", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#f57c00", mb: 1 }}>
                    סטטוס:
                  </Typography>
                  <Chip 
                    label={selectedVolunteerDetails.isActive !== false ? "מתנדב פעיל" : "מתנדב לא פעיל"}
                    color={selectedVolunteerDetails.isActive !== false ? "success" : "error"}
                    sx={{ fontWeight: 500 }}
                  />
                </Paper>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, justifyContent: "center" }}>
            <Button
              onClick={handleCloseVolunteerDetails}
              variant="contained"
              size="large"
              sx={{
                minWidth: 120,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              סגור
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
