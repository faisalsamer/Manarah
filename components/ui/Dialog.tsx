'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { IconButton } from './Button';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[min(92vw,1100px)]',
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  initialFocusRef,
}: DialogProps) {
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
        <div
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 'var(--z-index-modal)' }}
        >
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
              'pointer-events-auto w-full flex flex-col max-h-[90vh] overflow-hidden',
              'bg-[var(--color-card-bg)] rounded-[var(--radius-lg)]',
              'border border-[var(--color-border)] shadow-[var(--shadow-lg)]',
              'font-[var(--font-arabic)] text-right',
              'focus:outline-none',
              'data-[state=open]:animate-dialog-show',
              'data-[state=closed]:animate-dialog-hide',
              sizeClasses[size],
              className,
            ].join(' ')}
          >
            {!title && (
              <DialogPrimitive.Title className="sr-only">
                نافذة منبثقة
              </DialogPrimitive.Title>
            )}

            {(title || description || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="flex-1 min-w-0">
                  {title && (
                    <DialogPrimitive.Title className="text-[var(--text-h3)] font-bold text-[var(--color-text-primary)] leading-[var(--leading-tight)]">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-[var(--text-body-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-snug)]">
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
                  'flex-1 overflow-y-auto px-6 py-2',
                  'text-[var(--text-body)] text-[var(--color-text-primary)]',
                  'leading-[var(--leading-normal)]',
                  contentClassName,
                ].join(' ')}
              >
                {children}
              </div>
            )}

            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-6 border-t border-[var(--color-border)] mt-2">
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface DialogActionsProps {
  children: ReactNode;
  className?: string;
}

export function DialogActions({ children, className = '' }: DialogActionsProps) {
  return (
    <div className={['flex items-center justify-end gap-3', className].join(' ')}>
      {children}
    </div>
  );
}
