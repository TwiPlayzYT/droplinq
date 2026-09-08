import { brand } from '@/config/app-config';
import type { Href } from 'expo-router';

/** Bump when legal docs change so users must re-accept. */
export const LEGAL_VERSION = '2026-09-06';

export const COOKIE_CONSENT_KEY = 'droplinq.cookie-consent.v1';
export const COOKIE_CONSENT_VERSION = LEGAL_VERSION;

export type LegalDocId = 'terms' | 'privacy' | 'cookies' | 'refund';

export const legalNav: { id: LegalDocId; href: '/legal/terms' | '/legal/privacy' | '/legal/cookies' | '/legal/refund'; label: string }[] =
  [
    { id: 'terms', href: '/legal/terms', label: 'Terms' },
    { id: 'privacy', href: '/legal/privacy', label: 'Privacy' },
    { id: 'cookies', href: '/legal/cookies', label: 'Cookies' },
    { id: 'refund', href: '/legal/refund', label: 'Refunds' },
  ];

export const termsOfService = `${brand.displayName} Terms of Service
Last updated: ${LEGAL_VERSION}

By creating an account or using the ${brand.displayName} website or app (${brand.name}), you agree to these Terms.

1. What DropLinq is
${brand.name} is an independent product-availability monitoring service. You access it through a web browser (and optionally install it to your home screen) or a native app. ${brand.disclaimer} Pokémon, The Pokémon Company, Nintendo, Pokémon Center, Walmart, Costco, GameStop, Best Buy, and other names may appear only to identify products or storefronts we monitor.

2. Eligibility
You must be at least 13 years old, or the minimum digital-consent age in your region, and able to form a binding contract. We do not collect a date of birth. Confirming your age during setup is a statement that this is true.

3. Accounts
You are responsible for your login credentials and for activity on your account. Guest mode is for evaluation only, stores limited data on this device, and may be removed or limited. Do not share an account.

4. Alerts and availability
Stock status can change in seconds. ${brand.name} does not promise that every restock, release, or preorder will be detected, or that alerts will arrive instantly, uninterrupted, or error-free. Notifications depend on your browser or system permission, whether the site is installed to your home screen (recommended on iPhone), your device settings, network, operating-system limits, our monitor remaining online, and any plan features. “Live,” “monitoring,” and similar status labels describe that alerts are armed — not a guarantee of a successful purchase.

5. Acceptable use
Do not misuse the service, attempt unauthorized access, scrape retailers through ${brand.name} in ways that violate third-party terms, abuse alerts, interfere with other users, or use ${brand.name} for unlawful activity. ${brand.name} is a personal monitoring tool, not a bulk harvesting service.

6. Purchases and third-party sites
Product links open the retailer’s own website in a new tab, window, or in-app browser. Purchases, shipping, taxes, and retailer refunds are solely between you and that retailer. ${brand.name} is not a party to those transactions and does not process retailer checkout or payments.

7. Subscriptions
Paid DropLinq plans, if offered, will show price, billing interval, and renewal terms before you purchase. Retailer storefronts are not DropLinq checkouts.

8. Intellectual property and images
Site design, branding, and software belong to ${brand.name}. Retailer names, logos, and product images remain property of their owners and are shown only to identify products. We do not claim copyright in those third-party assets. Do not copy ${brand.name} software or branding without permission.

9. Reviews and marketing claims
${brand.name} does not publish customer reviews or testimonials on the site. Any “preview” or “sample” products are fictional examples used to illustrate filters — not real shopper reviews. We do not claim that using ${brand.name} will make you first in line, guarantee a checkout, or outperform other tools.

10. Disclaimers
THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that monitoring will detect every restock or release or that the service will be uninterrupted.

11. Limitation of liability
To the maximum extent allowed by law, ${brand.name} is not liable for lost purchases, missed drops, device or browser issues, third-party site outages, or indirect, incidental, special, or consequential damages arising from use of the service. Some regions do not allow certain limitations; in those regions our liability is limited to the extent permitted.

12. Local law
These Terms are intended for users in ${brand.jurisdiction} and other regions where the service is offered. Mandatory consumer protections in your province, territory, or country still apply. Privacy is described in the Privacy Policy (PIPEDA in Canada; GDPR/UK GDPR where they apply; CCPA/CPRA for California residents).

13. Termination
We may suspend or end access for violations of these Terms or to protect the service. You may stop using ${brand.name} and request account deletion as described in the Privacy Policy.

14. Changes
We may update these Terms. Continued use after an update means you accept the revised Terms when prompted.

15. Contact
${brand.legalName}
Operating from ${brand.jurisdiction}
Email: ${brand.contactEmail}
`;

