import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    px-6 py-3
    rounded-2xl
    font-medium
    transition-all duration-200
    focus:outline-none
    focus:ring-2 focus:ring-primary
    focus:ring-offset-0
    disabled:opacity-60
    disabled:cursor-not-allowed
    select-none
  `;

  const variantClasses = {
    primary: `
      bg-primary text-white
      hover:bg-primary/90
      active:scale-[0.98]
      shadow-sm
      hover:shadow-[0_10px_30px_rgba(245,158,11,0.22)]
    `,
    secondary: `
      border-2 border-gray-border-light
      text-primary
      bg-white
      hover:bg-primary/8
      active:scale-[0.98]
      hover:shadow-[0_10px_24px_rgba(245,158,11,0.14)]
    `,
    ghost: `
      text-gray-text
      bg-transparent
      hover:bg-primary/8
      active:scale-[0.98]
    `,
  };

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="
            w-4 h-4
            border-2 border-white/60
            border-t-white
            rounded-full
            animate-spin
          "
        />
      )}

      <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
    </motion.button>
  );
};
