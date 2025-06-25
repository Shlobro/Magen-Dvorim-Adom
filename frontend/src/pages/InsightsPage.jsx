"use client"

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
import { TrendingUp, Assessment, LocationOn, People, CheckCircle, PendingActions, BarChart } from "@mui/icons-material"
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
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebaseConfig"

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend)

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 })
  const [rawInquiries, setRawInquiries] = useState([])
  const [rawUsers, setRawUsers] = useState([])

  // Time period states for each chart
  const [monthChartPeriod, setMonthChartPeriod] = useState("month")
  const [cityChartPeriod, setCityChartPeriod] = useState("month")
  const [volunteerChartPeriod, setVolunteerChartPeriod] = useState("month")

  const { userRole, loading: authLoading } = useAuth()

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

          const total = inquiries.length
          const closed = inquiries.filter((i) => i.status === "הפנייה נסגרה").length
          const open = total - closed

          setStats({ total, open, closed })
        } catch (e) {
          console.error(e)
          setError("אירעה שגיאה בטעינת הנתונים.")
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

  // Generate chart data based on time period
  const generateMonthChart = (period) => {
    const filteredInquiries = filterByTimePeriod(rawInquiries, period)

    if (period === "week") {
      // Group by days for week view
      const dayCount = {}
      const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

      filteredInquiries.forEach((inquiry) => {
        const date = parseTimestamp(inquiry.timestamp);
        if (!date) return;
        const dayName = dayNames[date.getDay()]
        const dateStr = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`
        dayCount[dateStr] = (dayCount[dateStr] || 0) + 1
      })

      const sortedDays = Object.keys(dayCount).sort((a, b) => {
        const dateA = new Date(a.split(" ")[1].split("/").reverse().join("/"))
        const dateB = new Date(b.split(" ")[1].split("/").reverse().join("/"))
        return dateA - dateB
      })

      return {
        labels: sortedDays,
        datasets: [
          {
            label: "מספר פניות",
            data: sortedDays.map((day) => dayCount[day]),
            backgroundColor: "rgba(25, 118, 210, 0.8)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      }
    } else {
      // Group by months for month/year view
      const monthNames = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ]
      const monthCount = {}

      filteredInquiries.forEach((inquiry) => {
        const date = parseTimestamp(inquiry.timestamp);
        if (!date) return;
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        monthCount[key] = (monthCount[key] || 0) + 1
      })

      const sortedMonths = Object.keys(monthCount).sort((a, b) => {
        const [mA, yA] = a.split(" ")
        const [mB, yB] = b.split(" ")
        return new Date(yA, monthNames.indexOf(mA)) - new Date(yB, monthNames.indexOf(mB))
      })

      return {
        labels: sortedMonths,
        datasets: [
          {
            label: "מספר פניות",
            data: sortedMonths.map((month) => monthCount[month]),
            backgroundColor: "rgba(25, 118, 210, 0.8)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      }
    }
  }

  const generateCityChart = (period) => {
    const filteredInquiries = filterByTimePeriod(rawInquiries, period)
    const cityCount = {}

    filteredInquiries.forEach((inquiry) => {
      if (inquiry.city) {
        const city = inquiry.city.trim()
        cityCount[city] = (cityCount[city] || 0) + 1
      }
    })

    const sortedCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1])

    return {
      labels: sortedCities.map(([city]) => city),
      datasets: [
        {
          label: "מספר פניות",
          data: sortedCities.map(([, count]) => count),
          backgroundColor: "rgba(156, 39, 176, 0.8)",
          borderColor: "rgba(156, 39, 176, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  const generateVolunteerChart = (period) => {
    const filteredInquiries = filterByTimePeriod(rawInquiries, period)
    const volMap = {}
    const volNames = rawUsers
      .filter((u) => u.userType === 2)
      .reduce((acc, u) => ((acc[u.id] = u.name || `מתנדב ${u.id.substring(0, 4)}`), acc), {})

    filteredInquiries.forEach((inquiry) => {
      const volunteerName = volNames[inquiry.assignedVolunteerId]
      if (volunteerName) {
        volMap[volunteerName] = (volMap[volunteerName] || 0) + 1
      }
    })

    const sortedVolunteers = Object.entries(volMap).sort((a, b) => b[1] - a[1])

    return {
      labels: sortedVolunteers.map(([name]) => name),
      datasets: [
        {
          label: "שיבוצים",
          data: sortedVolunteers.map(([, count]) => count),
          backgroundColor: "rgba(255, 152, 0, 0.8)",
          borderColor: "rgba(255, 152, 0, 1)",
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

  const TimeToggle = ({ value, onChange, sx = {} }) => (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(event, newValue) => {
        if (newValue !== null) {
          onChange(newValue)
        }
      }}
      sx={{
        "& .MuiToggleButton-root": {
          px: 2,
          py: 1,
          fontSize: "0.875rem",
          fontWeight: 500,
          border: "1px solid rgba(0, 0, 0, 0.12)",
          "&.Mui-selected": {
            backgroundColor: "primary.main",
            color: "white",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
          },
        },
        ...sx,
      }}
    >
      <ToggleButton value="week">שבוע</ToggleButton>
      <ToggleButton value="month">חודש</ToggleButton>
      <ToggleButton value="year">שנה</ToggleButton>
    </ToggleButtonGroup>
  )

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
            </Typography>
            <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: "auto", borderRadius: 2 }} />
          </Box>
        ) : error ? (
          <Fade in>
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                fontSize: "1.1rem",
                py: 3,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              {error}
            </Alert>
          </Fade>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {[
                {
                  label: 'סה"כ פניות',
                  value: stats.total,
                  color: "#1976d2",
                  bgColor: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  icon: <BarChart sx={{ fontSize: 40 }} />,
                },
                {
                  label: "פניות פתוחות",
                  value: stats.open,
                  color: "#2e7d32",
                  bgColor: "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)",
                  icon: <PendingActions sx={{ fontSize: 40 }} />,
                },
                {
                  label: "פניות סגורות",
                  value: stats.closed,
                  color: "#d32f2f",
                  bgColor: "linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)",
                  icon: <CheckCircle sx={{ fontSize: 40 }} />,
                },
              ].map(({ label, value, color, bgColor, icon }, index) => (
                <Grid item xs={12} sm={4} key={label}>
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
                      <CardContent sx={{ p: 4, textAlign: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                          <Box sx={{ textAlign: "left" }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ opacity: 0.9, mb: 1 }}>
                              {label}
                            </Typography>
                            <Typography variant="h2" fontWeight="bold">
                              {value.toLocaleString()}
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 64, height: 64 }}>{icon}</Avatar>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {label === 'סה"כ פניות' && "כלל הפניות במערכת"}
                          {label === "פניות פתוחות" && "ממתינות לטיפול"}
                          {label === "פניות סגורות" && "טופלו בהצלחה"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 4 }}>
              <Chip
                label="ניתוח נתונים מתקדם"
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
              {/* Month Chart */}
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
                        background: "linear-gradient(135deg, #1976d215 0%, #1976d205 100%)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#1976d2", width: 48, height: 48 }}>
                            <TrendingUp />
                          </Avatar>
                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                            מספר פניות לפי זמן
                          </Typography>
                        </Box>
                        <TimeToggle value={monthChartPeriod} onChange={setMonthChartPeriod} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      {rawInquiries.length > 0 ? (
                        <Box sx={{ height: 400 }}>
                          <Bar
                            data={generateMonthChart(monthChartPeriod)}
                            options={chartOpts("מספר פניות לפי זמן", "#1976d2")}
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
                            <TrendingUp />
                          </Avatar>
                          <Typography variant="h6">אין נתונים זמינים עבור פניות לפי זמן</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Box>

              {/* City Chart */}
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
                        background: "linear-gradient(135deg, #9c27b015 0%, #9c27b005 100%)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#9c27b0", width: 48, height: 48 }}>
                            <LocationOn />
                          </Avatar>
                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                            מספר פניות לפי עיר
                          </Typography>
                        </Box>
                        <TimeToggle value={cityChartPeriod} onChange={setCityChartPeriod} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      {rawInquiries.length > 0 ? (
                        <Box sx={{ height: 400 }}>
                          <Bar
                            data={generateCityChart(cityChartPeriod)}
                            options={chartOpts("מספר פניות לפי עיר", "#9c27b0")}
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
                            <LocationOn />
                          </Avatar>
                          <Typography variant="h6">אין נתונים זמינים עבור פניות לפי עיר</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Box>

              {/* Volunteer Chart */}
              <Box>
                <Grow in timeout={1200}>
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#ff9800", width: 48, height: 48 }}>
                            <People />
                          </Avatar>
                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                            מתנדבים מובילים לפי שיבוצים
                          </Typography>
                        </Box>
                        <TimeToggle value={volunteerChartPeriod} onChange={setVolunteerChartPeriod} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      {rawInquiries.length > 0 ? (
                        <Box sx={{ height: 400 }}>
                          <Bar
                            data={generateVolunteerChart(volunteerChartPeriod)}
                            options={chartOpts("מתנדבים מובילים לפי שיבוצים", "#ff9800")}
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
                            <People />
                          </Avatar>
                          <Typography variant="h6">אין נתונים זמינים עבור מתנדבים מובילים</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Box>
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
