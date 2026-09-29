import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './InfoPopover.css';

interface InfoPopoverProps {
  label: string;
  children: ReactNode;
  align?: 'left' | 'right';
}

interface Position { top: number; left: number; }

export function InfoPopover({ label, children, align = 'left' }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button || typeof window === 'undefined') return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(330, window.innerWidth - 28);
    const gutter = 14;
    const left = align === 'right'
      ? Math.max(gutter, Math.min(window.innerWidth - width - gutter, rect.right - width))
      : Math.max(gutter, Math.min(window.innerWidth - width - gutter, rect.left));
    const measuredHeight = Math.min(panelRef.current?.offsetHeight ?? 300, Math.max(220, window.innerHeight - 48));
    const down = rect.bottom + 8;
    const top = down + measuredHeight <= window.innerHeight - gutter
      ? down
      : Math.max(gutter, rect.top - measuredHeight - 8);
    setPosition({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const onViewport = () => updatePosition();
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewport);
    window.addEventListener('scroll', onViewport, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewport);
      window.removeEventListener('scroll', onViewport, true);
    };
  }, [open, updatePosition]);

  const panelStyle: CSSProperties = {
    top: position.top,
    left: position.left,
    width: 'min(330px, calc(100vw - 28px))',
    maxHeight: 'min(360px, calc(100vh - 48px))',
  };

  return (
    <span className="info-popover" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="info-popover__button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >i</button>
      {open && createPortal(
        <div id={id} ref={panelRef} className="info-popover__panel" style={panelStyle} role="dialog" aria-label={label}>
          {children}
        </div>,
        document.body,
      )}
    </span>
  );
}
