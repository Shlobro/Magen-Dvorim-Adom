"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"
import beeIconUrl from "../assets/cuteBeeInquiry.png"
import { collection, getDocs, getDoc, doc, updateDoc, query, where, GeoPoint, Timestamp } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { useLocation, useNavigate } from "react-router-dom"
import { useNotification } from "../contexts/NotificationContext"
import { useAuth } from "../contexts/AuthContext"
import { takeOwnership, releaseOwnership } from "../services/inquiryApi"
import { userService } from "../services/firebaseService"
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

// Debug Firebase connection on load
console.log('🔧 VolunteerMap: Firebase connection check:')
console.log('  - db object exists:', !!db)
console.log('  - db app name:', db?.app?.name)
console.log('  - Environment mode:', import.meta.env.MODE)
console.log('  - Current URL:', window.location.href)

if (!db) {
  console.error('❌ Firebase database not initialized in VolunteerMap!')
}

// Helper function to create bee icon safely
const createBeeIcon = () => {
  try {
    console.log('Creating bee icon, L object:', L)
    if (L && L.Icon) {
      const icon = new L.Icon({
        iconUrl: beeIconUrl,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
      })
      console.log('✅ Bee icon created successfully')
      return icon
    } else {
      console.error('❌ L or L.Icon not available:', { L: !!L, LIcon: !!(L && L.Icon) })
    }
  } catch (error) {
    console.error('❌ Error creating bee icon:', error)
  }
  return null
}

