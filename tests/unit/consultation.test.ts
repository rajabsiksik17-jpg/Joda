import { describe, expect, it } from "vitest";
import { listCountries, isCountryCode } from "@/lib/consultation/countries";
import { normalizePhone, validateConsultation, type ConsultationValues } from "@/lib/consultation/rules";

const valid: ConsultationValues = {
  name: "Test Person",
  company: "",
  email: "person@example.com",
  phoneCountry: "JO",
  phoneNumber: "079 123 4567",
  country: "JO",
  serviceId: "",
  preferredContact: "email",
  message: "We would like to discuss a governance framework.",
  consent: true,
};

describe("phone normalization", () => {
  it("turns a national Jordanian number into E.164", () => {
    expect(normalizePhone("0791234567", "JO")).toMatchObject({ e164: "+962791234567", dial: "+962", country: "JO" });
  });

  it("accepts international input regardless of the selected country", () => {
    expect(normalizePhone("+971 50 123 4567", "JO")).toMatchObject({ e164: "+971501234567", country: "AE" });
  });

  it("rejects numbers that are not valid for the country", () => {
    expect(normalizePhone("12345", "JO")).toBeNull();
    expect(normalizePhone("", "JO")).toBeNull();
    expect(normalizePhone("0791234567", "XX")).toBeNull();
  });
});

describe("consultation validation", () => {
  it("accepts a complete request", () => {
    expect(validateConsultation(valid)).toEqual({});
  });

  it("requires name, e-mail, phone, message and consent", () => {
    const e = validateConsultation({ ...valid, name: "", email: "nope", phoneNumber: "", message: "", consent: false });
    expect(e).toMatchObject({ name: "required", email: "invalidEmail", phoneNumber: "required", message: "required", consent: "consentRequired" });
  });

  it("flags an invalid phone number and an unknown contact method", () => {
    expect(validateConsultation({ ...valid, phoneNumber: "123" }).phoneNumber).toBe("invalidPhone");
    expect(validateConsultation({ ...valid, preferredContact: "fax" }).preferredContact).toBe("required");
  });

  it("rejects malformed country codes", () => {
    expect(validateConsultation({ ...valid, phoneCountry: "jordan" }).phoneNumber).toBe("invalidCountry");
    expect(validateConsultation({ ...valid, country: "J" }).country).toBe("invalidCountry");
  });
});

describe("country list", () => {
  it("is localized, sorted and puts preferred countries first", () => {
    const { preferred, all } = listCountries("ar", ["JO", "SA", "ZZ"]);
    expect(preferred.map((c) => c.code)).toEqual(["JO", "SA"]);
    expect(preferred[0]).toMatchObject({ dial: "+962", name: "الأردن" });
    expect(all.length).toBeGreaterThan(200);
    expect(isCountryCode("JO")).toBe(true);
    expect(isCountryCode("ZZ")).toBe(false);
  });
});
