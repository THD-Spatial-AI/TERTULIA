import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { field } from './fieldStyles'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(field, 'h-10', className)} {...props} />
  ),
)
Input.displayName = 'Input'
