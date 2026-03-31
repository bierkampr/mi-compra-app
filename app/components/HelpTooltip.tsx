"use client";
import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  content: string;
  align?: 'left' | 'right' | 'center';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, content, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          isOpen
            ? 'bg-brand-accent/20 text-brand-accent'
            : 'bg-white/5 text-brand-muted/40 hover:text-brand-accent hover:bg-brand-accent/10'
        }`}
      >
        <HelpCircle size={12} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-7 ${alignClass} z-[800] w-64 animate-in fade-in zoom-in-95 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div
            className={`absolute -top-1.5 w-3 h-3 bg-brand-card border-l border-t border-brand-accent/20 rotate-45 ${
              align === 'right' ? 'right-2' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-2'
            }`}
          />
          <div className="card-premium !p-4 !rounded-2xl border-brand-accent/25 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            <div className="flex justify-between items-start mb-2 gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-accent leading-tight">
                {title}
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-muted/30 hover:text-brand-muted transition-colors flex-shrink-0 -mt-0.5"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-[10px] font-semibold text-white/70 leading-relaxed">{content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
