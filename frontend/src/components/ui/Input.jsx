// src/components/ui/input.jsx
import React from 'react';

export function Input({ value, onChange, placeholder, name, id, type = 'text', className = '' }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`border rounded p-2 w-full ${className}`}
    />
  );
}
