'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

// ─── Field wrapper ───────────────────────────────────────────
export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  required = false,
  error,
  htmlFor,
  children,
  className = '',
}: FieldProps) {
  return (
    <div
      className={[
        'flex flex-col gap-1.5 font-arabic text-right',
        className,
      ].join(' ')}
    >
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label
              htmlFor={htmlFor}
              className="text-body-sm font-semibold text-text-primary"
            >
              {label}
              {required && (
                <span className="text-danger"> *</span>
              )}
            </label>
          )}
          {hint && (
            <span className="text-caption text-text-muted">
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
      {error && (
        <span
          role="alert"
          className="text-caption text-danger font-medium"
        >
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Shared input chrome ─────────────────────────────────────
type InputSize = 'sm' | 'md' | 'lg';

const inputSizeClasses: Record<InputSize, string> = {
  sm: 'h-9 text-body-sm px-3',
  md: 'h-11 text-body px-4',
  lg: 'h-12 text-body-lg px-4',
};

const inputBaseClasses =
  'bg-card-bg border rounded-sm ' +
  'font-arabic text-text-primary ' +
  'placeholder:text-text-muted ' +
  'transition-colors duration-[150ms] ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-300 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface';

const borderFor = (invalid: boolean) =>
  invalid
    ? 'border-danger focus:border-danger focus:ring-[var(--color-danger-light)]'
    : 'border-border focus:border-primary-400';

// ─── Input ───────────────────────────────────────────────────
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  invalid?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    inputSize = 'md',
    startAdornment,
    endAdornment,
    invalid = false,
    fullWidth = true,
    className = '',
    ...rest
  },
  ref,
) {
  if (!startAdornment && !endAdornment) {
    return (
      <input
        ref={ref}
        className={[
          inputBaseClasses,
          inputSizeClasses[inputSize],
          borderFor(invalid),
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...rest}
      />
    );
  }

  return (
    <div
      className={[
        'relative flex items-center',
        fullWidth ? 'w-full' : 'inline-flex',
      ].join(' ')}
    >
      {startAdornment && (
        <span className="absolute right-3 inset-y-0 flex items-center text-text-muted pointer-events-none">
          {startAdornment}
        </span>
      )}
      <input
        ref={ref}
        className={[
          inputBaseClasses,
          inputSizeClasses[inputSize],
          borderFor(invalid),
          fullWidth ? 'w-full' : '',
          startAdornment ? 'pr-10' : '',
          endAdornment ? 'pl-10' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {endAdornment && (
        <span className="absolute left-3 inset-y-0 flex items-center text-text-muted pointer-events-none">
          {endAdornment}
        </span>
      )}
    </div>
  );
});

// ─── TimeInput ───────────────────────────────────────────────
export type TimeInputProps = Omit<InputProps, 'type'>;

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  function TimeInput(props, ref) {
    return <Input ref={ref} type="time" {...props} />;
  },
);

// ─── Textarea ────────────────────────────────────────────────
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { invalid = false, fullWidth = true, rows = 4, className = '', ...rest },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[
          'bg-card-bg border rounded-sm px-4 py-3',
          'font-arabic text-body text-text-primary',
          'placeholder:text-text-muted',
          'transition-colors duration-[150ms] resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          fullWidth ? 'w-full' : 'w-auto',
          borderFor(invalid),
          className,
        ].join(' ')}
        {...rest}
      />
    );
  },
);

// ─── Select ──────────────────────────────────────────────────
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  inputSize?: InputSize;
  invalid?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      inputSize = 'md',
      invalid = false,
      fullWidth = true,
      placeholder,
      className = '',
      children,
      value,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        className={[
          'relative',
          fullWidth ? 'w-full' : 'w-auto inline-block',
        ].join(' ')}
      >
        <select
          ref={ref}
          value={value}
          className={[
            'w-full appearance-none cursor-pointer',
            'bg-card-bg border rounded-sm',
            'font-arabic text-text-primary',
            'transition-colors duration-[150ms]',
            'focus:outline-none focus:ring-2 focus:ring-primary-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Chevron sits on the visual end (left in RTL)
            'pl-10',
            inputSizeClasses[inputSize],
            borderFor(invalid),
            className,
          ].join(' ')}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled hidden={value !== '' && value !== undefined}>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
    );
  },
);

