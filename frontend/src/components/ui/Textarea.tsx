import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { field } from './fieldStyles'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(field, 'min-h-[110px] resize-y py-3', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'
