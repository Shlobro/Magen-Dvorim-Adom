// Utility to safely mount components and prevent DOM access errors
import { useState, useEffect } from 'react';

export function withSafeMount(Component) {
  return function SafeMountedComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
      // Use a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }, []);
    
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
    
    return <Component {...props} />;
  };
}

export function useSafeMount() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  return isMounted;
}
