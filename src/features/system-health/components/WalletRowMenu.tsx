import { ArrowSquareOut, DotsThree, Hash } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { t } from "@/shared/i18n/t";

interface WalletRowMenuProps {
  name: string;
  /** Left out when no number can be requested for the wallet. */
  onRequest?: () => void;
  onOpenCustomer: () => void;
}

export function WalletRowMenu({ name, onRequest, onOpenCustomer }: WalletRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t("wallets.menu.for", { name })}
        >
          <DotsThree size={20} weight="bold" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {onRequest ? (
          <DropdownMenuItem onSelect={onRequest}>
            <Hash aria-hidden="true" />
            {t("wallets.request.title")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onOpenCustomer}>
          <ArrowSquareOut aria-hidden="true" />
          {t("wallets.menu.open")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
