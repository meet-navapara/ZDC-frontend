export type PhoneCountry = {
  name: string;
  iso: string;
  dial: string;
  currency?: string;
};

/** name|iso|dial|currency (currency optional) */
const RAW = `
Afghanistan|AF|+93
Albania|AL|+355
Algeria|DZ|+213
Andorra|AD|+376
Angola|AO|+244
Antigua and Barbuda|AG|+1268
Argentina|AR|+54
Armenia|AM|+374
Australia|AU|+61|AUD
Austria|AT|+43|EUR
Azerbaijan|AZ|+994
Bahamas|BS|+1242
Bahrain|BH|+973
Bangladesh|BD|+880|BDT
Barbados|BB|+1246
Belarus|BY|+375
Belgium|BE|+32|EUR
Belize|BZ|+501
Benin|BJ|+229
Bhutan|BT|+975
Bolivia|BO|+591
Bosnia and Herzegovina|BA|+387
Botswana|BW|+267
Brazil|BR|+55
Brunei|BN|+673
Bulgaria|BG|+359
Burkina Faso|BF|+226
Burundi|BI|+257
Cambodia|KH|+855
Cameroon|CM|+237
Canada|CA|+1|CAD
Cape Verde|CV|+238
Central African Republic|CF|+236
Chad|TD|+235
Chile|CL|+56
China|CN|+86
Colombia|CO|+57
Comoros|KM|+269
Congo|CG|+242
Côte d'Ivoire|CI|+225
Costa Rica|CR|+506
Croatia|HR|+385
Cuba|CU|+53
Cyprus|CY|+357
Czech Republic|CZ|+420
Democratic Republic of the Congo|CD|+243
Denmark|DK|+45
Djibouti|DJ|+253
Dominica|DM|+1767
Dominican Republic|DO|+1809
Ecuador|EC|+593
Egypt|EG|+20|EGP
El Salvador|SV|+503
Equatorial Guinea|GQ|+240
Eritrea|ER|+291
Estonia|EE|+372
Eswatini|SZ|+268
Ethiopia|ET|+251|ETB
Fiji|FJ|+679
Finland|FI|+358
France|FR|+33|EUR
Gabon|GA|+241
Gambia|GM|+220
Georgia|GE|+995
Germany|DE|+49|EUR
Ghana|GH|+233|GHS
Greece|GR|+30
Grenada|GD|+1473
Guatemala|GT|+502
Guinea|GN|+224
Guinea-Bissau|GW|+245
Guyana|GY|+592
Haiti|HT|+509
Honduras|HN|+504
Hungary|HU|+36
Iceland|IS|+354
India|IN|+91|INR
Indonesia|ID|+62|IDR
Iran|IR|+98
Iraq|IQ|+964
Ireland|IE|+353
Israel|IL|+972
Italy|IT|+39
Jamaica|JM|+1876
Japan|JP|+81
Jordan|JO|+962
Kazakhstan|KZ|+7
Kenya|KE|+254|KES
Kiribati|KI|+686
Kuwait|KW|+965
Kyrgyzstan|KG|+996
Laos|LA|+856
Latvia|LV|+371
Lebanon|LB|+961
Lesotho|LS|+266
Liberia|LR|+231
Libya|LY|+218
Liechtenstein|LI|+423
Lithuania|LT|+370
Luxembourg|LU|+352
Madagascar|MG|+261
Malawi|MW|+265
Malaysia|MY|+60|MYR
Maldives|MV|+960
Mali|ML|+223
Malta|MT|+356
Marshall Islands|MH|+692
Mauritania|MR|+222
Mauritius|MU|+230
Mexico|MX|+52
Micronesia|FM|+691
Moldova|MD|+373
Monaco|MC|+377
Mongolia|MN|+976
Montenegro|ME|+382
Morocco|MA|+212|MAD
Mozambique|MZ|+258
Myanmar|MM|+95
Namibia|NA|+264
Nauru|NR|+674
Nepal|NP|+977
Netherlands|NL|+31|EUR
New Zealand|NZ|+64
Nicaragua|NI|+505
Niger|NE|+227
Nigeria|NG|+234|NGN
North Korea|KP|+850
North Macedonia|MK|+389
Norway|NO|+47
Oman|OM|+968
Pakistan|PK|+92|PKR
Palau|PW|+680
Palestine|PS|+970
Panama|PA|+507
Papua New Guinea|PG|+675
Paraguay|PY|+595
Peru|PE|+51
Philippines|PH|+63|PHP
Poland|PL|+48
Portugal|PT|+351
Qatar|QA|+974
Romania|RO|+40
Russia|RU|+7
Rwanda|RW|+250|RWF
Saint Kitts and Nevis|KN|+1869
Saint Lucia|LC|+1758
Saint Vincent and the Grenadines|VC|+1784
Samoa|WS|+685
San Marino|SM|+378
Sao Tome and Principe|ST|+239
Saudi Arabia|SA|+966
Senegal|SN|+221
Serbia|RS|+381
Seychelles|SC|+248
Sierra Leone|SL|+232
Singapore|SG|+65|SGD
Slovakia|SK|+421
Slovenia|SI|+386
Solomon Islands|SB|+677
Somalia|SO|+252
South Africa|ZA|+27|ZAR
South Korea|KR|+82
South Sudan|SS|+211
Spain|ES|+34
Sri Lanka|LK|+94
Sudan|SD|+249
Suriname|SR|+597
Sweden|SE|+46
Switzerland|CH|+41
Syria|SY|+963
Taiwan|TW|+886
Tajikistan|TJ|+992
Tanzania|TZ|+255|TZS
Thailand|TH|+66
Timor-Leste|TL|+670
Togo|TG|+228
Tonga|TO|+676
Trinidad and Tobago|TT|+1868
Tunisia|TN|+216
Turkey|TR|+90
Turkmenistan|TM|+993
Tuvalu|TV|+688
Uganda|UG|+256|UGX
Ukraine|UA|+380
United Arab Emirates|AE|+971|AED
United Kingdom|GB|+44|GBP
United States|US|+1|USD
Uruguay|UY|+598
Uzbekistan|UZ|+998
Vanuatu|VU|+678
Vatican City|VA|+379
Venezuela|VE|+58
Vietnam|VN|+84
Yemen|YE|+967
Zambia|ZM|+260
Zimbabwe|ZW|+263
`.trim();

