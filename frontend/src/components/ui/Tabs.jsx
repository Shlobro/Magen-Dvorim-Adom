// src/components/ui/tabs.jsx
import React, { useState } from 'react';

export function Tabs({ children, defaultValue, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return React.Children.map(children, (child) => {
    // Pass active state and setter to children if needed
    return React.cloneElement(child, { activeTab, setActiveTab });
  });
}

export function TabsList({ children, activeTab, setActiveTab, className = '' }) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsTrigger({ value, activeTab, setActiveTab, children, className = '' }) {
  const active = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 rounded border ${active ? 'bg-blue-500 text-white' : 'bg-gray-100'} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeTab, children, className = '' }) {
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
}