// Helper function to create volunteer icon safely
const createVolunteerIcon = () => {
  try {
    console.log('Creating volunteer icon, L object:', L)
    if (L && L.DivIcon) {
      // Create a professional volunteer icon
      const icon = new L.DivIcon({
        className: 'volunteer-marker',
        html: `<div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 12px rgba(25, 118, 210, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        " onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 5px 20px rgba(25, 118, 210, 0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 12px rgba(25, 118, 210, 0.4)'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
      })
      console.log('✅ Volunteer icon created successfully')
      return icon
    } else {
      console.error('❌ L or L.DivIcon not available:', { L: !!L, LDivIcon: !!(L && L.DivIcon) })
    }
  } catch (error) {
    console.error('❌ Error creating volunteer icon:', error)
  }
  return null
}

// Add global error handler for constructor errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('is not a constructor')) {
      console.error('Constructor error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
      // You can add specific handling here if needed
    }
  });
}

const NAVBAR_HEIGHT = 65
const isMobile = window.innerWidth <= 768

// Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (deg) => {
  return deg * (Math.PI / 180)
}

// Calculate volunteer score based on distance and experience
const calculateVolunteerScore = (volunteer, distance) => {
  let totalScore = 0;
  
  // 1. Distance Score (30% of total) - Maximum 30 points
  let distanceScore = 0;
  if (distance <= 15) {
    distanceScore = 30; // Full points for <= 15km
  } else if (distance <= 25) {
    distanceScore = 20; // 20 points for 15-25km
  } else if (distance <= 40) {
    distanceScore = 10; // 10 points for 25-40km
  } else {
    distanceScore = 0; // 0 points for > 40km
  }
  totalScore += distanceScore;
  
  // 2. Bee Removal Experience (15% of total) - Maximum 15 points
  if (volunteer.beeExperience === true) {
    totalScore += 15;
  }
  
  // 3. Beekeeping Experience (10% of total) - Maximum 10 points
  if (volunteer.beekeepingExperience === true) {
    totalScore += 10;
  }
  
  // 4. Training Experience (15% of total) - Maximum 15 points
  if (volunteer.hasTraining === true) {
    totalScore += 15;
  }
  
  // 5. Height Permit (10% of total) - Maximum 10 points
  if (volunteer.heightPermit === true) {
    totalScore += 10;
  }
  
  // 6. Assignment History Score (20% of total) - Maximum 20 points
  // For frontend display, we'll assume new volunteers get full 20 points
  // In a real implementation, this would query the database for completed assignments
  totalScore += 20;
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
};

export default function VolunteerMap() {
  // Debug log to confirm new version is loaded
  console.log('🗺️ VolunteerMap loaded - New unified volunteer list v1.0.2 (Jan 8, 2025)');
  
  const [inquiries, setInquiries] = useState([])
  const [allInquiries, setAllInquiries] = useState([]) // Store all inquiries for filtering
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [availableVolunteers, setAvailableVolunteers] = useState([])
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([])
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 768)
  const [showInquiryDetails, setShowInquiryDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all") // Default to show all inquiries
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState("") // Search filter for volunteers
  const [loadingVolunteers, setLoadingVolunteers] = useState(false) // Loading state for volunteers
  const [beeIcon, setBeeIcon] = useState(null) // State for bee icon
  const [volunteerIcon, setVolunteerIcon] = useState(null) // State for volunteer icon

  const mapRef = useRef()
  const location = useLocation()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showConfirmDialog } = useNotification()
  const { currentUser, userRole, loading: authLoading } = useAuth()

  // Validate Firebase connection and auth before proceeding
  useEffect(() => {
    console.log('🔧 Component mount - validating environment:')
    console.log('  - Firebase db:', !!db)
    console.log('  - Current user:', !!currentUser)
    console.log('  - User role:', userRole)
    console.log('  - Auth loading:', authLoading)
    console.log('  - Environment:', import.meta.env.MODE)
    
    if (!db) {
      console.error('❌ Firebase not initialized!')
      showError("שגיאה בחיבור למסד הנתונים. אנא רענן את הדף.")
      return
    }
    
    if (!authLoading && !currentUser) {
      console.warn('⚠️ User not authenticated')
      showWarning("נדרש להתחבר למערכת כדי לצפות במתנדבים.")
      return
    }
  }, [currentUser, userRole, authLoading, db])

  // Initialize bee icon and volunteer icon when component mounts
  useEffect(() => {
    const beeIconInstance = createBeeIcon();
    const volunteerIconInstance = createVolunteerIcon();
    setBeeIcon(beeIconInstance);
    setVolunteerIcon(volunteerIconInstance);
  }, []);

  // Manual cleanup function for stuck inquiries
  const handleManualCleanup = async () => {
    if (!currentUser) return;
    
    const stuckInquiryIds = [
      '8eCcZgkdtMQN5js4zV0k',
      'QcRsbyuTkctv4BoRWoli'
    ];
    
    try {
      console.log('🧹 Starting manual cleanup...');
      const { inquiryService } = await import('../services/firebaseService');
      
      const result = await inquiryService.markInquiriesAsDeleted(stuckInquiryIds, currentUser.uid);
      
      console.log('✅ Manual cleanup completed:', result);
      addNotification(result.message, 'success');
      
      // Refresh inquiries
      setTimeout(() => {
        fetchInquiries();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Manual cleanup failed:', error);
      addNotification('שגיאה בניקוי ידני: ' + error.message, 'error');
    }
  };

  const extractCoordinates = (data) => {
    let lat = null
    let lng = null
    
    console.log(`🗺️ Extracting coordinates for address: ${data.address}`);
    console.log(`  - data.location:`, data.location);
    console.log(`  - data.lat:`, data.lat);
    console.log(`  - data.lng:`, data.lng);
    
    if (data.location && typeof data.location === "object" && data.location.latitude != null && data.location.longitude != null) {
      // Handle both GeoPoint and regular objects with latitude/longitude
      lat = data.location.latitude
      lng = data.location.longitude
      console.log(`  - ✅ Using location object: lat=${lat}, lng=${lng}`);
    } else if (data.lat != null && data.lng != null) {
      lat = data.lat
      lng = data.lng
      console.log(`  - ✅ Using direct lat/lng: lat=${lat}, lng=${lng}`);
    } else {
      console.log(`  - ❌ No valid coordinates found`);
    }
    
    return { lat, lng }
  }

  const fetchInquiries = useCallback(async () => {
    console.log('🔄 fetchInquiries called');
    
    if (!currentUser) {
      console.log('❌ No current user, skipping inquiry fetch');
      return;
    }
    
    try {
      let fetched = [];
      
      if (userRole === 1) {
        // Coordinator role - get inquiries assigned to this coordinator OR unassigned ones
        console.log('🎯 Fetching inquiries for coordinator on map...');
        
        try {
          // Try backend API first (same as dashboard)
          const backendUrl = import.meta.env.PROD 
            ? (import.meta.env.VITE_API_BASE || 'https://magendovrimadom-backend.railway.app')
            : (import.meta.env.VITE_API_BASE || 'http://localhost:3001');
          
          const response = await fetch(`${backendUrl}/api/inquiries?coordinatorId=${currentUser.uid}`)
          if (!response.ok) {
            throw new Error('Backend API failed')
          }
          const inquiries = await response.json()
          
          // Backend API already filters for coordinator inquiries and excludes deleted ones
          // Just filter by status and add coordinates - the backend handles deleted filtering
          const allApiInquiries = inquiries
            .filter(inquiry => 
              ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב"].includes(inquiry.status)
            )
            .map((data) => {
              const { lat, lng } = extractCoordinates(data)
              return { id: data.id, ...data, lat, lng }
            });
          
          console.log('🔍 API inquiries for coordinator (backend already filtered):', allApiInquiries.map(i => ({
            id: i.id, 
            coordinatorId: i.coordinatorId, 
            address: i.address,
            deleted: i.deleted,
            isMyInquiry: i.coordinatorId === currentUser.uid
          })));
          
          // Use the inquiries as-is since backend already did the filtering
          fetched = allApiInquiries;
          console.log('✅ Map: Loaded', fetched.length, 'coordinator inquiries from backend API (backend filtered)');
        } catch (apiError) {
          console.warn('Backend API failed, falling back to direct Firestore:', apiError.message);
          
          // Fallback to direct Firestore query
          const q = query(
            collection(db, "inquiry"),
            where("status", "in", ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב"]),
          )
          const querySnapshot = await getDocs(q)
          const allInquiries = querySnapshot.docs.map((doc) => {
            const data = doc.data()
            const { lat, lng } = extractCoordinates(data)
            return { id: doc.id, ...data, lat, lng }
          })
          
          // Filter for coordinator's inquiries ONLY (not unassigned ones)
          console.log('🔍 BEFORE filtering - All inquiries:', allInquiries.map(i => ({
            id: i.id, 
            coordinatorId: i.coordinatorId, 
            address: i.address,
            isMyInquiry: i.coordinatorId === currentUser.uid
          })));
          
          fetched = allInquiries.filter(inquiry => {
            // First filter out deleted inquiries
            if (inquiry.deleted === true) {
              return false;
            }
            
            const belongsToMe = inquiry.coordinatorId === currentUser.uid;
            const isUnassigned = !inquiry.coordinatorId || inquiry.coordinatorId === null || inquiry.coordinatorId === undefined;
            
            console.log(`🎯 Filtering inquiry ${inquiry.id} (${inquiry.address}):`);
            console.log(`   - coordinatorId: "${inquiry.coordinatorId}" (type: ${typeof inquiry.coordinatorId})`);
            console.log(`   - currentUser.uid: "${currentUser.uid}"`);
            console.log(`   - belongsToMe: ${belongsToMe}`);
            console.log(`   - isUnassigned: ${isUnassigned}`);
            console.log(`   - INCLUDE IN MAP: ${belongsToMe}`);
            
            return belongsToMe; // Only include inquiries assigned to current coordinator
          });
          
          console.log('🔍 AFTER filtering - My inquiries:', fetched.map(i => ({
            id: i.id, 
            coordinatorId: i.coordinatorId, 
            address: i.address,
            lat: i.lat,
            lng: i.lng,
            hasCoordinates: i.lat != null && i.lng != null && !isNaN(i.lat) && !isNaN(i.lng)
          })));
          
          console.log('✅ Map: Loaded', fetched.length, 'coordinator inquiries from Firestore fallback');
        }
      } else {
        // Non-coordinator users - get all inquiries (existing behavior)
        const q = query(
          collection(db, "inquiry"),
          where("status", "in", ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב"]),
        )
        console.log('📡 Querying Firebase for all inquiries...');
        const querySnapshot = await getDocs(q)
        const allInquiries = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          const { lat, lng } = extractCoordinates(data)
          return { id: doc.id, ...data, lat, lng }
        })
        
        // Filter out deleted inquiries for non-coordinators too
        fetched = allInquiries.filter(inquiry => inquiry.deleted !== true)
        console.log('✅ Map: Loaded', fetched.length, 'inquiries for non-coordinator (excluding deleted)');
      }

      console.log(`📊 Raw results: ${fetched.length} inquiries`);

      // 1. Filter out bad coords
      const validInquiries = fetched.filter(
        (inquiry) => inquiry.lat != null && !isNaN(inquiry.lat) && inquiry.lng != null && !isNaN(inquiry.lng),
      )
      
      console.log(`📍 Coordinate filtering:`)
      console.log(`  - Total fetched: ${fetched.length}`)
      console.log(`  - With valid coordinates: ${validInquiries.length}`)
      console.log(`  - Without coordinates: ${fetched.length - validInquiries.length}`)
      
      // Log first few inquiries for debugging
      fetched.slice(0, 3).forEach((inq, idx) => {
        console.log(`  - Inquiry ${idx + 1}: lat=${inq.lat}, lng=${inq.lng}, status=${inq.status}, coordinatorId=${inq.coordinatorId}`)
      })

      // 2. Collect all unique volunteer UIDs
      const volunteerUids = new Set()
      validInquiries.forEach((call) => {
        // Handle both array and string formats
        if (call.assignedVolunteers) {
          if (Array.isArray(call.assignedVolunteers)) {
            call.assignedVolunteers.forEach(uid => {
              if (uid && uid.trim() !== "") {
                volunteerUids.add(uid)
              }
            })
          } else if (typeof call.assignedVolunteers === "string" && call.assignedVolunteers.trim() !== "") {
            volunteerUids.add(call.assignedVolunteers)
          }
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
        let ta = 0;
        let tb = 0;
        
        // Handle different timestamp formats
        if (a.timestamp) {
          if (typeof a.timestamp.toDate === 'function') {
            ta = a.timestamp.toDate().getTime();
          } else if (a.timestamp instanceof Date) {
            ta = a.timestamp.getTime();
          } else if (typeof a.timestamp === 'string') {
            ta = new Date(a.timestamp).getTime();
          }
        }
        
        if (b.timestamp) {
          if (typeof b.timestamp.toDate === 'function') {
            tb = b.timestamp.toDate().getTime();
          } else if (b.timestamp instanceof Date) {
            tb = b.timestamp.getTime();
          } else if (typeof b.timestamp === 'string') {
            tb = new Date(b.timestamp).getTime();
          }
        }
        
        return ta - tb
      })

      // 5. Assign sequential number and add volunteer names
      const numbered = validInquiries.map((inq, idx) => {
        // Get the first assigned volunteer name (handle both array and string formats)
        let assignedVolunteerName = "-"
        if (inq.assignedVolunteers) {
          if (Array.isArray(inq.assignedVolunteers) && inq.assignedVolunteers.length > 0) {
            assignedVolunteerName = uidToVolunteerName[inq.assignedVolunteers[0]] ?? "-"
          } else if (typeof inq.assignedVolunteers === "string") {
            assignedVolunteerName = uidToVolunteerName[inq.assignedVolunteers] ?? "-"
          }
        }
        
        return {
          ...inq,
          seqNum: idx + 1,
          assignedVolunteerName,
        }
      })

      setAllInquiries(numbered)
      
      console.log(`✅ Final inquiries set: ${numbered.length}`)
      console.log(`📊 Status breakdown:`)
      const statusCounts = numbered.reduce((acc, inq) => {
        acc[inq.status] = (acc[inq.status] || 0) + 1
        return acc
      }, {})
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`)
      })
      
    } catch (error) {
      console.error("Error fetching inquiries:", error)
    }
  }, [currentUser, userRole])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  // Filter inquiries based on status
  useEffect(() => {
    console.log(`🔍 Filtering inquiries - statusFilter: ${statusFilter}, allInquiries: ${allInquiries.length}`)
    if (!allInquiries.length) return

    let filtered = []
    switch (statusFilter) {
      case "unassigned":
        filtered = allInquiries.filter(
          (inquiry) =>
            inquiry.status === "נפתחה פנייה (טופס מולא)" &&
            (!inquiry.assignedVolunteers || 
             (Array.isArray(inquiry.assignedVolunteers) && inquiry.assignedVolunteers.length === 0) ||
             (typeof inquiry.assignedVolunteers === "string" && inquiry.assignedVolunteers === "")),
        )
        break
      case "assigned":
        filtered = allInquiries.filter(
          (inquiry) =>
            inquiry.status === "לפנייה שובץ מתנדב" || 
            (inquiry.assignedVolunteers && 
             ((Array.isArray(inquiry.assignedVolunteers) && inquiry.assignedVolunteers.length > 0) ||
              (typeof inquiry.assignedVolunteers === "string" && inquiry.assignedVolunteers !== ""))),
        )
        break
      case "all":
      default:
        filtered = allInquiries
        break
    }

    console.log(`📋 Filtered results: ${filtered.length} inquiries for filter "${statusFilter}"`)
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
        // Debug Firebase connection
        console.log('🔧 Firebase debug info:')
        console.log('  - db object:', !!db)
        console.log('  - Firebase app:', db?.app?.name)
        console.log('  - Current URL:', window.location.href)
        console.log('  - Environment:', import.meta.env.MODE)
        
        if (!db) {
          throw new Error('Firebase database not initialized')
        }
        
        // Use userService instead of direct Firestore query (same as VolunteerManagement)
        console.log('🔍 Fetching all users via userService...')
        const allUsers = await userService.getAllUsers()
        console.log('✅ userService query completed, total users:', allUsers.length)
        
        // Filter to volunteers only
        const volunteersData = allUsers.filter(user => user.userType === 2)
        console.log('✅ Filtered to volunteers:', volunteersData.length)
        
        const allVolunteers = []
        
        volunteersData.forEach((data) => {
          const { lat, lng } = extractCoordinates(data)
          
          // Create full name from firstName and lastName
          const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'מתנדב ללא שם'
          
          let distance = null
          let score = 0
          
          if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
            // Calculate distance from selected inquiry
            distance = calculateDistance(
              selectedInquiry.lat,
              selectedInquiry.lng,
              lat,
              lng
            )
            
            // Calculate volunteer score with distance
            score = calculateVolunteerScore(data, distance)
          } else {
            // Give volunteers without coordinates a score based on experience only (assume 50km distance)
            score = calculateVolunteerScore(data, 50)
          }
          
          allVolunteers.push({
            id: data.id,
            ...data,
            name,
            lat,
            lng,
            distance,
            score,
            hasCoordinates: lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
          })
        })
        
        // Sort ALL volunteers by score (highest first), then by distance if available
        allVolunteers.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score; // Higher score first
          }
          // If scores are equal, prioritize those with coordinates and closer distance
          if (a.hasCoordinates && b.hasCoordinates) {
            return a.distance - b.distance; // Closer distance first
          }
          if (a.hasCoordinates && !b.hasCoordinates) return -1; // Prioritize with coordinates
          if (!a.hasCoordinates && b.hasCoordinates) return 1;  // Prioritize with coordinates
          return 0; // Same priority
        })
        
        setAvailableVolunteers(allVolunteers)
        
        console.log(`📊 Volunteer summary:`)
        console.log(`  - Total volunteers: ${allVolunteers.length}`)
        console.log(`  - With coordinates: ${allVolunteers.filter(v => v.hasCoordinates).length}`)
        console.log(`  - Without coordinates: ${allVolunteers.filter(v => !v.hasCoordinates).length}`)
        console.log(`  - Top scores: ${allVolunteers.slice(0, Math.min(10, allVolunteers.length)).map(v => v.score.toFixed(1)).join(', ')}`)
        
      } catch (error) {
        console.error("Error fetching available volunteers:", error)
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
          name: error.name
        })
        
        // Show user-friendly error message
        if (error.message?.includes('Firebase') || error.code?.includes('firestore')) {
          showError("שגיאה בחיבור למסד הנתונים. אנא נסה שוב מאוחר יותר.")
        } else {
          showError("שגיאה בטעינת רשימת המתנדבים. אנא נסה שוב.")
        }
        
        setAvailableVolunteers([])
      } finally {
        setLoadingVolunteers(false)
      }
    }
    fetchVolunteers()
  }, [selectedInquiry])
  const assignToInquiry = async () => {
    console.log('🔄 assignToInquiry called');
    console.log('  - selectedInquiry:', selectedInquiry?.id);
    console.log('  - selectedVolunteerIds:', selectedVolunteerIds);
    console.log('  - availableVolunteers count:', availableVolunteers.length);
    
    if (!selectedInquiry || selectedVolunteerIds.length === 0) {
      console.log('❌ Missing selection - inquiry:', !!selectedInquiry, 'volunteers:', selectedVolunteerIds.length);
      showWarning("אנא בחר פנייה ומתנדב לשיבוץ.")
      return
    }

    // Check if coordinator has ownership of this inquiry
    if (selectedInquiry.coordinatorId && selectedInquiry.coordinatorId !== currentUser?.uid) {
      showError("לא ניתן לשבץ מתנדב - הפנייה כבר שייכת לרכז אחר.")
      return
    }

    // If no coordinator is assigned, take ownership automatically
    let inquiryToUpdate = selectedInquiry;
    if (!selectedInquiry.coordinatorId) {
      console.log('🔄 Taking automatic ownership of unassigned inquiry...');
      try {
        await takeOwnership(selectedInquiry.id, currentUser.uid);
        inquiryToUpdate = { ...selectedInquiry, coordinatorId: currentUser.uid };
        setSelectedInquiry(inquiryToUpdate);
      } catch (error) {
        console.error('Failed to take ownership:', error);
        showError("שגיאה בלקיחת בעלות על הפנייה.");
        return;
      }
    }

    const inquiryId = inquiryToUpdate.id
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
        assignedVolunteers: [volunteerToAssignId],
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
    <>
      {/* CSS for volunteer markers */}
      <style>{`
        .volunteer-marker {
          background: transparent !important;
          border: none !important;
        }
        .volunteer-marker div {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .volunteer-marker:hover div {
          transform: scale(1.15) !important;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
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
              
              {/* Manual Cleanup Button - Only show if there are stuck inquiries */}
              {inquiries.length > 0 && inquiries.some(inq => inq.deleted === undefined) && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={handleManualCleanup}
                  sx={{
                    fontSize: "0.75rem",
                    minWidth: "auto",
                    px: 2,
                    py: 0.5,
                    bgcolor: "orange",
                    color: "white",
                    "&:hover": {
                      bgcolor: "darkorange",
                    },
                  }}
                >
                  🧹 ניקוי ידני
                </Button>
              )}
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
            {(() => {
              console.log('🗺️ Rendering markers:');
              console.log(`  - inquiries array: ${Array.isArray(inquiries)} (length: ${inquiries?.length || 0})`);
              console.log(`  - beeIcon available: ${!!beeIcon}`);
              console.log(`  - availableVolunteers array: ${Array.isArray(availableVolunteers)} (length: ${availableVolunteers?.length || 0})`);
              console.log(`  - volunteerIcon available: ${!!volunteerIcon}`);
              
              // Debug the 2 stuck inquiries
              if (Array.isArray(inquiries) && inquiries.length > 0) {
                console.log('🔍 DEBUGGING STUCK INQUIRIES:');
                inquiries.forEach((inquiry, index) => {
                  console.log(`  📍 Inquiry ${index + 1}:`);
                  console.log(`     - ID: ${inquiry.id}`);
                  console.log(`     - Address: ${inquiry.address}`);
                  console.log(`     - Coordinator ID: ${inquiry.coordinatorId}`);
                  console.log(`     - Status: ${inquiry.status}`);
                  console.log(`     - Deleted: ${inquiry.deleted}`);
                  console.log(`     - Has coordinates: ${inquiry.lat != null && inquiry.lng != null}`);
                  console.log(`     - Created: ${inquiry.createdAt?.toDate?.() || inquiry.createdAt || 'Unknown'}`);
                });
              }
              
              const validInquiryMarkers = Array.isArray(inquiries) ? inquiries.filter(inquiry => 
                inquiry.lat != null && inquiry.lng != null && !isNaN(inquiry.lat) && !isNaN(inquiry.lng) && beeIcon
              ) : [];
              const validVolunteerMarkers = Array.isArray(availableVolunteers) ? availableVolunteers.filter(volunteer => 
                volunteer.lat != null && volunteer.lng != null && !isNaN(volunteer.lat) && !isNaN(volunteer.lng) && volunteerIcon
              ) : [];
              console.log(`  - Valid inquiry markers to render: ${validInquiryMarkers.length}`);
              console.log(`  - Valid volunteer markers to render: ${validVolunteerMarkers.length}`);
              
              return null;
            })()}
            {Array.isArray(inquiries) && inquiries.map((inquiry) =>
              inquiry.lat != null && inquiry.lng != null && !isNaN(inquiry.lat) && !isNaN(inquiry.lng) && beeIcon ? (
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
            {Array.isArray(availableVolunteers) && availableVolunteers.map((volunteer) =>
              volunteer.lat != null && volunteer.lng != null && !isNaN(volunteer.lat) && !isNaN(volunteer.lng) && volunteerIcon ? (
                <Marker 
                  key={volunteer.id} 
                  position={[volunteer.lat, volunteer.lng]}
                  icon={volunteerIcon}
                >
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
                                const filteredVolunteers = Array.isArray(availableVolunteers) ? 
                                  availableVolunteers.filter((volunteer) =>
                                    volunteerSearchTerm === "" ||
                                    (volunteer.name && volunteer.name.toLowerCase().includes(volunteerSearchTerm.toLowerCase()))
                                  ) : [];

                                // Show all volunteers sorted by score (no limit)
                                const allVolunteers = filteredVolunteers;

                                return filteredVolunteers.length > 0 ? (
                                  <FormControl component="fieldset" fullWidth>
                                    
                                    {/* All volunteers section */}
                                    {allVolunteers.length > 0 && (
                                      <>
                                        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                          ⭐ המתנדבים הטובים ביותר
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                          {allVolunteers.length} מתנדבים ממוינים לפי ציון התאמה
                                        </Typography>
                                      </>
                                    )}

                                    <RadioGroup
                                      value={selectedVolunteerIds[0] || ""}
                                      onChange={(e) => setSelectedVolunteerIds([e.target.value])}
                                    >
                                      {/* Display all volunteers */}
                                      {allVolunteers.map((volunteer) => (
                                        <Paper
                                          key={volunteer.id}
                                          elevation={selectedVolunteerIds[0] === volunteer.id ? 3 : 1}
                                          sx={{
                                            p: 2,
                                            mb: 1,
                                            borderRadius: 2,
                                            bgcolor:
                                              selectedVolunteerIds[0] === volunteer.id ? "primary.light" : "background.paper",
                                            border: '2px solid',
                                            borderColor: volunteer.score >= 80 ? 'success.main' : 
                                                        volunteer.score >= 60 ? 'warning.main' : 'grey.300',
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
                                                    {volunteer.hasCoordinates ? 
                                                      `מרחק: ${volunteer.distance?.toFixed(1)} ק"מ` : 
                                                      'מיקום לא זמין במפה'
                                                    }
                                                  </Typography>
                                                  {volunteer.city && (
                                                    <Typography variant="body2" color="text.secondary">
                                                      עיר: {volunteer.city}
                                                    </Typography>
                                                  )}

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
              {(() => {
                console.log('🔍 Button visibility check:');
                console.log('  - selectedInquiry.coordinatorId:', selectedInquiry?.coordinatorId);
                console.log('  - currentUser?.uid:', currentUser?.uid);
                console.log('  - isSelectedInquiryAssigned:', isSelectedInquiryAssigned);
                console.log('  - Show button:', selectedInquiry?.coordinatorId === currentUser?.uid && !isSelectedInquiryAssigned);
                return null;
              })()}
              {selectedInquiry?.coordinatorId === currentUser?.uid && !isSelectedInquiryAssigned && (
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
    </>
  )
}
