import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold font-display tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-blue-900/20",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-gray-300 backdrop-blur-sm",
    outline: "border border-primary text-primary hover:bg-primary/5",
    ghost: "text-slate-700 hover:text-primary hover:bg-primary/5",
  };

  const sizes = "h-12 px-8 text-base"; // Standard size for this design

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;