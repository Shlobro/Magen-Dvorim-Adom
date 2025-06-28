"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import {
  Container,
  Card,
  Typography,
  Button,
  CircularProgress,
  LinearProgress,
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
  CloudUpload,
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

  // Excel upload states
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadErrors, setUploadErrors] = useState([])
  const [processedCount, setProcessedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [uploadCancelled, setUploadCancelled] = useState(false)

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

  // Handle Excel file upload
  const handleExcelUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Reset upload states
    setUploadErrors([])
    setUploadProgress(0)
    setProcessedCount(0)
    setTotalCount(0)
    setUploadCancelled(false)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setUploadLoading(true)
        setUploadStatus('מתחיל עיבוד הקובץ...')
        setUploadProgress(10)
        
        // Parse Excel file
        setUploadStatus('קורא קובץ Excel...')
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        setUploadProgress(20)

        if (jsonData.length === 0) {
          showError("הקובץ ריק או שאין בו נתונים תקינים")
          setUploadLoading(false)
          setUploadStatus('')
          return
        }

        setTotalCount(jsonData.length)
        setUploadStatus(`נמצאו ${jsonData.length} שורות בקובץ. מתחיל עיבוד...`)
        setUploadProgress(30)

        // Show sample of first row to user for debugging
        if (jsonData.length > 0) {
          const sampleKeys = Object.keys(jsonData[0]).slice(0, 10);
          const sampleValues = sampleKeys.map(key => jsonData[0][key]);
          setUploadStatus(`מעבד ${jsonData.length} שורות. דוגמה מהשורה הראשונה: ${sampleValues.slice(0, 5).join(', ')}...`)
        }

        // Helper functions for extracting data from Excel columns
        function getColumnValue(row, index, headerName) {
          // Try different patterns for accessing columns
          const patterns = [
            `__EMPTY_${index}`,       // Empty header at exact index
            `__EMPTY_${index - 1}`,   // Sometimes off by one (0-based vs 1-based)
            Object.keys(row)[index],  // By position in keys array
            headerName,               // Direct header name
            // Try some common variations
            `Column${index + 1}`,
            `Col${index}`,
            `F${index + 1}`,          // F1, F2, etc.
          ];
          
          for (const pattern of patterns) {
            if (pattern && row.hasOwnProperty(pattern)) {
              const value = row[pattern];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }
          
          return '';
        }

        // Helper function to convert 0/1 to boolean
        function getBooleanValue(row, index, headerName) {
          const value = getColumnValue(row, index, headerName);
          return value === 1 || value === '1' || value === true || value === 'true';
        }

        // Debug: Log first row to see column structure
        if (jsonData.length > 0) {
          console.log('First row structure (headers):', jsonData[0]);
          console.log('Available keys:', Object.keys(jsonData[0]));
        }
        
        // Debug: Show sample values from the first data row (index 1)
        if (jsonData.length > 1) {
          console.log('First data row structure:', jsonData[1]);
          console.log('Sample data values:', {
            key0: jsonData[1][Object.keys(jsonData[1])[0]],
            key1: jsonData[1][Object.keys(jsonData[1])[1]],
            key2: jsonData[1][Object.keys(jsonData[1])[2]],
            key3: jsonData[1][Object.keys(jsonData[1])[3]], // Should be first name
            key4: jsonData[1][Object.keys(jsonData[1])[4]], // Should be last name
            key5: jsonData[1][Object.keys(jsonData[1])[5]], // Should be phone
            key6: jsonData[1][Object.keys(jsonData[1])[6]], // Should be email
          });
        }

        setUploadStatus('מעבד נתוני מתנדבים...')
        setUploadProgress(40)

        // Process volunteers data according to the updated Excel format
        const volunteersToAdd = []
        const processingErrors = []
        
        // Skip header row (index 0) and process data rows starting from index 1
        for (let index = 1; index < jsonData.length; index++) {
          const row = jsonData[index]
          setProcessedCount(index)
          
          // Check if upload was cancelled
          if (uploadCancelled) {
            setUploadStatus('התהליך בוטל על ידי המשתמש')
            setUploadLoading(false)
            return
          }
          
          try {
            // Column mapping based on actual Excel structure:
            // __EMPTY (0) = סודר, __EMPTY_1 (1) = חותמת זמן, __EMPTY_2 (2) = שם פרטי
            // __EMPTY_3 (3) = שם המשפחה, __EMPTY_4 (4) = מספר נייד, __EMPTY_5 (5) = דוא"ל
            // __EMPTY_6 (6) = מס זהות, __EMPTY_7 (7) = כתובת, __EMPTY_8 (8) = עיר, etc.
            
            // Extract data by the correct column index
            let firstName = getColumnValue(row, 2, 'שם פרטי'); // __EMPTY_2
            let lastName = getColumnValue(row, 3, 'שם המשפחה'); // __EMPTY_3  
            let phoneNumber = getColumnValue(row, 4, 'מספר נייד'); // __EMPTY_4
            let email = getColumnValue(row, 5, 'דוא"ל'); // __EMPTY_5
            
            // If standard mapping didn't work, try auto-detection by examining values
            if (!firstName && !lastName && !email) {
              const keys = Object.keys(row);
              // Look for values that might be names/emails in different positions
              for (let i = 0; i < keys.length; i++) {
                const value = row[keys[i]];
                if (value && typeof value === 'string') {
                  // Check if it looks like an email
                  if (value.includes('@') && !email) {
                    email = value;
                    console.log(`Auto-detected email in column ${i} (${keys[i]}): ${value}`);
                  }
                  // Check if it looks like a name (Hebrew/English letters)
                  else if (/^[א-תa-zA-Z\s]+$/.test(value) && value.length > 1) {
                    if (!firstName) {
                      firstName = value;
                      console.log(`Auto-detected first name in column ${i} (${keys[i]}): ${value}`);
                    } else if (!lastName) {
                      lastName = value;
                      console.log(`Auto-detected last name in column ${i} (${keys[i]}): ${value}`);
                    }
                  }
                }
              }
            }
            
            const idNumber = getColumnValue(row, 6, 'מס זהות'); // __EMPTY_6
            const address = getColumnValue(row, 7, 'כתובת'); // __EMPTY_7
            const city = getColumnValue(row, 8, 'עיר'); // __EMPTY_8
            // Skip the weird column at index 9
            const evacuationExperience = getBooleanValue(row, 10, 'ניסיון פינוי'); // __EMPTY_10
            const breedingExperience = getBooleanValue(row, 11, 'ניסיון גידול'); // __EMPTY_11
            const training = getBooleanValue(row, 12, 'הדרכה'); // __EMPTY_12
            const heightPermit = getBooleanValue(row, 13, 'היתר גובה'); // __EMPTY_13
            const previousEvacuation = getBooleanValue(row, 14, 'פינוי קודם'); // __EMPTY_14
            
            // Debug log for first few rows
            if (index < 3) {
              console.log(`Row ${index + 2} data:`, {
                rowKeys: Object.keys(row),
                firstName: firstName,
                lastName: lastName,
                email: email,
                phoneNumber: phoneNumber,
                rawFirstName: row.__EMPTY_2,  // Correct index
                rawLastName: row.__EMPTY_3,   // Correct index  
                rawEmail: row.__EMPTY_5       // Correct index
              });
            }
            
            // Validate required fields
            const missing = [];
            if (!firstName || firstName.toString().trim() === '') missing.push('שם פרטי (עמודה D)');
            if (!lastName || lastName.toString().trim() === '') missing.push('שם משפחה (עמודה E)');
            if (!email || email.toString().trim() === '') missing.push('דוא"ל (עמודה G)');
            
            if (missing.length > 0) {
              processingErrors.push(`שורה ${index + 2}: חסרים ${missing.join(', ')}`);
              continue;
            }
            
            // Fix phone number - add 0 at the beginning if missing
            if (phoneNumber && !phoneNumber.toString().startsWith('0')) {
              phoneNumber = '0' + phoneNumber.toString();
            }

            volunteersToAdd.push({
              firstName: firstName.toString().trim(),
              lastName: lastName.toString().trim(),
              email: email.toString().trim(),
              phoneNumber: phoneNumber.toString().trim(),
              idNumber: idNumber.toString().trim(),
              city: city.toString().trim(),
              address: address.toString().trim(),
              beeExperience: evacuationExperience, // Using evacuation experience as bee experience
              beekeepingExperience: breedingExperience,
              hasTraining: training,
              heightPermit: heightPermit,
              previousEvacuation: previousEvacuation, // New field
              userType: 2, // Volunteer type
              password: '123456', // Default password
              requirePasswordChange: true, // Force password change on first login
              rowNumber: index + 2 // Excel row number (starting from row 2, assuming row 1 is headers)
            });
            
          } catch (rowError) {
            console.error(`Error processing row ${index + 2}:`, rowError);
            processingErrors.push(`שורה ${index + 2}: שגיאה בעיבוד הנתונים - ${rowError.message}`);
          }
          
          // Update progress for processing (with small delay to show progress)
          const processingProgress = 40 + ((index + 1) / jsonData.length) * 30;
          setUploadProgress(Math.round(processingProgress));
          
          // Small delay every 10 rows to allow UI to update
          if (index % 10 === 0 && index > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        setUploadProgress(70)

        // Check if we have any volunteers to add
        if (volunteersToAdd.length === 0) {
          setUploadErrors(processingErrors);
          showError(`לא נמצאו נתונים תקינים להעלאה.\n${processingErrors.slice(0, 5).join('\n')}${processingErrors.length > 5 ? '\n...' : ''}`);
          setUploadLoading(false);
          setUploadStatus('השלמה עם שגיאות');
          return;
        }

        // Show processing errors if any, but continue with valid data
        if (processingErrors.length > 0) {
          setUploadErrors(processingErrors);
        }

        setUploadStatus(`שולח ${volunteersToAdd.length} מתנדבים לשרת...`)
        setUploadProgress(80)

        // Send to server
        const response = await axios.post(`${API_BASE}/api/users/bulk-create`, {
          volunteers: volunteersToAdd
        })

        setUploadProgress(90)

        if (response.data.success) {
          setUploadStatus('מעדכן רשימת מתנדבים...')
          
          // Refresh volunteers list
          const res = await axios.get(`${API_BASE}/api/users`)
          setVolunteers(res.data.filter((u) => u.userType === 2))
          
          setUploadProgress(100)
          setUploadStatus('הושלם בהצלחה!')
          
          const successMessage = `${response.data.created} מתנדבים נוספו בהצלחה למערכת!`;
          const warningMessage = processingErrors.length > 0 ? 
            `\n\nהתקבלו ${processingErrors.length} שגיאות בעיבוד (ראה פרטים למעלה)` : '';
          
          showSuccess(successMessage + warningMessage)
          
          // Show detailed success info
          console.log('Upload completed:', {
            totalRows: jsonData.length,
            successfullyAdded: response.data.created,
            errors: processingErrors.length,
            errorDetails: processingErrors
          })
          
          // Close dialog after short delay
          setTimeout(() => {
            setUploadDialogOpen(false)
          }, 2000)
        } else {
          setUploadStatus('שגיאה בשרת')
          setUploadErrors([response.data.message || "שגיאה בהוספת מתנדבים"])
          showError(response.data.message || "שגיאה בהוספת מתנדבים")
        }

      } catch (error) {
        console.error('Error uploading Excel:', error)
        setUploadStatus('שגיאה בעיבוד הקובץ')
        setUploadErrors([`שגיאה טכנית: ${error.message}`])
        showError("שגיאה בעיבוד הקובץ. אנא בדוק שהקובץ תקין ונסה שוב")
      } finally {
        setUploadLoading(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.onerror = (error) => {
      console.error('FileReader error:', error)
      setUploadLoading(false)
      setUploadStatus('שגיאה בקריאת הקובץ')
      setUploadErrors(['שגיאה בקריאת הקובץ. אנא נסה שוב.'])
      showError('שגיאה בקריאת הקובץ. אנא נסה שוב.')
    }

    reader.readAsArrayBuffer(file)
  }

  // Cancel upload
  const cancelUpload = () => {
    setUploadCancelled(true)
    setUploadStatus('מבטל תהליך...')
  }

  // Open upload dialog
  const openUploadDialog = () => {
    setUploadDialogOpen(true)
    // Reset all upload states
    setUploadLoading(false)
    setUploadProgress(0)
    setUploadStatus('')
    setUploadErrors([])
    setProcessedCount(0)
    setTotalCount(0)
    setUploadCancelled(false)
  }

  // Close upload dialog
  const closeUploadDialog = () => {
    if (uploadLoading && !uploadCancelled) {
      // If upload is in progress, ask for confirmation
      if (window.confirm('התהליך עדיין פועל. האם אתה בטוח שברצונך לבטל?')) {
        cancelUpload()
      }
      return
    }
    
    setUploadDialogOpen(false)
    // Reset all upload states
    setUploadProgress(0)
    setUploadStatus('')
    setUploadErrors([])
    setProcessedCount(0)
    setTotalCount(0)
    setUploadCancelled(false)
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
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
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
                  
                  {/* Upload Excel Button */}
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={openUploadDialog}
                    sx={{
                      bgcolor: "#4caf50",
                      "&:hover": { bgcolor: "#45a049" },
                      borderRadius: 2,
                      fontWeight: "bold",
                    }}
                  >
                    העלאת קובץ Excel
                  </Button>
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

      {/* Excel Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={closeUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <CloudUpload sx={{ fontSize: 32, color: "#4caf50" }} />
            <Typography variant="h5" fontWeight="bold">
              העלאת קובץ מתנדבים
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3, py: 2 }}>
          {!uploadLoading ? (
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                העלה קובץ Excel המכיל רשימת מתנדבים. המערכת תוסיף אוטומטית את כל המתנדבים עם הסיסמה הדיפולטיבית.
              </Typography>
                  <Alert severity="info" sx={{ mb: 3, textAlign: "right" }}>
              <Typography variant="body2">
                <strong>מבנה הקובץ הנדרש:</strong><br/>
                A - סודר, B - חותמת זמן, <strong>C - שם פרטי*</strong><br/>
                <strong>D - שם משפחה*</strong>, E - מספר נייד, <strong>F - דוא"ל*</strong><br/>
                G - מס זהות, H - כתובת, I - עיר<br/>
                J - עמודה מיוחדת, K - ניסיון פינוי (0/1), L - ניסיון גידול (0/1)<br/>
                M - הדרכות (0/1), N - היתר גובה (0/1), O - פינוי קודם (0/1)<br/>
                <small>* שדות חובה</small>
              </Typography>
            </Alert>

              <Alert severity="warning" sx={{ mb: 3, textAlign: "right" }}>
                <Typography variant="body2">
                  <strong>הערה חשובה:</strong><br/>
                  כל המתנדבים יקבלו סיסמה דיפולטיבית: <strong>123456</strong><br/>
                  בכניסה הראשונה הם יתבקשו לשנות את הסיסמה.
                </Typography>
              </Alert>

              <Box sx={{ 
                border: "2px dashed #ddd", 
                borderRadius: 2, 
                p: 3, 
                backgroundColor: "#fafafa",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#4caf50",
                  backgroundColor: "#f1f8e9"
                }
              }}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  style={{ display: "none" }}
                  id="excel-upload"
                  disabled={uploadLoading}
                />
                <label htmlFor="excel-upload" style={{ cursor: "pointer", width: "100%" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <CloudUpload sx={{ fontSize: 48, color: "#4caf50" }} />
                    <Typography variant="h6" color="text.primary">
                      לחץ לבחירת קובץ Excel
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      תומך בקבצי .xlsx ו .xls
                    </Typography>
                  </Box>
                </label>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", mb: 3 }}>
              {/* Upload Progress Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  מעלה קובץ Excel
                </Typography>
                
                {/* Progress Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {`${Math.round(uploadProgress)}%`}
                      </Typography>
                    </Box>
                    <Box sx={{ width: "100%", mr: 1 }}>
                      <div style={{
                        width: "100%",
                        height: "10px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "5px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${uploadProgress}%`,
                          height: "100%",
                          backgroundColor: uploadProgress === 100 ? "#4caf50" : "#2196f3",
                          transition: "width 0.3s ease",
                          borderRadius: "5px"
                        }} />
                      </div>
                    </Box>
                  </Box>
                </Box>

                {/* Status Message */}
                {uploadStatus && (
                  <Alert 
                    severity={uploadProgress === 100 ? "success" : "info"} 
                    sx={{ mb: 2, textAlign: "right" }}
                  >
                    <Typography variant="body2">
                      {uploadStatus}
                    </Typography>
                  </Alert>
                )}

                {/* Processing Progress */}
                {totalCount > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      מעבד: {processedCount} מתוך {totalCount} שורות
                    </Typography>
                  </Box>
                )}

                {/* Loading Spinner */}
                <Box sx={{ mt: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              </Box>

              {/* Errors Section */}
              {uploadErrors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="warning" sx={{ textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      שגיאות שנמצאו ({uploadErrors.length}):
                    </Typography>
                    <Box sx={{ maxHeight: "150px", overflow: "auto" }}>
                      {uploadErrors.slice(0, 10).map((error, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {error}
                        </Typography>
                      ))}
                      {uploadErrors.length > 10 && (
                        <Typography variant="body2" sx={{ fontStyle: "italic", mt: 1 }}>
                          ועוד {uploadErrors.length - 10} שגיאות...
                        </Typography>
                      )}
                    </Box>
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
          {uploadLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {uploadProgress === 100 && uploadStatus === 'הושלם בהצלחה!' ? (
                <Button
                  onClick={closeUploadDialog}
                  variant="contained"
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    fontWeight: 600,
                    bgcolor: "#4caf50",
                    "&:hover": { bgcolor: "#45a049" }
                  }}
                >
                  סגור
                </Button>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    תהליך ההעלאה בעיצומו...
                  </Typography>
                  <Button
                    onClick={cancelUpload}
                    variant="outlined"
                    color="error"
                    disabled={uploadCancelled}
                    sx={{
                      minWidth: 120,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {uploadCancelled ? 'מבטל...' : 'בטל תהליך'}
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <Button
              onClick={closeUploadDialog}
              sx={{
                minWidth: 120,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              ביטול
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
