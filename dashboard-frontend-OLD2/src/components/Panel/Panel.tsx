// src/components/Panel/Panel.tsx
import type { ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  children: ReactNode;
  recessed?: boolean;
  className?: string;
}

export function Panel({ title, children, recessed = false, className = '' }: PanelProps) {
  return (
    <section className={`panel ${recessed ? 'panel--recessed' : ''} ${className}`}>
      <h2 className="panel__title">{title}</h2>
      <div className="panel__body">{children}</div>
    </section>
  );
}
