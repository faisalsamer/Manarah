'use client';

import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className = '' }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={['font-arabic', className].join(' ')}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function TabsList({ children, className = '', fullWidth = false }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={[
        'flex items-stretch gap-1 border-b border-border',
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export interface TabsItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: ReactNode;
  count?: ReactNode;
  urgent?: boolean;
}

export function TabsItem({
  value,
  icon,
  count,
  urgent = false,
  children,
  className = '',
  ...rest
}: TabsItemProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('<TabsItem> must be used inside <Tabs>');
  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onChange(value)}
      className={[
        'relative inline-flex items-center gap-2 px-5 py-3.5 -mb-px',
        'text-body-sm font-semibold',
        'border-b-2 transition-colors duration-[200ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
        active
          ? 'text-text-primary border-primary-400'
          : 'text-text-secondary border-transparent hover:text-text-primary',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {count !== undefined && count !== null && (
        <span
          className={[
            'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full',
            'text-micro font-bold leading-none',
            urgent
              ? 'bg-danger text-white'
              : active
                ? 'bg-primary-400 text-white'
                : 'bg-surface text-text-muted',
          ].join(' ')}
        >
          {count}
        </span>
      )}
    </button>
  );
}
