import type {
  InputHTMLAttributes,
} from 'react';

interface FormInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({
  label,
  error,
  id,
  ...inputProps
}: FormInputProps): React.JSX.Element {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className="mb-2 block text-[13px] font-semibold tracking-tight text-slate-700 transition-colors group-focus-within:text-violet-700"
      >
        {label}
      </label>

      <input
        id={id}
        {...inputProps}
        className={[
          'w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-sm text-slate-950 outline-none transition-all duration-300',
          'placeholder:text-slate-400',
          'hover:bg-white focus:bg-white focus:ring-4',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-violet-100',
          inputProps.className ?? '',
        ].join(' ')}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
