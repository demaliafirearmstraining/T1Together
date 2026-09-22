export type LegalSection={heading:string;body:string};
export type LegalDocument={title:string;effective:string;intro:string;sections:LegalSection[]};

export const privacyPolicy:LegalDocument={
 title:'Privacy Policy',effective:'September 22, 2026',
 intro:'T1Together is a community app for adults living with Type 1 diabetes, parents and caregivers, and supporters. This policy explains the information T1Together handles and the choices available to you.',
 sections:[
  {heading:'Information you provide',body:'We process information you choose to add, including your display name, email address, profile photo, bio, community area, T1D experience, devices, insulin experience, help topics, Community posts and photos, comments and replies, reactions, Help and T1 Beacon requests and responses, Supply Locker posts, private messages, reports, blocks, and notification preferences.'},
  {heading:'Location',body:'When you allow location access, T1Together uses device location to create a reduced-precision location for nearby matching. The app is designed not to store or display your exact GPS coordinates to other members. Members may see approximate distance or the city/region you choose to provide. Do not put a home address or other precise location in public posts.'},
  {heading:'Device and notification data',body:'We may process a push-notification token, app/session information, and technical information needed to operate notifications, authentication, security, and reliability. You can control categories of push alerts in Settings and can also change notification permission in your device settings.'},
  {heading:'How information is used',body:'Information is used to operate accounts and profiles; show Community content; provide nearby discovery; deliver Help, T1 Beacon and Supply Locker features; enable messaging; send requested notifications; enforce blocks and reports; moderate the service; prevent abuse; troubleshoot problems; and maintain security.'},
  {heading:'Who can see information',body:'Your public-profile information and content you post in community features can be visible to other authenticated T1Together members, subject to privacy and blocking controls. Private messages are intended for conversation participants. Reports are handled for safety and moderation. A private/discoverability setting does not erase content you already posted.'},
  {heading:'Service providers',body:'T1Together uses service providers to operate the app, including Supabase for authentication, database, storage and backend services; Expo services for app delivery and push-notification infrastructure; and Apple platform services on iOS. These providers process information as needed to provide their services and are subject to their own terms and privacy practices.'},
  {heading:'Data retention and deletion',body:'Information is retained while needed to operate your account and the service, meet safety or legal obligations, resolve disputes, and prevent abuse. You can permanently request deletion from Settings > Account > Delete My Account. Account deletion is designed to remove your T1Together profile and associated app data and uploaded user media. Some limited records may be retained when legally required or necessary for security, fraud prevention, or enforcement.'},
  {heading:'Children',body:'T1Together account holders must be adults. Children should not create their own accounts. A parent or caregiver may discuss or represent a child through the adult account, but should avoid sharing unnecessary identifying information about a child.'},
  {heading:'Security',body:'T1Together uses access controls and other safeguards intended to protect account and community data. No internet service can guarantee absolute security. Protect your password and report suspected account misuse.'},
  {heading:'Your choices',body:'You can edit your profile, control discoverability and notification categories, update approximate location, block members, report content, remove your own content where supported, sign out, or delete your account from Settings.'},
  {heading:'Changes',body:'This policy may be updated as T1Together changes. Material updates will be reflected by a new effective date and, when appropriate, an in-app notice.'},
  {heading:'Questions and privacy requests',body:'For now, privacy and safety issues can be raised through the in-app reporting tools. A public T1Together support contact and web-hosted copy of this policy will be published before public App Store release.'}
 ]
};