function parseRaw(): PhoneCountry[] {
  return RAW.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, iso, dial, currency] = line.split("|");
      return {
        name,
        iso,
        dial,
        ...(currency ? { currency } : {}),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const PHONE_COUNTRIES: PhoneCountry[] = parseRaw();

export const COUNTRIES = PHONE_COUNTRIES.map((c) => c.name) as readonly string[];

export type CountryName = (typeof COUNTRIES)[number];

const byName = new Map(PHONE_COUNTRIES.map((c) => [c.name.toLowerCase(), c]));
const byDialLength = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length
);

export function getCountryByName(name: string | null | undefined): PhoneCountry | null {
  if (!name) return null;
  return byName.get(name.trim().toLowerCase()) || null;
}

export function dialCodeForCountry(name: string | null | undefined): string {
  return getCountryByName(name)?.dial || "+254";
}

export function detectCountryFromPhone(
  phone: string | null | undefined
): PhoneCountry | null {
  if (!phone) return null;
  const normalized = phone.trim().replace(/[\s()-]/g, "");
  if (!normalized.startsWith("+")) return null;
  for (const c of byDialLength) {
    if (normalized.startsWith(c.dial)) return c;
  }
  return null;
}

export function parsePhoneNumber(raw: string, fallbackCountry = "Kenya") {
  const fallback = getCountryByName(fallbackCountry) || PHONE_COUNTRIES[0];
  const cleaned = raw.trim();
  if (!cleaned) {
    return {
      country: fallback,
      dial: fallback.dial,
      national: "",
      full: "",
    };
  }

  const detected = detectCountryFromPhone(cleaned);
  if (detected) {
    const national = cleaned.slice(detected.dial.length).replace(/\D/g, "");
    return {
      country: detected,
      dial: detected.dial,
      national,
      full: `${detected.dial}${national}`,
    };
  }

  const digits = cleaned.replace(/\D/g, "");
  return {
    country: fallback,
    dial: fallback.dial,
    national: digits,
    full: digits ? `${fallback.dial}${digits}` : "",
  };
}

export function countrySelectOptions(extra?: { value: string; label: string }[]) {
  type Opt = {
    value: string;
    label: string;
    description?: string;
    badge?: string;
    searchText?: string;
  };
  const base: Opt[] = PHONE_COUNTRIES.map((c) => ({
    value: c.name,
    label: c.name,
    description: c.dial,
    badge: c.iso,
    searchText: `${c.name} ${c.dial} ${c.iso}`.toLowerCase(),
  }));
  if (!extra?.length) return base;
  const seen = new Set(base.map((o) => o.value.toLowerCase()));
  const merged: Opt[] = [...base];
  for (const item of extra) {
    if (!seen.has(item.value.toLowerCase())) {
      merged.push({
        value: item.value,
        label: item.label,
        searchText: `${item.label} ${item.value}`.toLowerCase(),
      });
    }
  }
  return merged;
}

export function phoneDialOptions() {
  return PHONE_COUNTRIES.map((c) => ({
    value: c.name,
    label: c.name,
    shortLabel: c.dial,
    badge: c.dial,
    description: c.iso,
    searchText: `${c.dial} ${c.name} ${c.iso}`.toLowerCase(),
  }));
}

const ALIASES: Record<string, string> = {
  usa: "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "United Arab Emirates",
  "cote d'ivoire": "Côte d'Ivoire",
  "ivory coast": "Côte d'Ivoire",
  "czechia": "Czech Republic",
  "dr congo": "Democratic Republic of the Congo",
  "drc": "Democratic Republic of the Congo",
};

/** Map Google Places / free-text country names onto our list when possible. */
export function matchCountry(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const exact = getCountryByName(trimmed);
  if (exact) return exact.name;
  const alias = ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  const partial = PHONE_COUNTRIES.find((c) =>
    trimmed.toLowerCase().includes(c.name.toLowerCase())
  );
  if (partial) return partial.name;
  return trimmed;
}

export function currencyForCountry(country: string | undefined | null): string {
  const matched = getCountryByName(country);
  if (matched?.currency) return matched.currency;
  return "USD";
}
