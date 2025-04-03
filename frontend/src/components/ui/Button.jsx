// src/components/ui/button.jsx
import React from 'react';

export function Button({ children, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