export const privacyPolicy = `${brand.displayName} Privacy Policy
Last updated: ${LEGAL_VERSION}

This Privacy Policy explains how ${brand.legalName} (“${brand.name}”) handles personal information for the website and apps. We operate from ${brand.jurisdiction} and design this policy around PIPEDA. If you are in the EEA/UK or California, the extra rights below also apply.

1. Information we collect
We collect only what we need to run accounts, preferences, and alerts:
- Account: email address and password (handled by our auth provider), or a token from Google/Apple if you choose those buttons. Optional username.
- Preferences: region, retailers, TCG/categories, alert settings, watchlists, appearance.
- Alerts: web-push or device-push subscription details if you opt in; alert acknowledgements.
- Technical: basic browser/device diagnostics needed to keep the service working.
We do not collect date of birth, payment card numbers for retailer checkouts, advertising profiles, or extra “just in case” fields.

2. How we use information
- Provide monitoring status, watchlists, and the alerts you turn on
- Keep you signed in and remember settings on this device
- Maintain security and prevent abuse
- Improve reliability
- Comply with law
We do not sell personal information and we do not use it for third-party advertising.

3. Legal bases (GDPR/UK GDPR, where they apply)
- Contract: running the account and alerts you request
- Legitimate interests: security, debugging, keeping essential storage working
- Consent: optional browser/lock-screen notifications, and any non-essential cookies if we add them later
- Legal obligation: when the law requires us to keep or disclose records

4. Browser notifications (Web Push)
If you enable notifications, we store a push subscription for that browser so we can send alerts you opted into. You can disable them in browser or system settings, or in Settings on the site. On iPhone, lock-screen web notifications typically require adding ${brand.name} to your Home Screen from Safari.

5. Cookies, local storage, and tracking
See the Cookie Policy. We use essential cookies and local storage to sign you in, save preferences, and remember cookie notice. We do not run advertising pixels, third-party analytics suites, or cross-site trackers. Opening a retailer product page happens only after you choose to open it.

6. Service providers
We use processors such as Supabase (auth/database), cloud hosting (for example Render, Railway, or a static web host), Google or Apple if you use those sign-in buttons, and push-notification infrastructure. They process data only to operate the service. Product images may load from retailer CDNs when we display a catalog item; that is identification, not an embedded shop.

7. Data sharing
We do not sell your personal information. We may share data with service providers under contract, or if required by law.

8. Retention
We keep account and preference data while your account is active. Guest data stays on this device until you leave guest mode or clear site data. You may request deletion by emailing ${brand.contactEmail} from the address on the account.

9. Security
We use protections appropriate for a consumer web service (HTTPS, access controls, hashed passwords via the auth provider). No method of transmission or storage is completely secure.

10. Children
${brand.name} is not directed at children under 13 (or the higher digital-consent age in your region). Do not use the service if you are under that age.

11. Your choices (PIPEDA / general)
- Update preferences in Settings
- Disable notifications
- Sign out
- Request access, correction, or deletion at ${brand.contactEmail}

12. GDPR/UK GDPR rights
If those laws apply to you, you may also request portability, restriction, or objection, and you may complain to your local supervisory authority. You can withdraw consent for optional notifications at any time without affecting earlier processing.

13. California (CCPA/CPRA)
We do not sell or share personal information as those laws define “sell” and “share.” California residents may request know/access, delete, and correct, and will not be discriminated against for exercising those rights. Email ${brand.contactEmail}.

14. International transfers
Your information may be processed in ${brand.jurisdiction} and in countries where our providers operate. Where required, we rely on appropriate safeguards used by those providers.

15. Changes
We may update this Policy. Material changes are reflected by a new legal version on the website.

16. Contact
${brand.legalName} (${brand.jurisdiction})
${brand.contactEmail}

${brand.disclaimer}
`;

