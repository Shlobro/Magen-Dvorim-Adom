import { useState, useEffect } from "react"
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Paper,
  Chip,
  Divider,
  Avatar,
  LinearProgress,
  Fade,
  Grow,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material"
import { TrendingUp, Assessment, LocationOn, People, CheckCircle, PendingActions, BarChart, Warning, Schedule, CalendarToday, AccessTime } from "@mui/icons-material"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js"
import { useAuth } from "../contexts/AuthContext"
import { useNotification } from "../contexts/NotificationContext"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebaseConfig"

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend)

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    total: 0, 
    open: 0, 
    closed: 0, 
    resolved: 0, 
    unresolvable: 0, 
    assigned: 0, 
    avgResponseTime: 0 
  })
  const [rawInquiries, setRawInquiries] = useState([])
  const [rawUsers, setRawUsers] = useState([])
  
  // Time period state for statistics
  const [statsPeriod, setStatsPeriod] = useState("all")

  // Calculate statistics for the given inquiries
  const calculateStats = (inquiries) => {
    const total = inquiries.length
    const closed = inquiries.filter((i) => i.status === "הפנייה נסגרה").length
    const open = total - closed

    // Calculate additional statistics
    const resolvedInquiries = inquiries.filter(inquiry => 
      inquiry.status === "הפנייה נסגרה" && inquiry.closureReason === "נפתר עצמאית"
    ).length
    
    const unresolvableInquiries = inquiries.filter(inquiry => 
      inquiry.status === "הפנייה נסגרה" && 
      ["לא ניתן לטפל", "מיקום לא נגיש", "מתנדב לא הגיע"].includes(inquiry.closureReason)
    ).length

    const assignedInquiries = inquiries.filter(inquiry => 
      inquiry.assignedVolunteers && 
      ((Array.isArray(inquiry.assignedVolunteers) && inquiry.assignedVolunteers.length > 0) ||
       (typeof inquiry.assignedVolunteers === "string" && inquiry.assignedVolunteers !== ""))
    ).length

    const avgResponseTime = inquiries.length > 0 ? 
      Math.round(inquiries.reduce((sum, inquiry) => {
        if (inquiry.timestamp && inquiry.assignedAt) {
          const start = parseTimestamp(inquiry.timestamp)
          const assigned = parseTimestamp(inquiry.assignedAt)
          if (start && assigned) {
            return sum + (assigned - start) / (1000 * 60 * 60) // hours
          }
        }
        return sum
      }, 0) / inquiries.length) : 0

    return { 
      total, 
      open, 
      closed, 
      resolved: resolvedInquiries,
      unresolvable: unresolvableInquiries,
      assigned: assignedInquiries,
      avgResponseTime
    }
  }

  // Update stats when period changes
  useEffect(() => {
    if (rawInquiries.length > 0) {
      const filteredInquiries = filterByTimePeriod(rawInquiries, statsPeriod)
      const newStats = calculateStats(filteredInquiries)
      setStats(newStats)
    }
  }, [statsPeriod, rawInquiries])

  const { userRole, loading: authLoading } = useAuth()
  const { showError } = useNotification()

  useEffect(() => {
    if (!authLoading && userRole === 1) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // Fetch inquiries
          const snap = await getDocs(collection(db, "inquiry"))
          const inquiries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

          // Fetch users
          const usersSnap = await getDocs(collection(db, "user"))
          const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

          setRawInquiries(inquiries)
          setRawUsers(users)

          // Calculate initial stats for the selected period
          const filteredInquiries = filterByTimePeriod(inquiries, statsPeriod)
          const initialStats = calculateStats(filteredInquiries)
          setStats(initialStats)        } catch (e) {
          console.error(e)
          showError("אירעה שגיאה בטעינת הנתונים.")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [authLoading, userRole])

  // Helper function to parse different timestamp formats
  const parseTimestamp = (timestamp) => {
    if (!timestamp) return null

    // If it's a Firestore Timestamp object
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate()
    }

    // If it's an ISO string
    if (typeof timestamp === "string") {
      return new Date(timestamp)
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp
    }

    return null
  }

  // Helper function to filter data by time period
  const filterByTimePeriod = (inquiries, period) => {
    const now = new Date()
    const filtered = inquiries.filter((inquiry) => {
      const inquiryDate = parseTimestamp(inquiry.timestamp)

      if (!inquiryDate) return false

      switch (period) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return inquiryDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return inquiryDate >= monthAgo
        case "year":
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return inquiryDate >= yearAgo
        default:
          return true
      }
    })

    return filtered
  }

  // Generate chart data for seasonal trends (by month across all years)
  const generateSeasonalChart = () => {
    const monthNames = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ]
    const monthCount = new Array(12).fill(0)

    rawInquiries.forEach((inquiry) => {
      const date = parseTimestamp(inquiry.timestamp)
      if (date) {
        monthCount[date.getMonth()]++
      }
    })

    return {
      labels: monthNames,
      datasets: [
        {
          label: "מספר פניות",
          data: monthCount,
          backgroundColor: "rgba(76, 175, 80, 0.8)",
          borderColor: "rgba(76, 175, 80, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  // Generate chart data for closure reasons
  const generateClosureReasonsChart = () => {
    const closureReasons = {}
    const closedInquiries = rawInquiries.filter(inquiry => 
      inquiry.status === "הפנייה נסגרה" && inquiry.closureReason
    )

    closedInquiries.forEach((inquiry) => {
      const reason = inquiry.closureReason || "לא צוין"
      closureReasons[reason] = (closureReasons[reason] || 0) + 1
    })

    const sortedReasons = Object.entries(closureReasons).sort((a, b) => b[1] - a[1])

    return {
      labels: sortedReasons.map(([reason]) => reason),
      datasets: [
        {
          label: "מספר פניות",
          data: sortedReasons.map(([, count]) => count),
          backgroundColor: [
            "rgba(76, 175, 80, 0.8)",   // נפתר עצמאית - ירוק
            "rgba(244, 67, 54, 0.8)",   // לא ניתן לטפל - אדום
            "rgba(255, 152, 0, 0.8)",   // מיקום לא נגיש - כתום
            "rgba(156, 39, 176, 0.8)",  // מתנדב לא הגיע - סגול
            "rgba(96, 125, 139, 0.8)",  // אחר - אפור
          ],
          borderColor: [
            "rgba(76, 175, 80, 1)",
            "rgba(244, 67, 54, 1)",
            "rgba(255, 152, 0, 1)",
            "rgba(156, 39, 176, 1)",
            "rgba(96, 125, 139, 1)",
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  // Generate chart data for peak hours
  const generatePeakHoursChart = () => {
    const hourCount = new Array(24).fill(0)
    const hourLabels = []
    
    // Create hour labels in Hebrew
    for (let i = 0; i < 24; i++) {
      hourLabels.push(`${i.toString().padStart(2, '0')}:00`)
    }

    rawInquiries.forEach((inquiry) => {
      const date = parseTimestamp(inquiry.timestamp)
      if (date) {
        hourCount[date.getHours()]++
      }
    })

    return {
      labels: hourLabels,
      datasets: [
        {
          label: "מספר פניות",
          data: hourCount,
          backgroundColor: "rgba(33, 150, 243, 0.8)",
          borderColor: "rgba(33, 150, 243, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  // Generate chart data for day of week patterns
  const generateDayOfWeekChart = () => {
    const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
    const dayCount = new Array(7).fill(0)

    rawInquiries.forEach((inquiry) => {
      const date = parseTimestamp(inquiry.timestamp)
      if (date) {
        dayCount[date.getDay()]++
      }
    })

    return {
      labels: dayNames,
      datasets: [
        {
          label: "מספר פניות",
          data: dayCount,
          backgroundColor: "rgba(103, 58, 183, 0.8)",
          borderColor: "rgba(103, 58, 183, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  const chartOpts = (title, color) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 14,
            weight: "500",
          },
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: "600",
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  })

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            טוען פרטי אימות...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (userRole !== 1) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            fontSize: "1.1rem",
            py: 3,
          }}
        >
          אין לך הרשאה לצפות בדף זה. גישה נדחתה.
        </Alert>
      </Container>
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
                <Assessment sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  דף תובנות רכז/ת
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: "auto" }}>
              סקירה מקיפה של נתוני הפניות במערכת עם ניתוח מגמות ותובנות עסקיות
            </Typography>
          </Paper>
        </Fade>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress size={80} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
              טוען נתונים...
            </Typography>            <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: "auto", borderRadius: 2 }} />
          </Box>
        ) : (
          <>
            {/* Time Period Filter */}
            <Fade in timeout={600}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: "text.primary", fontWeight: 600 }}>
                  בחר תקופת זמן לסטטיסטיקות
                </Typography>
                <ToggleButtonGroup
                  value={statsPeriod}
                  exclusive
                  onChange={(event, newPeriod) => {
                    if (newPeriod !== null) {
                      setStatsPeriod(newPeriod)
                    }
                  }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px !important',
                      mx: 0.5,
                      px: 3,
                      py: 1,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#666',
                      '&.Mui-selected': {
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: '2px solid #1976d2',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="week">
                    שבוע אחרון
                  </ToggleButton>
                  <ToggleButton value="month">
                    חודש אחרון
                  </ToggleButton>
                  <ToggleButton value="year">
                    שנה אחרונה
                  </ToggleButton>
                  <ToggleButton value="all">
                    כל הזמנים
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            </Fade>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {[
                {
                  label: 'סה"כ פניות',
                  value: stats.total,
                  color: "#1976d2",
                  bgColor: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  icon: <BarChart sx={{ fontSize: 40 }} />,
                  description: "כלל הפניות במערכת"
                },
                {
                  label: "פניות פתוחות",
                  value: stats.open,
                  color: "#ff9800",
                  bgColor: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                  icon: <PendingActions sx={{ fontSize: 40 }} />,
                  description: "ממתינות לטיפול"
                },
                {
                  label: "נפתרו בהצלחה",
                  value: stats.resolved,
                  color: "#4caf50",
                  bgColor: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
                  icon: <CheckCircle sx={{ fontSize: 40 }} />,
                  description: "טופלו בהצלחה"
                },
                {
                  label: "שובצו למתנדבים",
                  value: stats.assigned,
                  color: "#9c27b0",
                  bgColor: "linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)",
                  icon: <People sx={{ fontSize: 40 }} />,
                  description: "שובצו למתנדבים"
                },
                {
                  label: "לא ניתן לטפל",
                  value: stats.unresolvable,
                  color: "#f44336",
                  bgColor: "linear-gradient(135deg, #f44336 0%, #ef5350 100%)",
                  icon: <Warning sx={{ fontSize: 40 }} />,
                  description: "נסגרו ללא פתרון"
                },
                {
                  label: "זמן תגובה ממוצע",
                  value: `${stats.avgResponseTime}h`,
                  color: "#00bcd4",
                  bgColor: "linear-gradient(135deg, #00bcd4 0%, #4dd0e1 100%)",
                  icon: <TrendingUp sx={{ fontSize: 40 }} />,
                  description: "עד שיבוץ מתנדב"
                },
              ].map(({ label, value, color, bgColor, icon, description }, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={label}>
                  <Grow in timeout={600 + index * 200}>
                    <Card
                      elevation={8}
                      sx={{
                        borderRadius: 4,
                        background: bgColor,
                        color: "white",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: "center" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56, mb: 2 }}>
                            {icon}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold" sx={{ opacity: 0.9, mb: 1, fontSize: "0.9rem" }}>
                            {label}
                          </Typography>
                          <Typography variant="h3" fontWeight="bold" sx={{ fontSize: "1.8rem" }}>
                            {typeof value === 'string' ? value : value.toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: "0.8rem" }}>
                          {description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 4 }}>
              <Chip
                label="תובנות מתקדמות לניהול הפעילות"
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                }}
              />
            </Divider>

            {/* Charts Section */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Seasonal Trends Chart */}
              <Box>
                <Grow in timeout={800}>
                  <Card
                    elevation={6}
                    sx={{
                      borderRadius: 4,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #4caf5015 0%, #4caf5005 100%)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: "#4caf50", width: 48, height: 48 }}>
                          <CalendarToday />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                            מגמות עונתיות - פעילות דבורים לפי חודש
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            זיהוי עונות השיא לפעילות דבורים ותכנון משאבים בהתאם
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      {rawInquiries.length > 0 ? (
                        <Box sx={{ height: 400 }}>
                          <Bar
                            data={generateSeasonalChart()}
                            options={chartOpts("מגמות עונתיות", "#4caf50")}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            height: 400,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            color: "text.secondary",
                          }}
                        >
                          <Avatar sx={{ bgcolor: "grey.100", width: 80, height: 80, mb: 2 }}>
                            <CalendarToday />
                          </Avatar>
                          <Typography variant="h6">אין נתונים זמינים עבור מגמות עונתיות</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Box>

              {/* Closure Reasons Chart */}
              <Box>
                <Grow in timeout={1000}>
                  <Card
                    elevation={6}
                    sx={{
                      borderRadius: 4,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #ff980015 0%, #ff980005 100%)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: "#ff9800", width: 48, height: 48 }}>
                          <Assessment />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                            סיבות סגירת פניות
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ניתוח סיבות סגירת פניות לזיהוי בעיות תפעוליות ושיפור השירות
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      {rawInquiries.filter(i => i.status === "הפנייה נסגרה").length > 0 ? (
                        <Box sx={{ height: 400 }}>
                          <Bar
                            data={generateClosureReasonsChart()}
                            options={chartOpts("סיבות סגירת פניות", "#ff9800")}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            height: 400,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            color: "text.secondary",
                          }}
                        >
                          <Avatar sx={{ bgcolor: "grey.100", width: 80, height: 80, mb: 2 }}>
                            <Assessment />
                          </Avatar>
                          <Typography variant="h6">אין נתונים זמינים עבור סיבות סגירה</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Box>

              {/* Peak Hours Charts */}
              <Grid container spacing={3}>
                {/* Peak Hours Chart */}
                <Grid item xs={12} md={6}>
                  <Grow in timeout={1200}>
                    <Card
                      elevation={6}
                      sx={{
                        borderRadius: 4,
                        height: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          p: 3,
                          background: "linear-gradient(135deg, #2196f315 0%, #2196f305 100%)",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#2196f3", width: 48, height: 48 }}>
                            <AccessTime />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight="bold" color="text.primary">
                              שעות השיא
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              זמני היום הפעילים ביותר
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <CardContent sx={{ p: 4 }}>
                        {rawInquiries.length > 0 ? (
                          <Box sx={{ height: 350 }}>
                            <Bar
                              data={generatePeakHoursChart()}
                              options={chartOpts("שעות השיא", "#2196f3")}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              height: 350,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                              color: "text.secondary",
                            }}
                          >
                            <Avatar sx={{ bgcolor: "grey.100", width: 60, height: 60, mb: 2 }}>
                              <AccessTime />
                            </Avatar>
                            <Typography variant="h6">אין נתונים זמינים</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                {/* Day of Week Chart */}
                <Grid item xs={12} md={6}>
                  <Grow in timeout={1400}>
                    <Card
                      elevation={6}
                      sx={{
                        borderRadius: 4,
                        height: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          p: 3,
                          background: "linear-gradient(135deg, #673ab715 0%, #673ab705 100%)",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#673ab7", width: 48, height: 48 }}>
                            <Schedule />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight="bold" color="text.primary">
                              ימי השבוע הפעילים
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              התפלגות פניות לפי ימי השבוע
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <CardContent sx={{ p: 4 }}>
                        {rawInquiries.length > 0 ? (
                          <Box sx={{ height: 350 }}>
                            <Bar
                              data={generateDayOfWeekChart()}
                              options={chartOpts("ימי השבוע הפעילים", "#673ab7")}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              height: 350,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                              color: "text.secondary",
                            }}
                          >
                            <Avatar sx={{ bgcolor: "grey.100", width: 60, height: 60, mb: 2 }}>
                              <Schedule />
                            </Avatar>
                            <Typography variant="h6">אין נתונים זמינים</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              </Grid>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 8, pt: 4, borderTop: "1px solid rgba(0,0,0,0.1)", textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary" fontWeight="500">
                © 2025 מגן דבורים אדום. כל הזכויות שמורות.
              </Typography>
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}
