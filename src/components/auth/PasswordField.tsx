import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { classNames } from "../../utils/classNames";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function PasswordField({ label, value, defaultValue, className, disabled, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const nextValue = String(value ?? defaultValue ?? "");
    // Keep secrets out of serialized HTML. The browser owner can still inspect the live input value.
    if (input && input.value !== nextValue) input.value = nextValue;
  }, [value, defaultValue]);

  return (
    <div className="relative mt-2" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false);
    }}>
      <input {...props} ref={inputRef} type={visible ? "text" : "password"}
        disabled={disabled} className={classNames(className, "pr-14")} />
      <button type="button" disabled={disabled} aria-controls={props.id}
        aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
        aria-pressed={visible} onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-1 my-1 flex w-11 items-center justify-center rounded-lg text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible ? <path d="m3 3 18 18" /> : null}
        </svg>
      </button>
    </div>
  );
}
