import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BDB]/35 dark:focus-visible:ring-[#3B5BDB]/40 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[#3B5BDB] text-white shadow-xs hover:bg-[#364FC7] dark:bg-[#3B5BDB] dark:text-white dark:hover:bg-[#364FC7]',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200/80 dark:bg-[#222222] dark:text-[#F4F4F5] dark:hover:bg-[#2c2c2c]',
        outline: 'border border-neutral-200/90 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 dark:border-[#303030] dark:bg-[#191919] dark:text-[#F4F4F5] dark:hover:bg-[#222222] dark:hover:border-[#444444] shadow-xs',
        ghost: 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-[#A1A1AA] dark:hover:bg-[#222222] dark:hover:text-[#F4F4F5]',
        destructive: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700',
        subtle: 'border border-neutral-200/60 bg-neutral-50/70 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-[#303030] dark:bg-[#141414] dark:text-[#A1A1AA] dark:hover:bg-[#222222] dark:hover:text-[#F4F4F5]',
      },
      size: {
        default: 'h-10 px-4 py-2 rounded-xl text-sm',
        sm: 'h-8 px-3 rounded-lg text-xs',
        lg: 'h-11 px-6 rounded-xl text-sm font-semibold',
        pill: 'h-9 px-4 rounded-full text-xs font-semibold',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = 'Button';
