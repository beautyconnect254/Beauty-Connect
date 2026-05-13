import { Building2, CreditCard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { PaymentInstructions } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PaymentInstructionsCardProps {
  instructions: PaymentInstructions;
}

export function PaymentInstructionsCard({
  instructions,
}: PaymentInstructionsCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <div className="rounded-md bg-amber-100 p-2 text-amber-800">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[color:var(--foreground)]">
              Payment instructions
            </h2>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
              M-Pesa STK Push. Contacts unlock after Daraja confirms payment.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <InstructionItem
            label="Platform fee"
            value={formatCurrency(instructions.deposit_amount)}
          />
          <InstructionItem
            label="Payment reference"
            value={instructions.payment_reference}
          />
          <InstructionItem label="Paybill" value={instructions.mpesa_paybill} />
        </div>

        <div className="grid gap-2">
          <div className="rounded-md border border-[color:var(--border)] p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[color:var(--muted-foreground)]">
              <Building2 className="h-3.5 w-3.5" />
              M-Pesa
            </div>
            <div className="mt-2 grid gap-1 text-sm">
              <p>
                <span className="font-bold">Paybill Number:</span>{" "}
                {instructions.mpesa_paybill}
              </p>
              <p>
                <span className="font-bold">Account Number:</span>{" "}
                {instructions.mpesa_account}
              </p>
            </div>
          </div>
        </div>

        <p className="rounded-md bg-[color:var(--muted)] px-3 py-2 text-xs font-semibold leading-5 text-[color:var(--muted-foreground)]">
          {instructions.notes}
        </p>
      </CardContent>
    </Card>
  );
}

function InstructionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[color:var(--muted)] p-3">
      <p className="text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-extrabold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