// ─── Checkbox ────────────────────────────────────────────────
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      description,
      invalid = false,
      className = '',
      id: idProp,
      checked,
      disabled,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    return (
      <label
        htmlFor={id}
        className={[
          'inline-flex items-start gap-3 font-arabic select-none',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
        ].join(' ')}
      >
        <span className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...rest}
          />
          <span
            aria-hidden
            className={[
              'flex items-center justify-center size-5 rounded-xs',
              'border-[1.5px] transition-all duration-[150ms]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-2',
              invalid
                ? 'border-danger'
                : 'border-border-strong',
              'peer-checked:bg-primary-400 peer-checked:border-primary-400',
              'peer-checked:[&>svg]:opacity-100',
              'peer-disabled:bg-surface',
            ].join(' ')}
          >
            <Check
              size={14}
              strokeWidth={3}
              className="opacity-0 text-white transition-opacity"
            />
          </span>
        </span>
        {(label || description) && (
          <span className="flex-1 text-right">
            {label && (
              <span className="block text-body text-text-primary font-medium leading-snug">
                {label}
              </span>
            )}
            {description && (
              <span className="block mt-1 text-caption text-text-secondary leading-normal">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  },
);

// ─── Toggle (Switch) ─────────────────────────────────────────
type ToggleSize = 'sm' | 'md';

interface ToggleDims {
  track: string;
  thumb: string;
  on: string;
  off: string;
}

const toggleDims: Record<ToggleSize, ToggleDims> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'size-3',
    // RTL: "on" pushes the thumb to the visual end (left).
    on: '-translate-x-[18px]',
    off: '-translate-x-0.5',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'size-5',
    on: '-translate-x-[22px]',
    off: '-translate-x-0.5',
  },
};

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  size?: ToggleSize;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
  size = 'md',
  disabled,
  className = '',
  ...rest
}: ToggleProps) {
  const d = toggleDims[size];
  return (
    <label
      className={[
        'inline-flex items-start gap-3 font-arabic select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={[
          'relative shrink-0 rounded-full transition-colors duration-[200ms]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
          d.track,
          checked ? 'bg-primary-400' : 'bg-border-strong',
        ].join(' ')}
        {...rest}
      >
        <span
          aria-hidden
          className={[
            'absolute top-1/2 right-0 -translate-y-1/2',
            'bg-white rounded-full shadow-xs transition-transform duration-[200ms]',
            d.thumb,
            checked ? d.on : d.off,
          ].join(' ')}
          style={{ transitionTimingFunction: 'var(--ease-spring)' }}
        />
      </button>
      {(label || description) && (
        <span className="flex-1 text-right">
          {label && (
            <span className="block text-body text-text-primary font-medium leading-snug">
              {label}
            </span>
          )}
          {description && (
            <span className="block mt-1 text-caption text-text-secondary">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

// ─── MoneyInput ──────────────────────────────────────────────
export interface MoneyInputProps
  extends Omit<InputProps, 'type' | 'startAdornment' | 'inputMode'> {
  currency?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    { currency = 'SAR', inputSize = 'lg', className = '', ...rest },
    ref,
  ) {
    return (
      <Input
        ref={ref}
        type="number"
        step="0.01"
        min={0}
        inputMode="decimal"
        inputSize={inputSize}
        startAdornment={
          <span className="text-body-sm font-semibold text-text-secondary">
            {currency}
          </span>
        }
        className={['font-numbers', className].join(' ')}
        {...rest}
      />
    );
  },
);

// ─── RadioCardGroup ──────────────────────────────────────────
const RadioCardContext = createContext<{
  value: string | undefined;
  onChange: (v: string) => void;
  name: string;
} | null>(null);

export interface RadioCardGroupProps {
  value: string | undefined;
  onChange: (value: string) => void;
  name?: string;
  columns?: 2 | 3;
  children: ReactNode;
  className?: string;
}

export function RadioCardGroup({
  value,
  onChange,
  name,
  columns = 2,
  children,
  className = '',
}: RadioCardGroupProps) {
  const generatedName = useId();
  return (
    <RadioCardContext.Provider
      value={{ value, onChange, name: name ?? generatedName }}
    >
      <div
        role="radiogroup"
        className={[
          'grid gap-3',
          columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3',
          className,
        ].join(' ')}
      >
        {children}
      </div>
    </RadioCardContext.Provider>
  );
}

export interface RadioCardProps {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  example?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function RadioCard({
  value,
  title,
  description,
  example,
  icon,
  disabled = false,
  className = '',
  children,
}: RadioCardProps) {
  const ctx = useContext(RadioCardContext);
  if (!ctx) throw new Error('<RadioCard> must be used inside <RadioCardGroup>');
  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={() => !disabled && ctx.onChange(value)}
      className={[
        'group flex flex-col items-start gap-2 p-5 text-right',
        'rounded-md border-[1.5px] transition-all duration-[200ms]',
        'font-arabic',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        active
          ? 'bg-primary-400 text-white border-primary-400 shadow-teal'
          : 'bg-card-bg border-border hover:border-primary-300',
        className,
      ].join(' ')}
    >
      {icon && (
        <span
          className={[
            'mb-1',
            active ? 'text-white' : 'text-primary-400',
          ].join(' ')}
        >
          {icon}
        </span>
      )}
      <span className="text-h4 font-bold leading-tight">
        {title}
      </span>
      {description && (
        <span
          className={[
            'text-body-sm leading-snug',
            active ? 'text-white/85' : 'text-text-secondary',
          ].join(' ')}
        >
          {description}
        </span>
      )}
      {example && (
        <span
          className={[
            'text-caption italic',
            active ? 'text-white/70' : 'text-text-muted',
          ].join(' ')}
        >
          {example}
        </span>
      )}
      {children}
    </button>
  );
}
