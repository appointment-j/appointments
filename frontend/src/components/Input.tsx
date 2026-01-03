import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type BaseProps = {
  label?: string;
  error?: string;
  className?: string;
};

type InputProps =
  | (BaseProps &
      InputHTMLAttributes<HTMLInputElement> & {
        type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel';
      })
  | (BaseProps &
      TextareaHTMLAttributes<HTMLTextAreaElement> & {
        type: 'textarea';
      });

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>((props, ref) => {
  const { label, error, className = '', type = 'text', ...rest } = props;

  const baseClasses = `
    w-full
    px-4 py-3
    rounded-2xl
    border
    bg-white
    text-gray-900
    placeholder:text-gray-400
    focus:outline-none
    focus:ring-2
    focus:ring-primary/35
    focus:border-orange-300
    transition
    shadow-[0_6px_18px_rgba(0,0,0,0.04)]
    ${error ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}
    ${className}
  `;

  return (
    <div className="w-full" dir="rtl">
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700">
          {label}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={baseClasses}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          className={baseClasses}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
