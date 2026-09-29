import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import './InfoPopover.css';

interface InfoPopoverProps {
  label: string;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function InfoPopover({ label, children, align = 'left' }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="info-popover" ref={rootRef}>
      <button
        type="button"
        className="info-popover__button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >i</button>
      {open && (
        <div id={id} className={`info-popover__panel info-popover__panel--${align}`} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </span>
  );
}