export const termsOfUse:LegalDocument={
 title:'Terms of Use',effective:'September 22, 2026',
 intro:'These Terms govern use of T1Together. By creating an account or using the service, you agree to these Terms and the Privacy Policy.',
 sections:[
  {heading:'Adult accounts',body:'You must be an adult legally able to agree to these Terms. T1Together does not provide child accounts. Parents and caregivers are responsible for information they choose to share about children.'},
  {heading:'Community service, not medical care',body:'T1Together provides peer community features and general information. It does not provide medical diagnosis, treatment, insulin dosing, emergency medical services, or a clinician-patient relationship. Content from members may be incomplete or wrong. Decisions about diabetes care should be made using your established care plan and qualified healthcare professionals.'},
  {heading:'Emergencies',body:'Do not rely on T1Together, T1 Beacon, Community, messages, push notifications, or nearby members for an emergency response. If you believe someone is experiencing a medical emergency, use local emergency services immediately. In the United States, call 911. T1 Beacon is a community-help feature and is not monitored emergency dispatch.'},
  {heading:'Your account',body:'You are responsible for your account credentials and activity. Provide accurate account information, keep your password secure, and promptly report suspected unauthorized access. Do not impersonate another person or create accounts to evade moderation or blocks.'},
  {heading:'Your content',body:'You retain ownership of content you submit. You give T1Together permission to host, process, display and distribute that content as necessary to operate the features you choose to use. You are responsible for having the right to share your content and for avoiding unnecessary private or identifying information.'},
  {heading:'Acceptable use',body:'Do not harass, threaten, exploit, deceive, discriminate against, stalk, spam, defraud, impersonate, expose another person’s private information, distribute malware, attempt unauthorized access, interfere with the service, or use T1Together for unlawful activity. Do not use the service to provide dangerous medical instructions or present personal experience as guaranteed medical advice.'},
  {heading:'Supply Locker',body:'Supply Locker is intended to help community members locate lawful, appropriate peer assistance with diabetes supplies. It is not a marketplace. Do not list supplies for sale, auction, trade for profit, or use the feature for commercial resale. Do not share prescription-only items, medication, controlled items, opened/used items, recalled items, expired items, or anything whose transfer is prohibited or unsafe. Users are responsible for following applicable law, manufacturer requirements, storage requirements, prescription rules, insurance rules, and professional guidance. T1Together does not verify, inspect, guarantee, ship, prescribe, or sell listed supplies.'},
  {heading:'Moderation',body:'T1Together may remove content, limit features, suspend or terminate accounts, preserve relevant safety records, or take other reasonable action to protect members, comply with law, or enforce these Terms and Community Guidelines. Reporting content does not guarantee a particular outcome.'},
  {heading:'Third-party services',body:'The service relies on third-party platforms and infrastructure. Their availability can affect T1Together. T1Together is not responsible for third-party services outside its control.'},
  {heading:'Service availability',body:'Features may change, be interrupted, or be discontinued. T1Together does not promise that notifications, nearby matching, messages, Help requests, T1 Beacon alerts, or other features will always arrive immediately or be available.'},
  {heading:'Disclaimer',body:'To the extent permitted by law, T1Together is provided on an “as is” and “as available” basis without warranties that community information is accurate, complete, safe, or suitable for a particular medical decision.'},
  {heading:'Account termination',body:'You may stop using T1Together and delete your account through Settings. T1Together may restrict or terminate access for serious or repeated violations, safety risks, fraud, abuse, or legal requirements.'},
  {heading:'Changes',body:'These Terms may be updated as the service evolves. Material changes will be identified by a new effective date and, when appropriate, an in-app notice.'}
 ]
};