export const cookiePolicy = `${brand.displayName} Cookie Policy
Last updated: ${LEGAL_VERSION}

This policy explains how the ${brand.name} website uses cookies and similar storage (local storage, session storage). Native iOS/Android apps use on-device storage instead of browser cookies; the same categories apply.

1. What we use
${brand.name} only uses essential storage to run the site:
- Sign-in session (auth cookies or tokens from our auth provider)
- Your region, filters, watchlist, appearance, and alert preferences on this device
- Cookie-notice choice
- Guest-mode profile on this device, if you use guest
- A web-push subscription endpoint if you enable lock-screen or browser alerts

2. What we do not use
We do not set advertising cookies, social-media tracking pixels, or third-party analytics cookies. We do not run non-essential marketing tags.

3. Third parties
- Supabase (or mock/local auth in development) for account session
- Google or Apple only if you tap Continue with Google / Apple
- Hosting and push providers as described in the Privacy Policy
- Retailer sites and image CDNs only when you open a product or when we show a product photo for identification
Those third parties have their own policies. We do not embed retailer checkout, videos, or widgets on DropLinq pages.

4. Legal basis
Essential cookies are used because they are necessary to provide the service you request. Optional notifications use consent. If we ever add non-essential cookies, we will ask before setting them.

5. How long they last
Session cookies last until you sign out or close the browser, depending on the provider. Preference and consent records stay until you clear site data or we change the consent version.

6. Your choices
Use “Accept essential cookies” on the banner, or open this page from the footer. You can also clear cookies and site data in your browser. Blocking all cookies will prevent sign-in.

7. Contact
Questions: ${brand.contactEmail}
`;

export const refundPolicy = `${brand.displayName} Refund Policy
Last updated: ${LEGAL_VERSION}

1. DropLinq does not sell TCG products
${brand.name} is a monitoring and alert tool. Product pages and “Open product” send you to the retailer’s website. Prices, shipping, taxes, cancellations, and refunds for those orders are controlled by that retailer — not by ${brand.name}. Contact the retailer (or your card issuer) for those purchases.

2. DropLinq subscriptions
The service is currently offered without a DropLinq checkout on this website. If we later offer paid DropLinq plans:
- You will see the price and renewal terms before you pay
- Digital subscriptions that you have not meaningfully used may be refunded within 14 days of the first charge, or longer if your local consumer law requires it
- After that window, fees are generally non-refundable except where the law says otherwise, or if the service was unavailable for a sustained period we could not reasonably fix
- If you bought through the Apple App Store or Google Play, refunds must be requested from Apple or Google under their rules

3. Alerts are not a purchase guarantee
Missing a drop, a failed retailer checkout, or a restock we did not detect is not grounds for a retailer refund through ${brand.name}, and is not a DropLinq “defective product.”

4. How to ask
Email ${brand.contactEmail} from the address on your account. Include the date, plan name if any, and what you want us to review. We will respond as soon as we reasonably can.

5. Chargebacks
If you dispute a DropLinq charge, we may pause the related account while we look into it.

6. Contact
${brand.legalName} · ${brand.jurisdiction}
${brand.contactEmail}
`;

export function legalHref(href: (typeof legalNav)[number]['href']): Href {
  return href as Href;
}

export const legalDocuments: Record<LegalDocId, { title: string; body: string }> = {
  terms: { title: 'Terms of Service', body: termsOfService },
  privacy: { title: 'Privacy Policy', body: privacyPolicy },
  cookies: { title: 'Cookie Policy', body: cookiePolicy },
  refund: { title: 'Refund Policy', body: refundPolicy },
};
