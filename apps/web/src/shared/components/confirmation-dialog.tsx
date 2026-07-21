import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  tone?: 'danger' | 'primary';
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  isPending = false,
  tone = 'primary',
  children,
  onConfirm,
  onClose,
}: ConfirmationDialogProps): React.JSX.Element | null {
  const cancelButtonRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      document.body.style.overflow =
        originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-200'
      : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-200';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close confirmation dialog"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="relative w-full max-w-md animate-[fade-up_.25s_ease-out_both] rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div
          className={[
            'flex h-12 w-12 items-center justify-center rounded-2xl',
            tone === 'danger'
              ? 'bg-rose-50 text-rose-600'
              : 'bg-violet-50 text-violet-600',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <h2
          id="confirmation-title"
          className="mt-5 text-xl font-semibold tracking-[-0.025em] text-slate-950"
        >
          {title}
        </h2>

        <p
          id="confirmation-description"
          className="mt-2 text-sm leading-6 text-slate-500"
        >
          {description}
        </p>

        {children && (
          <div className="mt-5">
            {children}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {isPending
              ? 'Please wait...'
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}