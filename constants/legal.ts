import { brand } from '@/config/app-config';

/** Bump when legal docs change so users must re-accept. */
export const LEGAL_VERSION = '2026-08-27';

export const termsOfService = `${brand.displayName} Terms of Service
Last updated: ${LEGAL_VERSION}

By creating an account and using the ${brand.displayName} website (${brand.name}), you agree to these Terms.

1. What DropLinq is
${brand.name} is an independent product-availability monitoring website. You access it through a web browser (and optionally install it to your home screen as a web app). ${brand.name} is not affiliated with, endorsed by, or sponsored by Pokémon, The Pokémon Company, Nintendo, Pokémon Center, Walmart, Costco, GameStop, Best Buy, or any other retailer or brand it may monitor.

2. Eligibility
You must be able to form a binding contract in your region. If you provide a date of birth during setup, you confirm the information is accurate.

3. Accounts
You sign up and sign in through the website. You are responsible for your login credentials and for activity on your account. Guest mode is for evaluation only and may be removed or limited.

4. Alerts and availability
Stock status can change quickly. ${brand.name} does not guarantee instant, uninterrupted, or error-free alerts. Notifications depend on your browser permission, whether the site is installed to your home screen (recommended on mobile), your device settings, network, OS limits, and subscription features when offered. Keeping a browser tab open may improve in-app alerts but is not required when lock-screen web push is enabled.

5. Acceptable use
Do not misuse the service, attempt unauthorized access, scrape retailers through the site in ways that violate third-party terms, abuse alerts, or use ${brand.name} for unlawful activity.

6. Purchases and third-party sites
Product links open retailer websites in a new tab or window. Purchases are solely between you and the retailer. ${brand.name} is not a party to those transactions.

7. Subscriptions
Paid plans, if offered, will show pricing and renewal terms on the website before purchase.

8. Intellectual property
Site design, branding, and software belong to ${brand.name}. Retailer names and product images remain property of their owners and are used only for identification.

9. Disclaimers
THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. We do not warrant that monitoring will detect every restock or release.

10. Limitation of liability
To the maximum extent allowed by law, ${brand.name} is not liable for lost purchases, missed drops, device or browser issues, or indirect damages arising from use of the service.

11. Termination
We may suspend or end access for violations of these Terms or to protect the service.

12. Changes
We may update these Terms. Continued use after an update means you accept the revised Terms when prompted on the website.

13. Contact
For questions about these Terms, contact support through the email associated with your ${brand.name} account or the support channel listed on the website.
`;

export const privacyPolicy = `${brand.displayName} Privacy Policy
Last updated: ${LEGAL_VERSION}

This Privacy Policy explains how the ${brand.displayName} website (${brand.name}) handles information.

1. Information we collect
- Account data: email, password (handled by our auth provider), optional username and date of birth
- Preferences: region, retailers, TCG/categories, alert settings, watchlists
- Browser and device data: web push subscription endpoints, browser type, basic diagnostics
- Usage data: stock events you view, alert acknowledgements, and similar interactions needed to run the service

2. How we use information
- Provide monitoring status, watchlists, and alerts
- Personalize regions and preferences
- Deliver browser and lock-screen notifications you opt into
- Maintain security and prevent abuse
- Improve reliability and features
- Comply with legal obligations

3. Browser notifications (Web Push)
If you enable lock-screen or browser notifications, we store a push subscription tied to your browser installation so we can send alerts you opted into. You can disable notifications in browser or system settings, or in Settings on the site. On iPhone, notifications typically require adding ${brand.name} to your Home Screen from Safari.

4. Local storage
The website stores preferences and alert history in your browser (local storage) so settings persist between visits.

5. Service providers
We use infrastructure providers such as Supabase (database/auth), cloud hosting (e.g. Render, Railway), and push notification services. They process data only to operate the service.

6. Data sharing
We do not sell your personal information. We may share data with service providers under contract, or if required by law.

7. Retention
We keep account and preference data while your account is active. You may request deletion of account data through in-site controls or by contacting support.

8. Security
We use industry-standard protections appropriate for a web service. No method of transmission or storage is 100% secure.

9. Children
${brand.name} is not directed at children under 13 (or the minimum age in your region). Do not use the service if you are under that age.

10. Your choices
- Update preferences in Settings
- Disable browser notifications
- Sign out or delete your account when account deletion is available
- Guest mode stores limited data only in your browser

11. International users
Your information may be processed in the country where our providers operate.

12. Changes
We may update this Policy. Material changes will be reflected by a new legal version on the website.

13. Contact
Privacy questions can be sent through the support channel listed on the ${brand.name} website.

${brand.disclaimer}
`;
