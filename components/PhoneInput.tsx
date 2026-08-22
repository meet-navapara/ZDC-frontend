"use client";

import { useEffect, useRef, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  detectCountryFromPhone,
  dialCodeForCountry,
  getCountryByName,
  parsePhoneNumber,
  phoneDialOptions,
} from "@/lib/phoneCountries";

type Props = {
  value: string;
  onChange: (full: string) => void;
  country?: string;
  onCountryDetected?: (country: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

const shellClass =
  "relative flex w-full items-stretch overflow-visible rounded-xl border border-ink/15 bg-white text-ink transition " +
  "focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/15 " +
  "dark:border-white/15 dark:bg-[#12100e] dark:focus-within:ring-sage/25";

const numberClass =
  "min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-ink outline-none " +
  "placeholder:text-ink-muted dark:text-[#f4efe7] disabled:opacity-50";

export function PhoneInput({
  value,
  onChange,
  country = "Kenya",
  onCountryDetected,
  required,
  disabled,
  placeholder = "712 345 678",
  inputClassName = "",
  "aria-label": ariaLabel,
}: Props) {
  const dialOptions = phoneDialOptions();
  const parsed = parsePhoneNumber(value, country);
  const [dialCountry, setDialCountry] = useState(parsed.country.name);
  const onCountryDetectedRef = useRef(onCountryDetected);
  const skipCountrySync = useRef(false);

  onCountryDetectedRef.current = onCountryDetected;

  // Sync from typed international number (+91…, +880…).
  useEffect(() => {
    const detected = detectCountryFromPhone(value);
    if (!detected) return;
    setDialCountry(detected.name);
    if (detected.name !== country) {
      onCountryDetectedRef.current?.(detected.name);
    }
  }, [value, country]);

  // Sync prefix when the form country changes (dropdown / address), not after manual prefix pick.
  useEffect(() => {
    if (skipCountrySync.current) {
      skipCountrySync.current = false;
      return;
    }
    if (detectCountryFromPhone(value)) return;
    const matched = getCountryByName(country);
    if (matched) setDialCountry(matched.name);
  }, [country, value]);

  function emit(full: string, pickedCountry?: string) {
    onChange(full);
    if (pickedCountry) {
      onCountryDetectedRef.current?.(pickedCountry);
    }
  }

  function handleDialChange(name: string) {
    skipCountrySync.current = true;
    setDialCountry(name);
    const meta = getCountryByName(name);
    if (!meta) return;
    const national = parsePhoneNumber(value, name).national;
    const full = national ? `${meta.dial}${national}` : "";
    emit(full, name);
  }

  function handleNationalChange(raw: string) {
    if (raw.trim().startsWith("+")) {
      const next = parsePhoneNumber(raw, dialCountry);
      setDialCountry(next.country.name);
      emit(next.full, next.country.name);
      return;
    }
    const meta = getCountryByName(dialCountry) || getCountryByName(country);
    const dial = meta?.dial || dialCodeForCountry(country);
    const national = raw.replace(/\D/g, "");
    emit(national ? `${dial}${national}` : "");
  }

  const nationalValue = parsePhoneNumber(value, dialCountry).national;

  return (
    <div className={inputClassName ? `${shellClass} ${inputClassName}` : shellClass}>
      <div className="relative shrink-0 border-r border-ink/10 dark:border-white/10">
        <CustomSelect
          value={dialCountry}
          onChange={handleDialChange}
          options={dialOptions}
          disabled={disabled}
          variant="inline"
          size="md"
          searchable
          searchPlaceholder="Type country or code…"
          className="min-w-[7.25rem]"
          aria-label={`${ariaLabel || "Phone"} country code`}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center">
        <input
          type="tel"
          required={required}
          disabled={disabled}
          value={nationalValue}
          onChange={(e) => handleNationalChange(e.target.value)}
          className={numberClass}
          placeholder={placeholder}
          aria-label={ariaLabel || "Phone number"}
          autoComplete="tel-national"
        />
      </div>
    </div>
  );
}
