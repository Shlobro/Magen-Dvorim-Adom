// src/components/ui/card.jsx
import React from 'react';

/* 
  The Card component now uses the "card" class defined in index.css,
  which has a dark background and white text.
*/

export function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`border-b pb-2 mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-2 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`border-t pt-2 mt-2 ${className}`}>{children}</div>;
}
