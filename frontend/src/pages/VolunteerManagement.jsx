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
  Dialog,  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material"
import { People, Email, Phone, LocationOn, PersonRemove, Warning } from "@mui/icons-material"
import { useNotification } from "../contexts/NotificationContext"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001"

export default function VolunteerManagement() {  const [volunteers, setVolunteers] = useState([])
  const { showSuccess, showError, showConfirmDialog } = useNotification()
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

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
                      {volunteers.length} מתנדבים פעילים במערכת
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TableContainer dir="rtl">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1rem", width: "25%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <People sx={{ fontSize: 20, color: "text.secondary" }} />
                          שם מלא
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1rem", width: "25%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Email sx={{ fontSize: 20, color: "text.secondary" }} />
                          אימייל
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1rem", width: "15%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Phone sx={{ fontSize: 20, color: "text.secondary" }} />
                          טלפון
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1rem", width: "15%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LocationOn sx={{ fontSize: 20, color: "text.secondary" }} />
                          עיר
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", fontSize: "1rem", textAlign: "center", width: "20%" }}
                      >
                        פעולות
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {volunteers.map((volunteer, index) => (
                      <Fade in timeout={800 + index * 100} key={volunteer.id}>
                        <TableRow
                          sx={{
                            "&:hover": {
                              bgcolor: "grey.50",
                            },
                            transition: "background-color 0.2s ease",
                          }}
                        >
                          <TableCell align="right" sx={{ width: "25%" }}>
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
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  מתנדב פעיל
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ width: "25%" }}>
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
                          <TableCell sx={{ textAlign: "center", width: "20%" }}>
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
                    ))}                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grow>
        )}
      </Container>
    </Box>
  )
}