export const communityGuidelines:LegalDocument={
 title:'Community Guidelines',effective:'September 22, 2026',
 intro:'T1Together should feel useful, human, and safe. These rules apply to Community, profiles, Help, T1 Beacon, Supply Locker, messages, photos, comments and replies.',
 sections:[
  {heading:'Support people, not perfection',body:'Share experience respectfully. People manage T1D differently. Ask questions, explain what worked for you, and leave room for different care plans, devices, resources, cultures, and family situations.'},
  {heading:'Peer experience is not a prescription',body:'You may discuss your own experience, but do not tell another member that a specific insulin dose, medication change, treatment, or emergency action is guaranteed to be safe for them. Encourage professional or emergency help when appropriate.'},
  {heading:'Protect privacy',body:'Do not post another person’s address, phone number, private messages, medical records, school details, exact location, or other sensitive information without permission. Be especially careful with information about children.'},
  {heading:'No harassment or exploitation',body:'No bullying, threats, hate, sexual exploitation, stalking, coercion, scams, spam, or attempts to pressure vulnerable members. Respect blocks and requests to stop contact.'},
  {heading:'T1 Beacon and Help',body:'Use T1 Beacon for time-sensitive community assistance, not as a substitute for 911 or emergency medical care. Describe the help you need accurately. Do not create false alerts or use urgent features to solicit money, promote a business, or manipulate other members.'},
  {heading:'Supply Locker',body:'No sales, bidding, profit, prescription medication, opened/used items, expired or recalled products, or unsafe/unlawful transfers. Do not pressure anyone to give supplies. Confirm condition, expiration, storage, compatibility and applicable rules before accepting anything.'},
  {heading:'Authenticity and safety',body:'Do not impersonate people or organizations, intentionally spread dangerous misinformation, manipulate engagement, or use T1Together to facilitate unlawful conduct. Commercial solicitation and unsolicited advertising are not allowed unless T1Together explicitly provides a feature for it.'},
  {heading:'Report and block',body:'Use Report when content or behavior may violate these rules. Use Block when you do not want interaction with a member. Reports should be made in good faith and should not be used to harass someone.'},
  {heading:'Enforcement',body:'Depending on context and severity, T1Together may remove content, warn a member, restrict features, suspend or terminate an account, or preserve information needed for safety or legal compliance. Serious safety threats may require additional action where legally appropriate.'}
 ]
};

export const safetyInfo:LegalDocument={
 title:'Safety & Medical Disclaimer',effective:'September 22, 2026',
 intro:'T1Together connects people. It does not replace your diabetes care team, care plan, device instructions, or emergency services.',
 sections:[
  {heading:'Not medical advice',body:'Posts, comments, messages, Help responses, guides and other member content are peer information and personal experience. They are not individualized medical advice, diagnosis, treatment, insulin dosing, or a substitute for professional care.'},
  {heading:'Emergency help',body:'If you believe you or someone else may be experiencing a medical emergency, use local emergency services immediately. In the United States, call 911. Do not wait for a T1Together member, message, notification, Help response, or T1 Beacon response.'},
  {heading:'T1 Beacon',body:'T1 Beacon is designed to alert nearby community members to a time-sensitive request for peer help. It is not emergency dispatch, is not continuously monitored, and does not guarantee that anyone will receive or respond to an alert.'},
  {heading:'Diabetes decisions',body:'Use your prescribed treatment plan, device instructions, emergency plan, and guidance from qualified healthcare professionals for insulin, medications, ketones, severe lows/highs, illness, device failures, or other medical decisions.'}
 ]
};

export const supplyRules:LegalDocument={
 title:'Supply Locker Rules',effective:'September 22, 2026',
 intro:'Supply Locker is a community-assistance feature, not a store or marketplace.',
 sections:[
  {heading:'No buying or selling',body:'Do not sell, auction, commercially resell, or request payment for supplies through Supply Locker. T1Together does not process payments for supplies.'},
  {heading:'What not to share',body:'Do not offer prescription medication or insulin, controlled items, opened or used products, recalled products, expired products, damaged products, or anything that cannot lawfully and safely be transferred.'},
  {heading:'Check before accepting',body:'Recipients should independently confirm the item, packaging, expiration, storage history when relevant, compatibility, manufacturer guidance, prescription requirements, and applicable laws or insurance restrictions.'},
  {heading:'Meet safely',body:'Do not post a home address publicly. Use private messaging to coordinate only after you are comfortable with the other member. Consider a public meeting location and use normal personal-safety precautions.'},
  {heading:'No guarantee',body:'T1Together does not inspect, authenticate, store, ship, prescribe, sell, or guarantee supplies listed by members. Report suspicious, unsafe, commercial, expired, recalled, or prohibited listings.'}
 ]
};

export const legalDocuments={privacy:privacyPolicy,terms:termsOfUse,guidelines:communityGuidelines,safety:safetyInfo,supplies:supplyRules};
