/**
 * The signed-out backdrop: the design's single background artwork (navy gradient, green glows and slanted panels), scaled to
 * cover the screen. The same in light and dark.
 */
export function AuthBackdrop() {
  return <div aria-hidden="true" className="auth-backdrop pointer-events-none absolute inset-0" />;
}
