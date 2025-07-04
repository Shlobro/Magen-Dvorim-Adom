"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import axios from "axios"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import beeIconUrl from "../assets/cuteBeeInquiry.png"
import { collection, getDocs, getDoc, doc, updateDoc, query, where, GeoPoint, Timestamp } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { useLocation, useNavigate } from "react-router-dom"
import { useNotification } from "../contexts/NotificationContext"
import { useAuth } from "../contexts/AuthContext"
import { takeOwnership, releaseOwnership } from "../services/inquiryApi"
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Avatar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Box,
  IconButton,
  Fade,
  Grow,
  Paper,
  Collapse,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material"
import {
  LocationOn,
  People,
  Phone,
  CalendarToday,
  Message,
  Close,
  Menu,
  CheckCircle,
  Schedule,
  Navigation,
  ExpandMore,
  FilterList,
  Search,
} from "@mui/icons-material"

// Custom Bee Icon
const beeIcon = new L.Icon({
  iconUrl: beeIconUrl,
  iconSize: [48, 48],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const NAVBAR_HEIGHT = 65
const isMobile = window.innerWidth <= 768

export default function VolunteerMap() {
  const [inquiries, setInquiries] = useState([])
  const [allInquiries, setAllInquiries] = useState([]) // Store all inquiries for filtering
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [availableVolunteers, setAvailableVolunteers] = useState([])
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([])
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 768)
  const [showInquiryDetails, setShowInquiryDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState("unassigned") // Default to unassigned
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState("") // Search filter for volunteers
  const [loadingVolunteers, setLoadingVolunteers] = useState(false) // Loading state for volunteers

  const mapRef = useRef()
  const location = useLocation()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showConfirmDialog } = useNotification()
  const { currentUser, userRole, loading: authLoading } = useAuth()

  const extractCoordinates = (data) => {
    let lat = null
    let lng = null
    if (data.location instanceof GeoPoint) {
      lat = data.location.latitude
      lng = data.location.longitude
    } else if (
      data.location &&
      typeof data.location === "object" &&
      data.location.latitude != null &&
      data.location.longitude != null
    ) {
      lat = data.location.latitude
      lng = data.location.longitude
    } else if (data.lat != null && data.lng != null) {
      lat = data.lat
      lng = data.lng
    }
    return { lat, lng }
  }

  const fetchInquiries = useCallback(async () => {
    try {
      const q = query(
        collection(db, "inquiry"),
        where("status", "in", ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב", "המתנדב בדרך"]),
      )
      const querySnapshot = await getDocs(q)
      const fetched = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        const { lat, lng } = extractCoordinates(data)
        return { id: doc.id, ...data, lat, lng }
      })

      // 1. Filter out bad coords
      const validInquiries = fetched.filter(
        (inquiry) => inquiry.lat != null && !isNaN(inquiry.lat) && inquiry.lng != null && !isNaN(inquiry.lng),
      )

      // 2. Collect all unique volunteer UIDs
      const volunteerUids = new Set()
      validInquiries.forEach((call) => {
        if (
          call.assignedVolunteers &&
          typeof call.assignedVolunteers === "string" &&
          call.assignedVolunteers.trim() !== ""
        ) {
          volunteerUids.add(call.assignedVolunteers)
        }
      })

      // 3. Fetch volunteer names
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
            console.error("Error fetching volunteer name:", uid, e)
          }
        }),
      )

      // 4. Sort by opening timestamp (oldest first)
      validInquiries.sort((a, b) => {
        const ta = a.timestamp?.toDate()?.getTime() || 0
        const tb = b.timestamp?.toDate()?.getTime() || 0
        return ta - tb
      })

      // 5. Assign sequential number and add volunteer names
      const numbered = validInquiries.map((inq, idx) => ({
        ...inq,
        seqNum: idx + 1,
        assignedVolunteerName: uidToVolunteerName[inq.assignedVolunteers] ?? "-",
      }))

      setAllInquiries(numbered)
    } catch (error) {
      console.error("Error fetching inquiries:", error)
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  // Filter inquiries based on status
  useEffect(() => {
    if (!allInquiries.length) return

    let filtered = []
    switch (statusFilter) {
      case "unassigned":
        filtered = allInquiries.filter(
          (inquiry) =>
            inquiry.status === "נפתחה פנייה (טופס מולא)" &&
            (!inquiry.assignedVolunteers || inquiry.assignedVolunteers === ""),
        )
        break
      case "assigned":
        filtered = allInquiries.filter(
          (inquiry) =>
            inquiry.status === "לפנייה שובץ מתנדב" || (inquiry.assignedVolunteers && inquiry.assignedVolunteers !== ""),
        )
        break
      case "in-progress":
        filtered = allInquiries.filter((inquiry) => inquiry.status === "המתנדב בדרך")
        break
      case "all":
      default:
        filtered = allInquiries
        break
    }

    setInquiries(filtered)
  }, [allInquiries, statusFilter])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const inquiryIdFromUrl = params.get("inquiryId")
    if (inquiryIdFromUrl && inquiries.length > 0) {
      const inquiryToSelect = inquiries.find((inc) => inc.id === inquiryIdFromUrl)
      if (inquiryToSelect) {
        setSelectedInquiry(inquiryToSelect)
        setVolunteerSearchTerm("") // Clear search when selecting a new inquiry
        if (mapRef.current && inquiryToSelect.lat != null && inquiryToSelect.lng != null) {
          mapRef.current.setView([inquiryToSelect.lat, inquiryToSelect.lng], 13)
        }
      } else {
        console.warn(`Inquiry with ID ${inquiryIdFromUrl} not found or already processed.`)
        navigate(location.pathname, { replace: true })
      }
    }
  }, [inquiries, location.search, navigate])

  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!selectedInquiry) {
        setAvailableVolunteers([])
        setLoadingVolunteers(false)
        return
      }
      if (
        selectedInquiry.lat == null ||
        isNaN(selectedInquiry.lat) ||
        selectedInquiry.lng == null ||
        isNaN(selectedInquiry.lng)
      ) {
        setAvailableVolunteers([])
        setLoadingVolunteers(false)
        return
      }
      
      setLoadingVolunteers(true)
      try {
        const response = await axios.post("/api/users/queryNear", {
          lat: selectedInquiry.lat,
          lng: selectedInquiry.lng,
          radius: 200, // Large radius to get all volunteers, sorted by score
        })
        setAvailableVolunteers(response.data)
      } catch (error) {
        console.error("Error fetching available volunteers:", error)
        setAvailableVolunteers([])
      } finally {
        setLoadingVolunteers(false)
      }
    }
    fetchVolunteers()
  }, [selectedInquiry])
  const assignToInquiry = async () => {
    if (!selectedInquiry || selectedVolunteerIds.length === 0) {
      showWarning("אנא בחר פנייה ומתנדב לשיבוץ.")
      return
    }

    // Check if coordinator has ownership of this inquiry
    if (!selectedInquiry.coordinatorId || selectedInquiry.coordinatorId !== currentUser?.uid) {
      showError("לא ניתן לשבץ מתנדב ללא בעלות על הפנייה. יש לקחת בעלות על הפנייה תחילה.")
      return
    }

    const inquiryId = selectedInquiry.id
    const volunteerToAssignId = selectedVolunteerIds[0]

    const confirmed = await showConfirmDialog({
      title: "אישור שיבוץ מתנדב",
      message: `האם אתה בטוח שברצונך לשבץ את המתנדב לפנייה זו?`,
      confirmText: "שבץ מתנדב",
      cancelText: "ביטול",
      severity: "info",
    })
    if (!confirmed) return
    try {
      const inquiryRef = doc(db, "inquiry", inquiryId)
      await updateDoc(inquiryRef, {
        assignedVolunteers: volunteerToAssignId,
        status: "לפנייה שובץ מתנדב",
        assignedTimestamp: Timestamp.now(),
      })
      showSuccess("מתנדב שובץ בהצלחה לפנייה!")
      fetchInquiries()
      setSelectedInquiry(null)
      setVolunteerSearchTerm("") // Clear search when clearing selection
      setAvailableVolunteers([])
      setSelectedVolunteerIds([])
      navigate("/dashboard")
    } catch (error) {
      console.error("שגיאה בשיבוץ מתנדב:", error)
      showError("נכשל בשיבוץ מתנדב. אנא נסה שוב.")
    }
  }

  function MapSetter() {
    const map = useMap()
    useEffect(() => {
      mapRef.current = map
      map.on("click", () => {
        setSelectedInquiry(null)
        setVolunteerSearchTerm("") // Clear search when clearing selection
        setSelectedVolunteerIds([])
        setAvailableVolunteers([])
        if (location.search.includes("inquiryId")) {
          navigate(location.pathname, { replace: true })
        }
      })
      return () => {
        map.off("click")
      }
    }, [map, navigate, location.pathname, location.search])
    return null
  }

  const isSelectedInquiryAssigned =
    selectedInquiry &&
    selectedInquiry.assignedVolunteers &&
    ((Array.isArray(selectedInquiry.assignedVolunteers) && selectedInquiry.assignedVolunteers.length > 0) ||
      (typeof selectedInquiry.assignedVolunteers === "string" && selectedInquiry.assignedVolunteers !== ""))

  const getStatusChip = (status) => {
    if (status === "לפנייה שובץ מתנדב") {
      return (
        <Chip
          icon={<CheckCircle />}
          label="שובץ מתנדב"
          color="success"
          variant="filled"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      )
    }
    return (
      <Chip
        icon={<Schedule />}
        label="ממתין לשיבוץ"
        color="warning"
        variant="filled"
        size="small"
        sx={{ fontWeight: 600 }}
      />
    )
  }

  // Handle taking ownership of an inquiry
  const handleTakeOwnership = async (inquiryId) => {
    if (!currentUser) {
      showError("שגיאה: משתמש לא מחובר")
      return
    }

    try {
      await takeOwnership(inquiryId, currentUser.uid)

      // Update the local state to reflect the ownership change
      setSelectedInquiry((prev) =>
        prev
          ? {
              ...prev,
              coordinatorId: currentUser.uid,
              coordinatorName: currentUser.displayName || currentUser.email || "רכז",
            }
          : prev,
      )

      // Also update the inquiries list
      setAllInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                coordinatorId: currentUser.uid,
                coordinatorName: currentUser.displayName || currentUser.email || "רכז",
              }
            : inquiry,
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

  // Handle releasing ownership of an inquiry
  const handleReleaseOwnership = async (inquiryId) => {
    if (!currentUser) {
      showError("שגיאה: משתמש לא מחובר")
      return
    }

    const confirmed = await showConfirmDialog({
      title: "שחרור בעלות על הפנייה",
      message:
        "האם אתה בטוח שברצונך לשחרר את הבעלות על הפנייה? הפנייה תחזור למאגר הפניות הזמינות לכל הרכזים.",
      confirmText: "שחרר בעלות",
      cancelText: "ביטול",
      severity: "warning",
    })

    if (!confirmed) return

    try {
      await releaseOwnership(inquiryId, currentUser.uid)

      // Update the local state to reflect the ownership release
      setSelectedInquiry((prev) =>
        prev
          ? {
              ...prev,
              coordinatorId: null,
              coordinatorName: "-",
            }
          : prev,
      )

      // Also update the inquiries list
      setAllInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                coordinatorId: null,
                coordinatorName: "-",
              }
            : inquiry,
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

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        fontFamily: '"Segoe UI", sans-serif',
        justifyContent: "flex-start",
      }}
    >
      {/* Map Section */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Header with Filter */}
        <Paper
          elevation={4}
          sx={{
            p: 1.5,
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            color: "white",
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            {/* התיבה הריקה - עכשיו בצד ימין */}
            <Box sx={{ flex: "0 0 auto", width: "200px" }}></Box>

            {/* הכותרת - נשארת במרכז */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                textAlign: "center",
                flex: 1,
                justifyContent: "center",
              }}
            >
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 40, height: 40 }}>
                <Navigation sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  מפת נחילי דבורים לשיבוץ מתנדבים
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  מערכת ניהול וחלוקת משימות
                </Typography>
              </Box>
            </Box>

            {/* תיבת הסינון - עכשיו בצד שמאל */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: "0 0 auto" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 32, height: 32 }}>
                <FilterList sx={{ fontSize: 16 }} />
              </Avatar>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: "text.primary",
                    fontSize: "0.875rem",
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "1px solid rgba(255,255,255,0.5)",
                    },
                  }}
                  displayEmpty
                >
                  <MenuItem value="unassigned">מתנדב לא שובץ</MenuItem>
                  <MenuItem value="assigned">מתנדב שובץ</MenuItem>
                  <MenuItem value="in-progress">בדרך</MenuItem>
                  <MenuItem value="all">הכל</MenuItem>
                </Select>
              </FormControl>
              <Chip
                label={`${inquiries.length} פניות`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Toggle Button */}
        <IconButton
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          sx={{
            position: "fixed",
            top: NAVBAR_HEIGHT + 20,
            right: isSidebarVisible && !isMobile ? "365px" : "16px",
            zIndex: 1002,
            width: 48,
            height: 48,
            bgcolor: "#1976d2",
            color: "white",
            boxShadow: 3,
            transition: "right 0.3s ease-in-out",
            "&:hover": {
              bgcolor: "#1565c0",
            },
          }}
        >
          {isSidebarVisible ? <Close /> : <Menu />}
        </IconButton>

        {/* Map Container */}
        <Box sx={{ flex: 1 }}>
          <MapContainer
            center={[31.0461, 34.8516]}
            zoom={8}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapSetter />
            {inquiries.map((inquiry) =>
              inquiry.lat != null && inquiry.lng != null && !isNaN(inquiry.lat) && !isNaN(inquiry.lng) ? (
                <Marker
                  key={inquiry.id}
                  position={[inquiry.lat, inquiry.lng]}
                  icon={beeIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedInquiry(inquiry)
                      setVolunteerSearchTerm("") // Clear search when selecting a new inquiry
                      setSelectedVolunteerIds([])
                      if (!isSidebarVisible) setIsSidebarVisible(true)
                    },
                  }}
                >
                  <Popup>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {inquiry.address}, {inquiry.city || ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        סטטוס: {inquiry.status}
                      </Typography>
                      {inquiry.notes && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          הערות: {inquiry.notes}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {inquiry.assignedVolunteerName && inquiry.assignedVolunteerName !== "-"
                          ? `שם המתנדב: ${inquiry.assignedVolunteerName}`
                          : "שם המתנדב: טרם שובץ מתנדב"}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              ) : null
            )}
            {availableVolunteers.map((volunteer) =>
              volunteer.lat != null && volunteer.lng != null && !isNaN(volunteer.lat) && !isNaN(volunteer.lng) ? (
                <Marker key={volunteer.id} position={[volunteer.lat, volunteer.lng]}>
                  <Popup>
                    <Box sx={{ p: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        מתנדב: {volunteer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        מרחק: {volunteer.distance?.toFixed(1)} ק"מ
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        ציון כולל: {volunteer.score?.toFixed(1)}/100
                      </Typography>

                      {/* Score breakdown */}
                      <Box sx={{ mt: 1, fontSize: "0.75rem" }}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          ניסיון פינוי: {volunteer.beeExperience ? "✓" : "✗"}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          ניסיון גידול: {volunteer.beekeepingExperience ? "✓" : "✗"}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          הדרכות: {volunteer.hasTraining ? "✓" : "✗"}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          היתר גובה: {volunteer.heightPermit ? "✓" : "✗"}
                        </Typography>
                      </Box>
                    </Box>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </Box>
      </Box>

      {/* Sidebar */}
      <Paper
        elevation={8}
        sx={{
          width: isMobile ? "calc(100% - 60px)" : "350px",
          minWidth: "300px",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          right: 0,
          top: `${NAVBAR_HEIGHT}px`,
          height: `calc(100% - ${NAVBAR_HEIGHT}px)`,
          zIndex: 1001,
          transform: isSidebarVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out",
          bgcolor: "background.paper",
        }}
      >
        {selectedInquiry ? (
          <>
            {/* Sidebar Content */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Status Chip */}
                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  {getStatusChip(selectedInquiry.status)}
                </Box>

                {/* Inquiry Details Card - Collapsible */}
                <Grow in timeout={600}>
                  <Card elevation={2} sx={{ borderRadius: 3 }}>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                          <LocationOn sx={{ fontSize: 20 }} />
                        </Avatar>
                      }
                      title={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            width: "100%",
                            mr: 1,
                          }}
                          onClick={() => setShowInquiryDetails(!showInquiryDetails)}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                              פרטי הפנייה
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                              מס' {selectedInquiry.seqNum}
                            </Typography>
                          </Box>
                          <ExpandMore
                            sx={{
                              transform: showInquiryDetails ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.3s ease-in-out",
                              color: "text.secondary",
                            }}
                          />
                        </Box>
                      }
                      sx={{ pb: 1, "& .MuiCardHeader-content": { ml: 2 } }}
                      onClick={() => setShowInquiryDetails(!showInquiryDetails)}
                    />
                    <Collapse in={showInquiryDetails}>
                      <CardContent sx={{ pt: 0 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <LocationOn sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                כתובת
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedInquiry.address}, {selectedInquiry.city || ""}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <Phone sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                פרטי התקשרות
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                {selectedInquiry.phoneNumber}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <CalendarToday sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                תאריך פתיחה
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedInquiry.timestamp
                                  ? (() => {
                                      // Handle different timestamp formats
                                      if (typeof selectedInquiry.timestamp.toDate === "function") {
                                        return selectedInquiry.timestamp.toDate().toLocaleString("he-IL")
                                      } else if (typeof selectedInquiry.timestamp === "string" || selectedInquiry.timestamp instanceof Date) {
                                        return new Date(selectedInquiry.timestamp).toLocaleString("he-IL")
                                      }
                                      return "אין מידע"
                                    })()
                                  : "אין מידע"}
                              </Typography>
                            </Box>
                          </Box>

                          {selectedInquiry.notes && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                              <Message sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  הערות
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {selectedInquiry.notes}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <People sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                מתנדב משובץ
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {isSelectedInquiryAssigned ? selectedInquiry.assignedVolunteerName : "טרם שובץ"}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <CheckCircle sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                רכז אחראי
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color={selectedInquiry.coordinatorId === currentUser?.uid ? "success.main" : "text.secondary"}
                                sx={{ fontWeight: selectedInquiry.coordinatorId === currentUser?.uid ? "bold" : "normal" }}
                              >
                                {selectedInquiry.coordinatorId 
                                  ? (selectedInquiry.coordinatorId === currentUser?.uid 
                                      ? `${selectedInquiry.coordinatorName || "אתה"} (בבעלותך)` 
                                      : selectedInquiry.coordinatorName || "רכז אחר")
                                  : "אין רכז אחראי"
                                }
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Collapse>
                  </Card>
                </Grow>

                {/* Ownership Management / Available Volunteers Card */}
                <Grow in timeout={800}>
                  <Card elevation={2} sx={{ borderRadius: 3 }}>
                    {/* Check if user has ownership of the selected inquiry */}
                    {!selectedInquiry.coordinatorId || selectedInquiry.coordinatorId !== currentUser?.uid ? (
                      // Show ownership management when user doesn't have ownership
                      <>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: "warning.main", width: 40, height: 40 }}>
                              <People sx={{ fontSize: 20 }} />
                            </Avatar>
                          }
                          title={
                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                              נדרשת בעלות על הפנייה
                            </Typography>
                          }
                          sx={{ 
                            pb: 2, 
                            "& .MuiCardHeader-content": { ml: 2 },
                            "& .MuiCardHeader-avatar": { mr: 1 }
                          }}
                        />
                        <CardContent sx={{ pt: 0, pb: 3 }}>
                          <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                              כדי לשבץ מתנדב לפנייה זו, עליך תחילה לקחת בעלות עליה.
                              {selectedInquiry.coordinatorId && (
                                <>
                                  <br />
                                  <Box component="span" sx={{ mt: 1, display: "inline-block" }}>
                                    <strong>הפנייה נמצאת בבעלות של:</strong> {selectedInquiry.coordinatorName || "רכז אחר"}
                                  </Box>
                                </>
                              )}
                            </Typography>
                          </Alert>
                          {!selectedInquiry.coordinatorId && (
                            <Button
                              onClick={() => handleTakeOwnership(selectedInquiry.id)}
                              variant="contained"
                              color="primary"
                              size="large"
                              fullWidth
                              startIcon={<CheckCircle sx={{ mr: 1 }} />}
                              sx={{ 
                                fontWeight: 600,
                                py: 1.5,
                                gap: 1.5,
                                "& .MuiButton-startIcon": {
                                  marginLeft: 0,
                                  marginRight: 1
                                }
                              }}
                            >
                              קח בעלות על הפנייה
                            </Button>
                          )}
                          {selectedInquiry.coordinatorId && selectedInquiry.coordinatorId !== currentUser?.uid && (
                            <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
                              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                הפנייה כבר בבעלות של רכז אחר. לא ניתן לשבץ מתנדב.
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </>
                    ) : (
                      // Show volunteer assignment when user has ownership
                      <>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: "success.main", width: 40, height: 40 }}>
                              <People sx={{ fontSize: 20 }} />
                            </Avatar>
                          }
                          title={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mr: 1 }}>
                                מתנדבים זמינים (ממוינים לפי ציון)
                              </Typography>
                              {loadingVolunteers ? (
                                <Chip label="טוען..." size="small" color="default" />
                              ) : (
                                <Chip label={availableVolunteers.length} size="small" color="primary" />
                              )}
                            </Box>
                          }
                          sx={{ 
                            pb: 2, 
                            "& .MuiCardHeader-content": { ml: 2 },
                            "& .MuiCardHeader-avatar": { mr: 1 }
                          }}
                        />
                        <CardContent sx={{ pt: 0 }}>
                          {loadingVolunteers ? (
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
                              <CircularProgress size={40} sx={{ mb: 2 }} />
                              <Typography variant="body2" color="text.secondary">
                                מחפש מתנדבים זמינים...
                              </Typography>
                            </Box>
                          ) : availableVolunteers.length > 0 ? (
                            <>
                              {/* Search input for filtering volunteers */}
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="חיפוש מתנדב לפי שם..."
                                value={volunteerSearchTerm}
                                onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                                InputProps={{
                                  startAdornment: <Search sx={{ color: "action.active", mr: 1, my: 0.5 }} />,
                                }}
                                sx={{ mb: 2 }}
                              />
                              {(() => {
                                const filteredVolunteers = availableVolunteers.filter((volunteer) =>
                                  volunteerSearchTerm === "" ||
                                  volunteer.name.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
                                );

                                return filteredVolunteers.length > 0 ? (
                                  <FormControl component="fieldset" fullWidth>
                                    <RadioGroup
                                      value={selectedVolunteerIds[0] || ""}
                                      onChange={(e) => setSelectedVolunteerIds([e.target.value])}
                                    >
                                      {filteredVolunteers.map((volunteer) => (
                                        <Paper
                                          key={volunteer.id}
                                          elevation={selectedVolunteerIds[0] === volunteer.id ? 3 : 1}
                                          sx={{
                                            p: 2,
                                            mb: 1,
                                            borderRadius: 2,
                                            bgcolor:
                                              selectedVolunteerIds[0] === volunteer.id ? "primary.light" : "background.paper",
                                            opacity: isSelectedInquiryAssigned ? 0.5 : 1,
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                              elevation: 2,
                                              bgcolor: selectedVolunteerIds[0] === volunteer.id ? "primary.light" : "grey.50",
                                            },
                                          }}
                                        >
                                          <FormControlLabel
                                            value={volunteer.id}
                                            control={<Radio disabled={isSelectedInquiryAssigned} />}
                                            label={
                                              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                <Box sx={{ flex: 1 }}>
                                                  <Typography variant="subtitle2" fontWeight="bold">
                                                    {volunteer.name}
                                                  </Typography>
                                                  <Typography variant="body2" color="text.secondary">
                                                    מרחק: {volunteer.distance?.toFixed(1)} ק"מ
                                                  </Typography>

                                                  {/* Experience indicators */}
                                                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                                                    {volunteer.beeExperience && (
                                                      <Chip
                                                        label="פינוי נחילים"
                                                        size="small"
                                                        color="success"
                                                        variant="outlined"
                                                        sx={{ fontSize: "0.65rem", height: "18px" }}
                                                      />
                                                    )}
                                                    {volunteer.beekeepingExperience && (
                                                      <Chip
                                                        label="גידול דבורים"
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                        sx={{ fontSize: "0.65rem", height: "18px" }}
                                                      />
                                                    )}
                                                    {volunteer.hasTraining && (
                                                      <Chip
                                                        label="הדרכות"
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontSize: "0.65rem", height: "18px" }}
                                                      />
                                                    )}
                                                    {volunteer.heightPermit && (
                                                      <Chip
                                                        label="היתר גובה"
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                        sx={{ fontSize: "0.65rem", height: "18px" }}
                                                      />
                                                    )}
                                                  </Box>
                                                </Box>
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    ml: 1,
                                                  }}
                                                >
                                                  <Chip
                                                    label={`${volunteer.score?.toFixed(1)}/100`}
                                                    size="small"
                                                    color={
                                                      volunteer.score >= 80
                                                        ? "success"
                                                        : volunteer.score >= 60
                                                        ? "warning"
                                                        : "default"
                                                    }
                                                    sx={{ fontFamily: "monospace", fontWeight: "bold" }}
                                                  />
                                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    ציון התאמה
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            }
                                            sx={{ width: "100%", m: 0 }}
                                          />
                                        </Paper>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                ) : (
                                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    <Typography variant="body2">
                                      לא נמצאו מתנדבים התואמים לחיפוש "{volunteerSearchTerm}"
                                    </Typography>
                                  </Alert>
                                )
                              })()}
                            </>
                          ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                              <Typography variant="body2">לא נמצאו מתנדבים זמינים באזור.</Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </>
                    )}
                  </Card>
                </Grow>
              </Box>
            </Box>

            {/* Sidebar Actions */}
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {/* Only show assignment button if user has ownership and inquiry is not assigned */}
              {selectedInquiry.coordinatorId === currentUser?.uid && !isSelectedInquiryAssigned && (
                <Button
                  onClick={assignToInquiry}
                  disabled={!selectedInquiry || selectedVolunteerIds.length === 0}
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircle />}
                  sx={{ fontWeight: 600, gap: 1 }}
                >
                  שבץ מתנדב לקריאה
                </Button>
              )}
              <Button
                onClick={() => {
                  setSelectedInquiry(null)
                  setVolunteerSearchTerm("") // Clear search when clearing selection
                  setSelectedVolunteerIds([])
                  setAvailableVolunteers([])
                  if (location.search.includes("inquiryId")) {
                    navigate(location.pathname, { replace: true })
                  }
                }}
                variant="outlined"
                size="large"
                startIcon={<Close />}
              >
                בטל בחירה
              </Button>
            </Box>
          </>
        ) : (
          <Fade in timeout={600}>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
              }}
            >
              <Box>
                <Avatar sx={{ mx: "auto", mb: 3, width: 64, height: 64, bgcolor: "grey.100" }}>
                  <LocationOn sx={{ fontSize: 32, color: "grey.400" }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  בחר פנייה במפה
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>
                  לחץ על מרקר של נחיל במפה כדי לראות פרטים ולשבץ מתנדב.
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </Paper>
    </Box>
  )
}
