import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import { requestStatement } from "../api/transactionsApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

const dayInput = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

export function StatementDialog({ open, onOpenChange, customerId, customerName }: Props) {
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [recipient, setRecipient] = useState("owner");
  const [email, setEmail] = useState("");
  const [start, setStart] = useState(() => dayInput(30));
  const [end, setEnd] = useState(() => dayInput(0));
  const invalid =
    !start || !end || start > end || (recipient === "third-party" && !email.includes("@"));

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("statement.title")}
      description={customerName}
      impact={recipient === "third-party" ? t("statement.thirdPartyImpact") : undefined}
      confirmLabel={t("statement.confirm")}
      blocked={invalid}
      onConfirm={async ({ reason }) => {
        await requestStatement({
          customerId,
          format,
          recipient: recipient === "owner" ? "customer" : "third_party",
          ...(recipient === "owner" ? {} : { email }),
          from: new Date(`${start}T00:00:00`).toISOString(),
          to: new Date(`${end}T23:59:59`).toISOString(),
          reason,
        });
        return t("statement.done");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-start">{t("statement.start")}</Label>
          <Input
            id="statement-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-end">{t("statement.end")}</Label>
          <Input
            id="statement-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-format">{t("statement.format")}</Label>
          <Select value={format} onValueChange={(value) => setFormat(value as "pdf" | "csv")}>
            <SelectTrigger id="statement-format" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-recipient">{t("statement.recipient")}</Label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger id="statement-recipient" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">{t("statement.owner")}</SelectItem>
              <SelectItem value="third-party">{t("statement.thirdParty")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {recipient === "third-party" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-email">{t("statement.email")}</Label>
          <Input
            id="statement-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : null}
    </ActionDialog>
  );
}
