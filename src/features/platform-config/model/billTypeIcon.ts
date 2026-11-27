import {
  Bank,
  Bus,
  CreditCard,
  DeviceMobile,
  DiceFive,
  FilmSlate,
  ForkKnife,
  GlobeHemisphereWest,
  GraduationCap,
  Lightning,
  Receipt,
  ShieldCheck,
  Stack,
  Television,
  type Icon,
} from "@phosphor-icons/react";

// Bill types are named by the provider, so match on words. The first match wins.
const ICONS: [RegExp, Icon][] = [
  [/international/i, GlobeHemisphereWest],
  [/airtime|data/i, DeviceMobile],
  [/bet|lottery/i, DiceFive],
  [/electric/i, Lightning],
  [/educat|school/i, GraduationCap],
  [/tv|cable/i, Television],
  [/entertain/i, FilmSlate],
  [/food/i, ForkKnife],
  [/government/i, Bank],
  [/insurance/i, ShieldCheck],
  [/transport|toll/i, Bus],
  [/collection/i, Stack],
  [/payment/i, CreditCard],
];

export function billTypeIcon(name: string): Icon {
  return ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Receipt;
}
