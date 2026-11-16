import {
  Bank,
  ChartBar,
  CreditCard,
  Lock,
  PiggyBank,
  ShieldCheck,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";

const ICONS: Icon[] = [Wallet, Bank, CreditCard, PiggyBank, ShieldCheck, ChartBar, Lock];

const SPOTS = Array.from({ length: 36 }, (_, i) => ({
  Glyph: ICONS[i % ICONS.length]!,
  left: (i * 37) % 97,
  top: (i * 53) % 91,
  rotate: ((i * 29) % 50) - 25,
}));

/** Faint product icons scattered behind the signed-out screens, under a soft tint. */
export function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPOTS.map(({ Glyph, left, top, rotate }, index) => (
        <Glyph
          key={index}
          size={28}
          className="absolute text-blue"
          style={{ left: `${left}%`, top: `${top}%`, transform: `rotate(${rotate}deg)` }}
        />
      ))}
      <div className="auth-overlay" />
    </div>
  );
}
