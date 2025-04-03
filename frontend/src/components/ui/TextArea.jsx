// src/components/ui/textarea.jsx
import React from 'react';

export function Textarea({ value, onChange, placeholder, name, id, rows = 3, className = '' }) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`border rounded p-2 w-full ${className}`}
    />
  );
}
