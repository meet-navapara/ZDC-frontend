"use client";

import { useEffect, useRef, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type AddressParts = {
  line1: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

// Address input with Google Places autocomplete. When no API key is configured,
// it degrades gracefully to a plain text input (manual entry still works).
export function AddressAutocomplete({
  value,
  onChange,
  className,
  placeholder,
  required,
}: {
  value: string;
  onChange: (parts: Partial<AddressParts>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!KEY) return;
    let autocomplete: any;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        const g = (window as any).google;
        if (!g?.maps?.places || !inputRef.current) return;
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          fields: ["address_components", "geometry", "formatted_address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const comps: any[] = place.address_components || [];
          const get = (type: string) =>
            comps.find((c) => c.types.includes(type))?.long_name || "";
          const line1 =
            [get("street_number"), get("route")].filter(Boolean).join(" ") ||
            place.formatted_address ||
            "";
          const city =
            get("locality") ||
            get("postal_town") ||
            get("administrative_area_level_2");
          const country = get("country");
          const lat = place.geometry?.location?.lat?.() ?? null;
          const lng = place.geometry?.location?.lng?.() ?? null;
          onChange({ line1, city, country, lat, lng });
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      if (autocomplete && (window as any).google) {
        (window as any).google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange({ line1: e.target.value })}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        required={required}
      />
      {ready && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage">
          ◉ Maps
        </span>
      )}
    </div>
  );
}
