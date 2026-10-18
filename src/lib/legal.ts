// Terms of use and privacy policy. One source shared by the React pages
// and the prerendered static HTML. Keep these in step with what the app
// actually does: local-only records, no accounts, no cookies, no analytics.

export interface LegalSection {
  heading: string;
  body: string[];
  list?: string[];
}

export interface LegalDoc {
  path: "/terms" | "/privacy";
  title: string;
  updated: string;
  summary: string[];
  sections: LegalSection[];
}

const CONTACT_URL = "https://github.com/Issimonmutunga/sarateal-frontend/issues";

export const LEGAL_CONTACT = {
  label: "open an issue on GitHub",
  url: CONTACT_URL,
};

export const PRIVACY: LegalDoc = {
  path: "/privacy",
  title: "Privacy policy",
  updated: "18 October 2026",
  summary: [
    "No account, no sign-up, no cookies, no analytics.",
    "Your records stay in your own browser. We never receive them.",
    "A few public services see basic request details (like your IP address) when the app loads maps, weather or place names.",
  ],
  sections: [
    {
      heading: "What Sarateal stores, and where",
      body: [
        "Everything you enter (produce for sale, produce wanted, prices, deals and their notes, your role and settings) is saved in your browser's own storage (IndexedDB) on your device. It is not uploaded to Sarateal or anyone else.",
        "Because it lives only on your device, other people can't see it, and it won't appear on another phone or computer unless you move it there yourself with Backup & restore.",
        "The app also keeps short-lived copies of public reference data (counties, products, markets), weather results and place-name lookups on your device so it loads faster. These hold nothing about you.",
      ],
    },
    {
      heading: "What leaves your device",
      body: [
        "To work, the app talks to a few services. Like any website, each one can see your IP address, browser type and the time of the request, under its own privacy policy. None of them receives your records.",
      ],
      list: [
        "The Sarateal API: provides the list of counties, products and markets, and weather forecasts for map coordinates.",
        "OpenStreetMap Nominatim: turns a market or place name into map coordinates. Only the place name is sent.",
        "OpenStreetMap tile servers: provide the map images.",
        "Our hosting provider: serves the website itself.",
      ],
    },
    {
      heading: "What we don't do",
      body: [],
      list: [
        "We don't ask for your name, phone number or email.",
        "We don't use cookies, advertising or analytics trackers.",
        "We don't sell or share your data. We don't have it.",
      ],
    },
    {
      heading: "You are in control",
      body: [
        "You can see every record under Records, download a copy under Records → Backup & restore, and delete individual records or erase everything from the same place.",
        "Clearing this site's data in your browser settings also removes everything permanently. Make a backup first if you want to keep it.",
      ],
    },
    {
      heading: "Other people's information",
      body: [
        "Please don't type other people's personal details (such as names or phone numbers) into notes unless they have agreed to it. Anything you write stays on your device, but you are responsible for it.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "If the way Sarateal handles data changes, we will update this page and the date at the top before the change takes effect.",
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  path: "/terms",
  title: "Terms of use",
  updated: "18 October 2026",
  summary: [
    "Sarateal is a free tool that helps you see market opportunities. It does not give financial advice.",
    "Scores are estimates based on the records people enter, so check before you buy or sell.",
    "Use it fairly and don't misuse the services it relies on.",
  ],
  sections: [
    {
      heading: "Using Sarateal",
      body: [
        "By using Sarateal you agree to these terms. If you don't agree, please don't use the app.",
        "Sarateal is free and doesn't need an account. You can stop using it at any time.",
      ],
    },
    {
      heading: "Scores are guidance, not advice",
      body: [
        "Opportunity and confidence scores are worked out automatically from records entered on your device, plus public data such as distance and weather. They can be incomplete, out of date or wrong.",
        "Sarateal is not financial, trading or agricultural advice. Always confirm prices, quantities and buyers or sellers directly before making a deal. Decisions you make are your own.",
      ],
    },
    {
      heading: "Your records",
      body: [
        "You are responsible for what you enter and for keeping your own backups. Records are stored only in your browser, so if you clear your browser data or lose your device, they can't be recovered by us.",
        "Only enter information you have the right to use, and don't enter other people's personal details without their permission.",
      ],
    },
    {
      heading: "Fair use",
      body: ["Please don't:"],
      list: [
        "try to overload, scrape at high volume, or break the Sarateal API or the website;",
        "use the app to break the law or mislead other people;",
        "misuse the third-party services the app relies on (for example OpenStreetMap), which have their own usage policies.",
      ],
    },
    {
      heading: "Third-party data",
      body: [
        "Maps and place lookups use OpenStreetMap data (© OpenStreetMap contributors). Weather comes from Open-Meteo through the Sarateal API. These sources have their own terms and we can't guarantee their accuracy or availability.",
      ],
    },
    {
      heading: "Availability and changes",
      body: [
        "Sarateal is provided as it is, without guarantees that it will always be available, error-free or suitable for a particular purpose. Features may change or be removed.",
        "To the extent the law allows, Sarateal and its contributors are not liable for losses that come from using the app or relying on its scores.",
        "We may update these terms. The date at the top shows the latest version, and continuing to use the app means you accept the update.",
      ],
    },
  ],
};

export const LEGAL_DOCS = { "/terms": TERMS, "/privacy": PRIVACY } as const;
