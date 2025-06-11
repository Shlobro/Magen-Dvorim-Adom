// src/pages/CollapsibleSection.jsx
import React, { useState } from 'react';

// סטייל לכותרת של הסקשן המתקפל
const collapsibleHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '10px 0',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '10px',
};

const titleStyle = {
  fontSize: '1.2rem',
  fontWeight: '600',
  color: '#374151',
};

const iconStyle = {
  fontSize: '1.5rem',
  color: '#6b7280',
  transition: 'transform 0.2s ease-in-out',
};

export default function CollapsibleSection({ title, children, defaultExpanded = true }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // סגנון דינמי לאייקון כדי לסובב אותו
  const dynamicIconStyle = {
    ...iconStyle,
    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
  };

  return (
    <div>
      <div style={collapsibleHeaderStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <h2 style={titleStyle}>{title}</h2>
        <span style={dynamicIconStyle}>▼</span>
      </div>
      {isExpanded && children}
    </div>
  );
}