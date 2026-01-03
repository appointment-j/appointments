import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ScreenContainerProps {
  children: ReactNode;
  className?: string;
}

export const ScreenContainer = ({
  children,
  className = '',
}: ScreenContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        min-h-screen
        w-full
        overflow-x-hidden
        bg-white
        ${className}
      `}
      dir="rtl"
    >
      {children}
    </motion.div>
  );
};

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export const Panel = ({ children, className = '' }: PanelProps) => {
  return (
    <div
      className={`
        min-h-screen
        w-full
        overflow-y-auto
        overflow-x-hidden
        scrollbar-hide
        bg-white
        ${className}
      `}
      dir="rtl"
    >
      {children}
    </div>
  );
};
