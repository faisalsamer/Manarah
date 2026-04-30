'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { IconButton } from './Button';

type SheetSide = 'right' | 'left' | 'top' | 'bottom';
type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sideClasses: Record<SheetSide, string> = {
  right: 'inset-y-0 right-0 h-full',
  left: 'inset-y-0 left-0 h-full',
  top: 'inset-x-0 top-0 w-full',
  bottom: 'inset-x-0 bottom-0 w-full',
};

const horizontalSizeClasses: Record<SheetSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-2xl',
  full: 'w-full max-w-[min(92vw,1100px)]',
};

const verticalSizeClasses: Record<SheetSize, string> = {
  sm: 'h-[30vh]',
  md: 'h-[50vh]',
  lg: 'h-[70vh]',
  xl: 'h-[85vh]',
  full: 'h-[92vh]',
};

const animationClasses: Record<SheetSide, string> = {
  right:
    'data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
  left:
    'data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left',
  top:
    'data-[state=open]:animate-sheet-in-top data-[state=closed]:animate-sheet-out-top',
  bottom:
    'data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom',
};

const edgeRadiusClasses: Record<SheetSide, string> = {
  right: 'border-l rounded-l-lg',
  left: 'border-r rounded-r-lg',
  top: 'border-b rounded-b-lg',
  bottom: 'border-t rounded-t-lg',
};

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  size?: SheetSize;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Sheet({
  open,
  onClose,
  side = 'right',
  size = 'xl',
  title,
  description,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  initialFocusRef,
}: SheetProps) {
  const isHorizontal = side === 'right' || side === 'left';
  const sizeCls = isHorizontal
    ? horizontalSizeClasses[size]
    : verticalSizeClasses[size];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={[
            'fixed inset-0 bg-[rgba(10,34,53,0.55)] backdrop-blur-sm',
            'data-[state=open]:animate-overlay-show',
            'data-[state=closed]:animate-overlay-hide',
          ].join(' ')}
          style={{ zIndex: 'var(--z-index-modal)' }}
        />
        <DialogPrimitive.Content
          dir="rtl"
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!closeOnOverlayClick) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!closeOnOverlayClick) event.preventDefault();
          }}
          onOpenAutoFocus={
            initialFocusRef
              ? (event) => {
                  if (initialFocusRef.current) {
                    event.preventDefault();
                    initialFocusRef.current.focus();
                  }
                }
              : undefined
          }
          className={[
            'fixed flex flex-col bg-card-bg',
            'border-border shadow-lg',
            'font-arabic text-right',
            'focus:outline-none',
            sideClasses[side],
            sizeCls,
            edgeRadiusClasses[side],
            animationClasses[side],
            className,
          ].join(' ')}
          style={{ zIndex: 'var(--z-index-modal)' }}
        >
          {!title && (
            <DialogPrimitive.Title className="sr-only">
              لوحة جانبية
            </DialogPrimitive.Title>
          )}

          {(title || description || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
              <div className="flex-1 min-w-0">
                {title && (
                  <DialogPrimitive.Title className="text-h3 font-bold text-text-primary leading-tight">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-body-sm text-text-secondary leading-snug">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showCloseButton && (
                <DialogPrimitive.Close asChild>
                  <IconButton
                    icon={<X size={18} />}
                    ariaLabel="إغلاق"
                    variant="ghost"
                    size="sm"
                  />
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          {children !== undefined && children !== null && (
            <div
              className={[
                'flex-1 overflow-y-auto px-6 py-4',
                'text-body text-text-primary',
                'leading-normal',
                contentClassName,
              ].join(' ')}
            >
              {children}
            </div>
          )}

          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface SheetActionsProps {
  children: ReactNode;
  className?: string;
}

export function SheetActions({ children, className = '' }: SheetActionsProps) {
  return (
    <div className={['flex items-center justify-end gap-3', className].join(' ')}>
      {children}
    </div>
  );
}
