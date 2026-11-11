import React, { useState } from 'react';
import { shortHash } from '../core/crypto';
import { CountUp } from '../motion';

export function Card({
  children,
  className = '',
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={`card ${pad ? 'card--pad' : ''} ${className}`}>{children}</div>;
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="section-title__right">{right}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  countProps,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'green' | 'gold' | 'blue' | 'red';
  /** Formatting for the count-up animation when `value` is a number. */
  countProps?: { decimals?: number; prefix?: string; suffix?: string };
}) {
  const numeric = typeof value === 'number';
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">
        {numeric ? <CountUp value={value as number} {...countProps} /> : value}
      </div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  PENDING: 'amber',
  VERIFIED: 'green',
  FUNDED: 'blue',
  REJECTED: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge--${STATUS_TONE[status] ?? 'default'}`}>{status}</span>;
}

export function HashPill({
  value,
  full = false,
  label,
  static: isStatic = false,
}: {
  value: string;
  full?: boolean;
  label?: string;
  /**
   * Render a non-interactive variant. A <button> inside another <button> is
   * invalid HTML and React warns about it — use this when the pill only needs
   * to display a digest (e.g. inside the clickable block header).
   */
  static?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const display = full ? value : shortHash(value);

  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (isStatic) {
    return (
      <span className="hashpill hashpill--static" title={value}>
        {label && <span className="hashpill__label">{label}</span>}
        <code>{display}</code>
      </span>
    );
  }

  return (
    <button
      className="hashpill"
      title={value}
      onClick={copy}
    >
      {label && <span className="hashpill__label">{label}</span>}
      <code>{display}</code>
      <span className="hashpill__copy">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="empty__icon">🌱</div>
      <div className="empty__title">{title}</div>
      {hint && <div className="empty__hint">{hint}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  small,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'gold' | 'danger' | 'soft';
  disabled?: boolean;
  type?: 'button' | 'submit';
  small?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${small ? 'btn--sm' : ''} ${full ? 'btn--full' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress">
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
