// The site's Privacy Policy and Terms. Same rule as faqs.js: only state
// things ACUA actually does. Returns, delivery, payment and commission
// details mirror the FAQ and the concierge's fact list
// (supabase/functions/concierge-chat/index.ts); anything not yet decided
// (e.g. commission deposit cancellation) is described as confirmed in
// writing before payment, which is how it works today, rather than
// guessed. Update LAST_UPDATED whenever the wording changes, and revisit
// both documents when online checkout (PayMongo) goes live.
//
// Section body entries are paragraphs (strings) or { list: [...] }.

export const LAST_UPDATED = 'September 24, 2026';

export const PRIVACY = {
  title: 'Privacy Policy',
  intro:
    'This policy explains what personal information ACUA collects through this website, why we collect it, who we share it with, and the rights you have under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
  sections: [
    {
      heading: 'Who we are',
      body: [
        'ACUA is a handmade coastal accessories brand based in Iloilo City, Philippines. For anything about your personal information, email us at acuavibe@gmail.com.',
      ],
    },
    {
      heading: 'What we collect',
      body: [
        {
          list: [
            'Your account: your email address and name, from signing up or from Google sign-in. Your password is handled by our sign-in provider and is never visible to us.',
            'Custom commission requests: your name, email, phone number or Instagram handle, the details of your request (category, material, budget, timeline and description) and any reference images you upload.',
            'Orders: the pieces you order, amounts, order status, tracking number, and the delivery details you give us so we can ship your order.',
            'Concierge chat: the messages you type into the chat.',
            'Technical information: your IP address is used briefly to limit how often the concierge chat can be used, and our hosting providers keep standard server logs.',
          ],
        },
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'To create and manage your account, review and quote your commission requests and make your pieces, confirm, ship and track your orders, answer your questions, and keep the website secure and free from abuse.',
        'We do not sell your personal information, and we do not use it for advertising.',
      ],
    },
    {
      heading: 'Who we share it with',
      body: [
        'We use a few trusted services to run the website. They handle information only to provide their service to us:',
        {
          list: [
            'Supabase: stores our database, customer accounts and uploaded images.',
            'Vercel: hosts the website.',
            'Google: provides Google sign-in (if you choose to use it), the website fonts, and the AI that writes the concierge chat replies. Your chat messages are sent to Google to generate each reply.',
            'Unsplash: some product photos are loaded from Unsplash’s servers.',
            'Couriers: receive the delivery details needed to deliver your order.',
          ],
        },
        'Payment is currently made directly by GCash or bank transfer after we confirm your order. We never receive your card details.',
        'We may also disclose information when the law requires it.',
      ],
    },
    {
      heading: 'Cookies and storage on your device',
      body: [
        'We don’t use advertising or tracking cookies. The website stores a few things in your browser that it needs to work: your sign-in session, your cart, your light or dark theme choice, your “Remember me” preference, and a draft of a commission request you haven’t sent yet. These stay on your device. You can clear them at any time in your browser settings, which signs you out and empties your cart.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'We keep your account information for as long as your account exists, and commission and order records for as long as we need them to complete your order and to meet our legal obligations. Concierge chat usage limits are kept only briefly. You can ask us to delete your information sooner, unless the law requires us to keep a record.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Under the Data Privacy Act, you have the right to be informed about how your information is used, to access it, to object to its processing, to have it corrected, to have it erased or blocked, to receive a copy of it, and to be compensated for damages caused by its misuse.',
        'To use any of these rights, email acuavibe@gmail.com. If you’re not satisfied with our response, you can file a complaint with the National Privacy Commission at privacy.gov.ph.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'Your information is stored with access controls: only ACUA’s own admin account can view commission requests and orders, and customers can only see their own. No system is completely secure, but we work to protect your information and will let you know if a breach affects you.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'This website isn’t intended for children under 18. If you believe a child has given us personal information, contact us and we’ll delete it.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If we change this policy, we’ll update the date at the top of this page. Significant changes will also be announced on the website.',
      ],
    },
  ],
};

export const TERMS = {
  title: 'Terms of Service',
  intro:
    'These terms apply when you use the ACUA website, create an account, place an order or request a custom commission. By doing any of these, you agree to them.',
  sections: [
    {
      heading: 'Our pieces',
      body: [
        'Every piece is handmade in small batches. Small variations in color, size, finish, and in natural stones and pearls are part of each piece’s character, not defects. We photograph pieces as accurately as we can, but colors can look slightly different on different screens.',
      ],
    },
    {
      heading: 'Availability and 1-of-1 pieces',
      body: [
        'Many pieces are 1-of-1 originals and won’t be restocked once sold. Adding a piece to your cart doesn’t reserve it: it’s yours once your order is confirmed and paid. If a piece sells before your order is confirmed, we’ll let you know, and if you’ve already paid for it, we’ll refund you in full.',
      ],
    },
    {
      heading: 'Prices and payment',
      body: [
        'Prices are in Philippine pesos (₱). We may change prices at any time, but changes never affect an order we’ve already confirmed. Shipping cost depends on your region and your order’s weight, and we confirm it with you when you order.',
        'After we confirm your order, you pay by GCash or bank transfer using the QR code we send you.',
      ],
    },
    {
      heading: 'Shipping',
      body: [
        'We ship nationwide from Iloilo City. Once your order ships, delivery usually takes 2 to 3 days. Courier delays are outside our control, but we’ll help you follow up on any delay. Please make sure your delivery details are complete and correct.',
      ],
    },
    {
      heading: 'Returns',
      body: [
        'If something isn’t right with your order, you can return it within 1 week of receiving it. The customer covers return shipping. Email acuavibe@gmail.com to start a return, and we’ll confirm how your refund or exchange will be handled.',
      ],
    },
    {
      heading: 'Custom commissions',
      body: [
        'Sending a commission request is free and doesn’t commit you to anything. We reply within 48 hours with a complimentary concept sketch and a fixed quote. Work begins only after you accept the quote and pay a deposit.',
        'Because each commission is made to order, the deposit amount, what happens if you cancel, and any return or change terms are confirmed with you in writing before you pay anything.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'Please give accurate information and keep your password to yourself. You’re responsible for activity under your account. We may suspend an account that’s used to misuse the website.',
      ],
    },
    {
      heading: 'Using the website',
      body: [
        'Please don’t use the website in ways that harm it or other people, including trying to break its security, overloading it, copying its content in bulk, or misusing the concierge chat.',
      ],
    },
    {
      heading: 'Designs and content',
      body: [
        'Our designs, photos, logo and the content of this website belong to ACUA. Please don’t reuse them without our permission. When you upload reference images for a commission, you confirm you have the right to share them, and we use them only for your commission.',
      ],
    },
    {
      heading: 'Our responsibility',
      body: [
        'To the extent Philippine law allows, ACUA isn’t responsible for indirect losses, and our total responsibility for any order is limited to the amount you paid for it. Nothing in these terms limits the rights you have as a consumer under the Consumer Act of the Philippines (Republic Act No. 7394).',
      ],
    },
    {
      heading: 'Governing law',
      body: ['These terms are governed by the laws of the Philippines.'],
    },
    {
      heading: 'Changes and contact',
      body: [
        'If we change these terms, we’ll update the date at the top of this page. Questions? Email acuavibe@gmail.com.',
      ],
    },
  ],
};
