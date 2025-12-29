import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-sm";
  
  const variants = {
    primary: "bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-900 border border-transparent",
    secondary: "bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-500 border border-transparent",
    outline: "border border-navy-900/30 text-navy-900 hover:bg-navy-50 focus:ring-navy-900 hover:border-navy-900",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-6 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};