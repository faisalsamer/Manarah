'use client';

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';

type PopoverSide = 'top' | 'bottom';
type PopoverAlign = 'start' | 'center' | 'end';

const sideClasses: Record<PopoverSide, string> = {
  bottom: 'top-full mt-2',
  top: 'bottom-full mb-2',
};

/**
 * Alignment is described in *physical* terms because the consumer wraps the
 * trigger + popover in a `relative` container. In RTL, "right-0" anchors the
 * popover's right edge to the trigger's right edge, so it grows to the left
 * (which matches the typical "open inward from a header bell" pattern).
 */
const alignClasses: Record<PopoverAlign, string> = {
  start: 'right-0',
  end: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
};

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Ref to the trigger element so click-outside ignores clicks on it
   *  (otherwise the trigger's click would close+reopen on every press). */
  triggerRef?: RefObject<HTMLElement | null>;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Optional fixed width (use any Tailwind w-* class). Caller may instead set min/max in `className`. */
  className?: string;
  children: ReactNode;
}

export function Popover({
  open,
  onClose,
  triggerRef,
  side = 'bottom',
  align = 'start',
  className = '',
  children,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      onClose();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      className={[
        'absolute',
        sideClasses[side],
        alignClasses[align],
        'bg-card-bg border border-border rounded-md shadow-lg',
        'font-arabic text-right',
        'focus:outline-none',
        className,
      ].join(' ')}
      style={{ zIndex: 'var(--z-index-modal)' }}
    >
      {children}
    </div>
  );
}
