import { useId, type InputHTMLAttributes } from "react";
import { classNames } from "../../utils/classNames";
import { PasswordField } from "./PasswordField";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, className, id, type, ...props }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const inputProps = {
    ...props,
    id: inputId,
    "aria-invalid": Boolean(error),
    "aria-describedby": error || hint ? messageId : undefined,
    className: classNames(
      "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-4",
      error
        ? "border-red-400/70 focus:border-red-400 focus:ring-red-500/10"
        : "border-slate-700 focus:border-brand-400 focus:ring-brand-500/15",
      type !== "password" && "mt-2",
      className,
    ),
  };

  return (
    <div className="block text-sm font-medium text-slate-200">
      <label htmlFor={inputId}>{label}</label>
      {type === "password" ? <PasswordField {...inputProps} label={label} /> : <input {...inputProps} type={type} />}
      {error || hint ? (
        <span
          id={messageId}
          className={classNames("mt-2 block text-xs", error ? "text-red-300" : "text-slate-500")}
        >
          {error ?? hint}
        </span>
      ) : null}
    </div>
  );
}
