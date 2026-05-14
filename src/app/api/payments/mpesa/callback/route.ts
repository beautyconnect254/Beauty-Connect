import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StkCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number | string;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{
          Name?: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function callbackFromBody(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return (value as StkCallbackBody).Body?.stkCallback ?? null;
}

function metadataValue(
  items: Array<{
    Name?: string;
    Value?: string | number;
  }>,
  name: string,
) {
  return items?.find((item) => item.Name === name)?.Value ?? null;
}

function numericValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "mpesa-callback",
  });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Payment database is not configured." },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const callback = callbackFromBody(payload);

  if (!callback) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Invalid M-Pesa callback payload." },
      { status: 400 },
    );
  }

  const checkoutRequestId = callback.CheckoutRequestID ?? "";
  const resultCode = numericValue(callback.ResultCode);
  const metadataItems = callback.CallbackMetadata?.Item ?? [];
  const amount = numericValue(metadataValue(metadataItems, "Amount"));
  const mpesaReceiptNumber = metadataValue(
    metadataItems,
    "MpesaReceiptNumber",
  );
  const transactionDate = metadataValue(metadataItems, "TransactionDate");

  if (!checkoutRequestId || resultCode === null) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "CheckoutRequestID and ResultCode are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("process_mpesa_stk_callback", {
    target_checkout_request_id: checkoutRequestId,
    target_result_code: resultCode,
    target_result_description: callback.ResultDesc ?? "",
    target_mpesa_receipt_number:
      typeof mpesaReceiptNumber === "string"
        ? mpesaReceiptNumber
        : mpesaReceiptNumber === null
          ? null
          : String(mpesaReceiptNumber),
    target_transaction_date:
      transactionDate === null ? null : String(transactionDate),
    target_amount: amount,
    target_callback_payload: payload,
  });

  if (error) {
    const status = error.message.includes("not found") ? 404 : 500;

    console.error("M-Pesa callback processing failed", {
      checkoutRequestId,
      message: error.message,
    });

    return NextResponse.json(
      { ResultCode: 1, ResultDesc: error.message },
      { status },
    );
  }

  return NextResponse.json({
    ResultCode: 0,
    ResultDesc: "Accepted",
    data,
  });
}
