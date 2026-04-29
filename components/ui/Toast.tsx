'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

export interface ToastInput {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Omit<ToastInput, 'description' | 'action'>> {
  id: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
}

type Listener = (toasts: ToastItem[]) => void;

let store: ToastItem[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  for (const l of listeners) l(store);
};

const genId = () =>
  `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function toast(input: ToastInput): string {
  const item: ToastItem = {
    id: genId(),
    title: input.title,
    description: input.description,
    variant: input.variant ?? 'info',
    duration: input.duration ?? 4000,
    action: input.action,
  };
  store = [...store, item];
  notify();
  return item.id;
}

export function dismissToast(id: string) {
  store = store.filter((t) => t.id !== id);
  notify();
}

export function dismissAllToasts() {
  store = [];
  notify();
}

toast.success = (title: ReactNode, description?: ReactNode) =>
  toast({ title, description, variant: 'success' });
toast.error = (title: ReactNode, description?: ReactNode) =>
  toast({ title, description, variant: 'error' });
toast.warning = (title: ReactNode, description?: ReactNode) =>
  toast({ title, description, variant: 'warning' });
toast.info = (title: ReactNode, description?: ReactNode) =>
  toast({ title, description, variant: 'info' });

const variantConfig: Record<
  ToastVariant,
  { icon: ReactNode; iconColor: string; accent: string; iconBg: string }
> = {
  success: {
    icon: <CheckCircle2 size={20} strokeWidth={2.25} />,
    iconColor: 'text-[var(--color-success)]',
    iconBg: 'bg-[var(--color-success-light)]',
    accent: 'border-r-[var(--color-success)]',
  },
  error: {
    icon: <AlertCircle size={20} strokeWidth={2.25} />,
    iconColor: 'text-[var(--color-danger)]',
    iconBg: 'bg-[var(--color-danger-light)]',
    accent: 'border-r-[var(--color-danger)]',
  },
  warning: {
    icon: <AlertTriangle size={20} strokeWidth={2.25} />,
    iconColor: 'text-[var(--color-warning)]',
    iconBg: 'bg-[var(--color-warning-light)]',
    accent: 'border-r-[var(--color-warning)]',
  },
  info: {
    icon: <Info size={20} strokeWidth={2.25} />,
    iconColor: 'text-[var(--color-info)]',
    iconBg: 'bg-[var(--color-info-light)]',
    accent: 'border-r-[var(--color-info)]',
  },
};

const TRANSITION_MS = 250;

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
  const config = variantConfig[item.variant];

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = setTimeout(() => close(), item.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.duration]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    setTimeout(() => onDismiss(item.id), TRANSITION_MS);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className={[
        'pointer-events-auto flex items-start gap-3',
        'min-w-[280px] max-w-[420px] p-4',
        'bg-[var(--color-card-bg)] rounded-[var(--radius-md)]',
        'border border-[var(--color-border)] border-r-[3px]',
        config.accent,
        'shadow-[var(--shadow-md)]',
        'font-[var(--font-arabic)] text-right',
        'transition-all duration-[250ms]',
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-[0.97]',
      ].join(' ')}
      style={{ transitionTimingFunction: 'var(--ease-spring)' }}
    >
      <div
        className={[
          'flex-shrink-0 flex items-center justify-center size-9 rounded-full',
          config.iconBg,
          config.iconColor,
        ].join(' ')}
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)] leading-[var(--leading-snug)]">
          {item.title}
        </div>
        {item.description && (
          <div className="mt-1 text-[var(--text-body-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-snug)]">
            {item.description}
          </div>
        )}
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              close();
            }}
            className="mt-2 text-[var(--text-body-sm)] font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] hover:underline underline-offset-2 transition-colors"
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label="إغلاق"
        onClick={close}
        className="flex-shrink-0 p-1 -m-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
      >
        <X size={16} />
      </button>
    </div>
  );
}

const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

export interface ToasterProps {
  position?: ToastPosition;
  className?: string;
}

export function Toaster({
  position = 'bottom-left',
  className = '',
}: ToasterProps = {}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const listener: Listener = (next) => setItems([...next]);
    listeners.add(listener);
    listener(store);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!mounted) return null;

  const orderClass = position.startsWith('top-') ? 'flex-col' : 'flex-col-reverse';

  return createPortal(
    <div
      aria-live="polite"
      className={[
        'fixed flex gap-2 pointer-events-none',
        orderClass,
        positionClasses[position],
        className,
      ].join(' ')}
      style={{ zIndex: 'var(--z-index-toast)' }}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  );
}
