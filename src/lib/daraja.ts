import { Buffer } from "node:buffer";

export interface DarajaStkPushInput {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}

export interface DarajaStkPushResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: "sandbox" | "production";
}

function cleanEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function darajaConfig(): DarajaConfig {
  const environmentValue = cleanEnv("DARAJA_ENV").toLowerCase();
  const environment =
    environmentValue === "production" || environmentValue === "live"
      ? "production"
      : "sandbox";
  const config = {
    consumerKey: cleanEnv("DARAJA_CONSUMER_KEY"),
    consumerSecret: cleanEnv("DARAJA_CONSUMER_SECRET"),
    shortcode: cleanEnv("DARAJA_SHORTCODE"),
    passkey: cleanEnv("DARAJA_PASSKEY"),
    callbackUrl: cleanEnv("DARAJA_CALLBACK_URL"),
    environment,
  } satisfies DarajaConfig;
  const envNames = {
    consumerKey: "DARAJA_CONSUMER_KEY",
    consumerSecret: "DARAJA_CONSUMER_SECRET",
    shortcode: "DARAJA_SHORTCODE",
    passkey: "DARAJA_PASSKEY",
    callbackUrl: "DARAJA_CALLBACK_URL",
  } satisfies Record<keyof Omit<DarajaConfig, "environment">, string>;
  const missing = Object.entries(envNames)
    .filter(([key]) => !config[key as keyof typeof envNames])
    .map(([, name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Daraja environment variables: ${missing.join(", ")}.`);
  }

  return config;
}

function baseUrl(environment: DarajaConfig["environment"]) {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function eatTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}${values.get("month")}${values.get("day")}${values.get("hour")}${values.get("minute")}${values.get("second")}`;
}

function stkPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

export function normalizeMpesaPhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  const normalized =
    digits.startsWith("254") && digits.length === 12
      ? digits
      : digits.startsWith("0") && digits.length === 10
        ? `254${digits.slice(1)}`
        : digits.length === 9
          ? `254${digits}`
          : digits;

  if (!/^254[17]\d{8}$/.test(normalized)) {
    throw new Error("Enter a valid Safaricom M-Pesa phone number.");
  }

  return normalized;
}

export function darajaAccountReference(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return `BC${compact.slice(-10) || Date.now().toString().slice(-10)}`.slice(0, 12);
}

export async function getDarajaAccessToken() {
  const config = darajaConfig();
  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
  ).toString("base64");
  const response = await fetch(
    `${baseUrl(config.environment)}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    },
  );
  const body = await parseJsonResponse(response);
  const accessToken = typeof body.access_token === "string" ? body.access_token : "";

  if (!response.ok || !accessToken) {
    throw new Error(
      typeof body.errorMessage === "string"
        ? body.errorMessage
        : "Could not authenticate with Daraja.",
    );
  }

  return accessToken;
}

export function redactedStkPayload(input: DarajaStkPushInput) {
  const config = darajaConfig();
  const timestamp = eatTimestamp();

  return {
    BusinessShortCode: config.shortcode,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: input.amount,
    PartyA: input.phoneNumber,
    PartyB: config.shortcode,
    PhoneNumber: input.phoneNumber,
    CallBackURL: config.callbackUrl,
    AccountReference: input.accountReference,
    TransactionDesc: input.transactionDesc,
  };
}

export async function initiateDarajaStkPush(input: DarajaStkPushInput) {
  const config = darajaConfig();
  const accessToken = await getDarajaAccessToken();
  const timestamp = eatTimestamp();
  const payload = {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config.shortcode, config.passkey, timestamp),
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: input.amount,
    PartyA: input.phoneNumber,
    PartyB: config.shortcode,
    PhoneNumber: input.phoneNumber,
    CallBackURL: config.callbackUrl,
    AccountReference: input.accountReference,
    TransactionDesc: input.transactionDesc,
  };
  const response = await fetch(
    `${baseUrl(config.environment)}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  const body = (await parseJsonResponse(response)) as DarajaStkPushResponse;

  if (!response.ok) {
    throw new Error(
      body.errorMessage ||
        body.ResponseDescription ||
        "Daraja STK Push request failed.",
    );
  }

  return body;
}
