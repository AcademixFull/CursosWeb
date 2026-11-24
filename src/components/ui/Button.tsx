import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Link } from "react-router";
import { buttonStyles, type ButtonSize, type ButtonVariant } from "./buttonStyles";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

export interface ButtonLinkProps extends ComponentProps<typeof Link>, StyleProps {}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, fullWidth, className })} {...props} />;
}
