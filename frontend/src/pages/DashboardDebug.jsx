import { useState, useEffect, useMemo, useRef } from "react"
import { resetHookTracer, traceHook, showHookTrace, getHookStats } from "../utils/hookTracer"

// Simplified Dashboard for debugging hook issues
export default function DashboardDebug() {
  resetHookTracer();
  
  // ALL HOOKS MUST BE DECLARED FIRST
  traceHook('useState-isMounted');
  const [isMounted, setIsMounted] = useState(false);
  traceHook('useState-calls');
  const [calls, setCalls] = useState([])
  traceHook('useState-loading');
  const [loading, setLoading] = useState(true)
  traceHook('useState-error');
  const [error, setError] = useState(null)
  traceHook('useState-hookStats');
  const [hookStats, setHookStats] = useState(getHookStats())
  
  // Filter States
  traceHook('useState-filterVolunteer');
  const [filterVolunteer, setFilterVolunteer] = useState("")
  traceHook('useState-filterStartDate');
  const [filterStartDate, setFilterStartDate] = useState("")
  traceHook('useState-filterEndDate');
  const [filterEndDate, setFilterEndDate] = useState("")
  traceHook('useState-filterStatus');
  const [filterStatus, setFilterStatus] = useState("נפתחה פנייה (טופס מולא)")
  traceHook('useState-searchTerm');
  const [searchTerm, setSearchTerm] = useState("")

  // Pagination states
  traceHook('useState-currentPage');
  const [currentPage, setCurrentPage] = useState(1)
  traceHook('useState-itemsPerPage');
  const [itemsPerPage] = useState(5)

  // State for mobile filter visibility
  traceHook('useState-isMobileFilterOpen');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  traceHook('useState-isMobileView');
  const [isMobileView, setIsMobileView] = useState(false)

  // State for volunteers list
  traceHook('useState-volunteers');
  const [volunteers, setVolunteers] = useState([])
  traceHook('useState-loadingVolunteers');
  const [loadingVolunteers, setLoadingVolunteers] = useState(false)

  // Sorting States
  traceHook('useState-sortColumn');
  const [sortColumn, setSortColumn] = useState(null)
  traceHook('useState-sortDirection');
  const [sortDirection, setSortDirection] = useState('asc')
  
  // Simple safe mounting to prevent DOM access errors
  traceHook('useEffect-mounting');
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update hook stats on mount and after specific changes
  traceHook('useEffect-updateStats');
  useEffect(() => {
    setHookStats(getHookStats());
  }, [loading, currentPage]); // Only update when specific states change
  
  // Simple error boundary for style-related errors
  traceHook('useEffect-errorHandler');
  useEffect(() => {
    const handleError = (event) => {
      if (event.error?.message?.includes("Cannot read properties of undefined (reading 'style')")) {
        console.warn('Style error caught and handled:', event.error.message);
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Force a re-render to test hook consistency
  const forceRerender = () => {
    setLoading(!loading);
  };

  // Show loading while component is safely mounting
  if (!isMounted) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        fontSize: "1.1em",
        color: "#666",
      }}>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#f8f9fa",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}>
          טוען נתונים...
        </div>
      </div>
    );
  }

  return (
    <div style={{padding: '20px'}}>
      <h1>Dashboard Debug - Hook Tracing</h1>
      
      {/* Debug buttons */}
      <div style={{marginBottom: '20px'}}>
        <button 
          onClick={showHookTrace}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          Show Hook Trace Popup
        </button>
        
        <button 
          onClick={forceRerender}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px'
          }}
        >
          Force Re-render (Test Hooks)
        </button>
      </div>

      {/* Hook Statistics Display */}
      <div style={{background: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <h3>Hook Statistics:</h3>
        <p><strong>Current Render:</strong> {hookStats.currentRender}</p>
        <p><strong>Current Hook Count:</strong> {hookStats.currentHookCount}</p>
        <p><strong>Hook History:</strong> {JSON.stringify(hookStats.history)}</p>
        {hookStats.messages && (
          <div>
            <h4>Recent Messages:</h4>
            <div style={{maxHeight: '200px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace'}}>
              {hookStats.messages.slice(-20).map((msg, i) => (
                <div key={i} style={{color: msg.includes('⚠️') ? 'red' : 'green'}}>{msg}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '5px'}}>
        <h3>Current State:</h3>
        <p>Loading: {loading.toString()}</p>
        <p>Calls: {calls.length}</p>
        <p>Filter Volunteer: {filterVolunteer || 'None'}</p>
        <p>Current Page: {currentPage}</p>
        <p>Sort Column: {sortColumn || 'None'}</p>
      </div>

      <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
        Check browser console for detailed hook trace logs.
      </div>
    </div>
  );
}
