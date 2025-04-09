// src/components/ui/select.jsx
import React from 'react';

export function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`border rounded p-2 w-full ${className}`}
    >
      {children}
    </select>
  );
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
