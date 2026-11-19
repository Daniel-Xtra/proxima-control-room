import { useSourceName } from "../api/queries";

/** The name of a pay-from wallet, for places that only hold its id (such as an approval request). */
export function SourceAccountName({ id }: { id: string }) {
  return <>{useSourceName(id)}</>;
}
