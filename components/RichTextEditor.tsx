import clsx from 'clsx';
import React, { useMemo } from 'react';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const htmlToPlainText = (value: string): string =>
  value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className,
}) => {
  const plainValue = useMemo(
    () => (/<[a-z][\s\S]*>/i.test(value) ? htmlToPlainText(value) : value),
    [value]
  );

  return (
    <div
      className={clsx(
        'rich-text-editor-shell',
        error && 'rich-text-editor-shell-error',
        disabled && 'rich-text-editor-shell-disabled',
        className
      )}
    >
      <textarea
        id={id}
        value={plainValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={8}
        className="min-h-48 w-full resize-y rounded-md border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
};

export default RichTextEditor;
