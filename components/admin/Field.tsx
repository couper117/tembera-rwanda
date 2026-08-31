import type { ReactNode } from "react";

/**
 * One labelled input, with its own error message.
 *
 * The four admin forms each hand-rolled this markup, which is why a validation
 * message could only ever be shown as a banner at the top: there was nowhere
 * to put it. `error` renders beside the input that caused it, and is wired to
 * the control with aria-describedby so a screen reader reads the problem with
 * the field rather than announcing it once, far away, on submit.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={`a-field${error ? " a-field--invalid" : ""}`}>
      <label className="a-label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="a-visually-hidden"> (required)</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="a-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="a-fielderror" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A titled group of fields.
 *
 * The place editor has 21 of them. In one column they are a wall; grouped by
 * what the editor is actually doing — describing it, locating it, saying how
 * to reach it — they are five short jobs.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="a-formsection">
      <div className="a-formsection__head">
        <h2 className="a-formsection__title">{title}</h2>
        {description && <p className="a-formsection__sub">{description}</p>}
      </div>
      <div className="a-formsection__body">{children}</div>
    </section>
  );
}
