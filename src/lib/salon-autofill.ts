export interface SalonAutofillFields {
  salonName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
}

const SALON_AUTOFILL_KEY = "beauty-connect:salon-autofill";

const emptySalonAutofill: SalonAutofillFields = {
  salonName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  location: "",
};

function isBrowser() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function readSalonAutofill(): SalonAutofillFields {
  if (!isBrowser()) {
    return emptySalonAutofill;
  }

  try {
    const stored = window.localStorage.getItem(SALON_AUTOFILL_KEY);

    if (!stored) {
      return emptySalonAutofill;
    }

    const parsed = JSON.parse(stored) as Partial<SalonAutofillFields>;

    return {
      salonName: cleanText(parsed.salonName),
      contactName: cleanText(parsed.contactName),
      contactEmail: cleanText(parsed.contactEmail),
      contactPhone: cleanText(parsed.contactPhone),
      location: cleanText(parsed.location),
    };
  } catch {
    return emptySalonAutofill;
  }
}

export function saveSalonAutofill(fields: Partial<SalonAutofillFields>) {
  if (!isBrowser()) {
    return;
  }

  const current = readSalonAutofill();
  const next: SalonAutofillFields = {
    salonName: cleanText(fields.salonName) || current.salonName,
    contactName: cleanText(fields.contactName) || current.contactName,
    contactEmail:
      typeof fields.contactEmail === "string"
        ? cleanText(fields.contactEmail)
        : current.contactEmail,
    contactPhone: cleanText(fields.contactPhone) || current.contactPhone,
    location: cleanText(fields.location) || current.location,
  };

  window.localStorage.setItem(SALON_AUTOFILL_KEY, JSON.stringify(next));
}
