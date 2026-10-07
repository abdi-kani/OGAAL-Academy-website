/**
 * OGAAL Academy — central site configuration and content.
 *
 * Edit text, navigation, programme content and contact details here; pages update automatically.
 *
 * CONTACT RULE: a contact value of `null` (or `confirmed: false`) is treated as unconfirmed and is
 * never shown publicly. Fill values in only once they are confirmed and active.
 */

export const site = {
  name: "OGAAL Academy",
  fullName: "OGAAL Firearms Safety and Responsibility Training Academy",
  descriptor: "Firearms Safety & Responsibility Training Academy",
  tagline: "Safety First. Responsibility Always.",
  location: { city: "Mogadishu", country: "Somalia", countryCode: "SO", label: "Mogadishu, Somalia" },
  // Intended production domain. NOT live until registered and deployed — set NEXT_PUBLIC_SITE_URL then.
  intendedDomain: "ogaalacademy.so",
  seo: {
    homeTitle: "OGAAL Academy | Firearms Safety & Responsibility Training",
    homeDescription:
      "Explore firearm safety and responsibility education at OGAAL Academy in Mogadishu. Find training information, admission requirements, and course enquiries.",
  },
  /** Set to a path such as "/privacy" once a privacy policy has been approved and added. */
  privacyPolicyHref: null as string | null,
  logo: {
    full: { src: "/brand/ogaal-logo.png", width: 431, height: 458 },
    mark: { src: "/brand/ogaal-mark.png", width: 236, height: 277 },
    alt: "OGAAL Firearms Safety & Responsibility Training Academy logo",
  },
};

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
export const nav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Training", href: "/training" },
  { label: "Partners", href: "/#partners" },
  { label: "Admissions", href: "/admissions" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Training", href: "/training" },
  { label: "Admissions", href: "/admissions" },
  { label: "Certification", href: "/certification" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const headerCta = { label: "Enquire Now", href: "/contact" };

/* ------------------------------------------------------------------ */
/* Contact details                                                     */
/* ------------------------------------------------------------------ */
export const contact = {
  // Confirmed by the academy (Oct 2026). Set confirmed: false to hide it again.
  email: { address: "info@ogaalacademy.so", confirmed: true },
  phone: null as string | null, // e.g. "+252 61 000 0000"
  whatsapp: null as string | null, // international digits only, e.g. "25261xxxxxxx"
  streetAddress: null as string | null, // full academy address
  openingHours: null as string | null, // e.g. "Saturday–Thursday, 8:00–16:00"
  social: [
    // Add confirmed profiles only, e.g. { platform: "Facebook", handle: "@infoogaalacademy", url: "https://facebook.com/..." }
  ] as { platform: string; handle: string; url: string }[],
};

/* ------------------------------------------------------------------ */
/* Imagery                                                             */
/* ------------------------------------------------------------------ */
export const art = {
  hero: {
    src: "/images/3d/hero-shield-book.webp",
    width: 1147,
    height: 1095,
    alt: "Illustration of a blue shield with a check mark floating above an open book, symbolising safety through education",
  },
  icons: {
    shield: { src: "/images/3d/icon-shield.webp", width: 340, height: 424 },
    book: { src: "/images/3d/icon-book.webp", width: 528, height: 347 },
    people: { src: "/images/3d/icon-people.webp", width: 408, height: 248 },
  },
};

/** Licensed photographs still to be supplied. `src: null` shows a labelled placeholder. */
export const photos = {
  classroom: {
    src: null as string | null,
    alt: "Adult learners in a classroom session with an instructor",
    brief: "Adult Somali learners (men and women) attentive to an instructor at a whiteboard. Calm, professional, daylight. No weapons visible.",
  },
  instructor: {
    src: null as string | null,
    alt: "Instructor reviewing printed safety materials with a small group",
    brief: "Instructor and small group around a table reviewing printed safety materials.",
  },
};

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */
export const hero = {
  eyebrow: "OGAAL Academy",
  headingLines: ["Safety First.", "Responsibility Always."],
  subtitle: "Firearms Safety & Responsibility Training Academy",
  description: "Professional safety education. Responsible ownership. Safer communities.",
  primary: { label: "Explore Training", href: "/training" },
  secondary: { label: "Contact Us", href: "/contact" },
  floatingLabels: [
    { icon: "graduation", text: "Safety-focused education" },
    { icon: "pin", text: "Mogadishu, Somalia" },
    { icon: "target", text: "Supervised safety training" },
  ],
} as const;

export const introCards = [
  {
    icon: "shield",
    title: "Safety Awareness",
    text: "Consistent safety habits and an understanding of risk come first.",
  },
  {
    icon: "book",
    title: "Professional Training",
    text: "Structured education that strengthens safety knowledge and responsible judgment.",
  },
  {
    icon: "people",
    title: "Responsible Ownership",
    text: "Ownership carries personal accountability for every decision.",
  },
] as const;

export const aboutPreview = {
  heading: { lead: "Knowledge that", accent: "protects." },
  text: "OGAAL Academy is a private professional training institution in Mogadishu, Somalia. We focus on firearm safety, responsible ownership, and accident prevention through structured education and supervised safety training.",
  cta: { label: "Learn About OGAAL", href: "/about" },
};

/** Home page "Knowledge with a purpose" list: pick a topic on the left, details show on the right. */
export const trainingTabs = {
  eyebrow: "Our Training",
  headingLines: ["Knowledge with", "a purpose."],
  intro: "Explore the academy’s core areas of safety education.",
  items: [
    {
      title: "Firearm safety",
      icon: "pistol",
      eyebrow: "A foundation in safety",
      heading: "Awareness comes first.",
      text: "Develop an understanding of firearm safety, risk awareness and the importance of a consistent safety mindset.",
    },
    {
      title: "Responsible ownership",
      icon: "gunLock",
      eyebrow: "Accountability",
      heading: "Every decision matters.",
      text: "Explore accountability, sound judgment, safe storage and consideration for others.",
    },
    {
      title: "Assessment & certification",
      icon: "award",
      eyebrow: "Proven understanding",
      heading: "Learning you can demonstrate.",
      text: "Demonstrate your understanding through the academy’s assessment process. Successful participants receive an OGAAL Firearms Safety Training Certificate.",
    },
  ],
  cta: { label: "View All Training", href: "/training" },
} as const;

/**
 * Partners and cooperation (home page, #partners).
 * status: "pending" shows "Agreement pending signature confirmation".
 * Change to "signed" only once the signed agreement is in hand.
 */
export const partnersSection = {
  eyebrow: "Partners & Cooperation",
  headingLines: ["Working together.", "For a safer tomorrow."],
  accent: "safer tomorrow.",
  intro: "Institutional cooperation built around safety education and responsibility.",
  partners: [
    {
      country: "Federal Republic of Somalia",
      name: "Ministry of Internal Security",
      localName: "Wasaaradda Amniga Gudaha",
      text: "Cooperation concerning structured training and assessment for personnel working in private security.",
      status: "pending" as "pending" | "signed",
    },
  ],
};

export const closingCta = {
  heading: "Start your learning journey.",
  text: "Contact our team to discuss admission requirements, training dates, and organisational enquiries.",
  cta: { label: "Enquire About Training", href: "/contact" },
};

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */
export const about = {
  heading: "About OGAAL Academy",
  hero: {
    eyebrow: "01 / About OGAAL",
    headingLines: ["Responsibility", "starts with", "knowledge"],
    text: "Professional firearms safety education for individuals, security personnel, and organisations.",
    primary: { label: "Discover our approach", href: "#approach" },
    pillars: ["Safety", "Accountability", "Respect for life"],
  },
  strip: ["Classroom learning", "Supervised safety exercises", "Assessment"],
  whoHeading: "Safety. Responsibility. Respect.",

  intro: [
    "OGAAL Firearms Safety and Responsibility Training Academy provides professional safety education for eligible individuals, security personnel, and organisations.",
    "Our approach combines classroom learning, supervised safety exercises, and assessment. We encourage lawful conduct, personal accountability, and respect for life throughout the learning process.",
  ],
  mission:
    "To promote safe, lawful, and responsible firearm ownership through professional training, practical education, and a strong culture of safety and accountability.",
  vision:
    "To become a trusted leader in firearm safety training and professional certification, recognised for high standards, responsible practice, and compliance.",
  values: [
    { icon: "shield", title: "Safety", text: "Protecting learners, instructors, and the public." },
    { icon: "briefcase", title: "Professionalism", text: "Maintaining clear standards in training and assessment." },
    { icon: "userCheck", title: "Responsibility", text: "Encouraging accountability and sound judgment." },
    { icon: "badge", title: "Integrity", text: "Acting honestly and ethically." },
    { icon: "scale", title: "Compliance", text: "Respecting applicable laws and institutional requirements." },
  ],
  approach: {
    eyebrow: "Our Training Approach",
    headingLines: ["A clear path to", "responsible learning."],
    intro: "Building safety knowledge, sound judgment, and accountability.",
    feature: ["Knowledge.", "Practice.", "Responsibility."],
    bar: { lead: "Learn with purpose.", accent: "Act with responsibility.", cta: { label: "Enquire about training", href: "/contact?type=Training" } },
    items: [
      { icon: "presentation", title: "Structured classroom education", text: "Clear, organised lessons that build understanding of safety principles step by step." },
      { icon: "safetyGlasses", title: "Supervised safety learning", text: "Practical learning takes place under instructor supervision in a controlled environment." },
      { icon: "clipboard", title: "Assessment of understanding", text: "Participants demonstrate what they have learned through the academy’s assessment process." },
      { icon: "handshake", title: "Responsible conduct", text: "Respect for others, lawful behaviour, and self-discipline are expected throughout." },
      { icon: "refresh", title: "Continuous improvement", text: "We review our training regularly to keep standards clear and relevant." },
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Training                                                            */
/* ------------------------------------------------------------------ */
export const trainingPage = {
  heading: "Training and Safety Education",
  intro: "Explore learning focused on firearm safety, responsible ownership, and accident prevention.",
  hero: {
    eyebrow: "Training & Safety Education",
    headingLines: ["Training for a", "safer tomorrow"],
    primary: { label: "Explore Programmes", href: "#programmes" },
    secondary: { label: "Enquire Now", href: "/contact?type=Training" },
  },
  servicesHeading: { lead: "Programmes &", accent: "services." },
  servicesIntro: "Build knowledge. Strengthen responsibility.",
  cta: {
    headingLines: ["Your next step starts", "with knowledge"],
    text: "Speak with OGAAL about training enquiries.",
    cta: { label: "Contact the Academy", href: "/contact?type=Training" },
  },
};

export const training = [
  { slug: "safety-education", icon: "pistol", title: "Firearm Safety Education", text: "Understand safety principles and the importance of preventing accidents." },
  { slug: "responsible-ownership", icon: "userCheck", title: "Responsible Ownership", text: "Explore accountability, sound judgment, and consideration for others." },
  { slug: "storage-transportation", icon: "gunLock", title: "Safe Storage and Transportation", text: "Learn the principles of secure storage, preventing unauthorised access, and responsible transportation." },
  { slug: "legal-ethical", icon: "scale", title: "Legal and Ethical Awareness", text: "Develop awareness of applicable laws, regulations, and personal responsibilities." },
  { slug: "supervised-exercises", icon: "target", title: "Supervised Safety Exercises", text: "Participate in structured safety education under instructor supervision." },
  { slug: "assessment-certification", icon: "award", title: "Assessment and Certification", text: "Demonstrate understanding through the academy’s assessment process." },
  { slug: "organisational-refresher", icon: "building", title: "Organisational and Refresher Training", text: "Enquire about education for your team or refresher learning to reinforce safety awareness." },
] as const;

/** Topics shown in the scrolling band on the home page (all taken from the two-day programme). */
export const safetyTopics = [
  { icon: "pistol", text: "Firearm safety" },
  { icon: "rifle", text: "Firearm identification" },
  { icon: "clipboard", text: "Safety rules and procedures" },
  { icon: "gunSafe", text: "Safe storage" },
  { icon: "gunLock", text: "Responsible transportation" },
  { icon: "scale", text: "Legal responsibilities" },
  { icon: "target", text: "Practical safety exercises" },
  { icon: "earProtection", text: "Supervised demonstrations" },
  { icon: "safetyGlasses", text: "Safety assessment" },
  { icon: "award", text: "Certification" },
] as const;

export const programme = {
  heading: { lead: "Two-Day", accent: "Programme" },
  days: [
    {
      label: "Day One",
      title: "Safety Foundations",
      items: [
        { icon: "shield", text: "Introduction to firearm safety." },
        { icon: "rifle", text: "Firearm identification and awareness." },
        { icon: "scale", text: "Legal responsibilities." },
        { icon: "clipboard", text: "Safety rules and procedures." },
        { icon: "gunSafe", text: "Safe storage and transportation principles." },
      ],
    },
    {
      label: "Day Two",
      title: "Supervised Learning and Assessment",
      items: [
        { icon: "target", text: "Practical safety exercises." },
        { icon: "earProtection", text: "Supervised safety demonstrations." },
        { icon: "badge", text: "Safety assessment." },
        { icon: "refresh", text: "Course review." },
        { icon: "award", text: "Certification for successful participants." },
      ],
    },
  ],
  // The academy's documents list two different fees. Keep this wording until the fee is confirmed.
  feeText: "Contact us for confirmed fees and upcoming dates.",
  cta: { label: "Enquire About This Programme", href: "/contact?type=Training&topic=Two-Day%20Programme" },
};

/* ------------------------------------------------------------------ */
/* Admissions                                                          */
/* ------------------------------------------------------------------ */
export const admissions = {
  heading: "Your Path to Enrolment",
  intro: "Admission is subject to eligibility checks and the required vetting and clearance process.",
  requirementsHeading: { lead: "Admission", accent: "requirements." },
  requirementsLead: "Applicants must:",
  requirements: [
    "Be at least 18 years old.",
    "Hold valid national identification.",
    "Complete the academy’s application form.",
    "Provide passport-size photographs as required.",
    "Declare medical fitness for practical exercises.",
    "Have no disqualifying criminal record.",
    "Complete the required clearance before enrolment.",
  ],
  processHeading: { lead: "Application", accent: "process." },
  steps: [
    { title: "Application", text: "Complete the academy’s application form with accurate information." },
    { title: "Supporting Documents", text: "Provide identification and required documents through the academy’s designated process." },
    { title: "Review and Clearance", text: "Complete the required vetting and clearance before admission." },
    { title: "Enrolment Confirmation", text: "After clearance, confirm payment and receive training details." },
  ],
  formHeading: "Admissions Enquiry",
  formIntro:
    "Send us your questions about admission. This is an enquiry form, not an application: please do not send identity documents, criminal-record information, or medical details here. The academy will explain how to provide documents securely.",
};

/* ------------------------------------------------------------------ */
/* Certification                                                       */
/* ------------------------------------------------------------------ */
export const certification = {
  heading: "OGAAL Training Certification",
  intro:
    "Participants who successfully complete the training and meet the academy’s assessment requirements receive an OGAAL Firearms Safety Training Certificate.",
  requirementsHeading: { lead: "Certification", accent: "requirements." },
  requirements: [
    { icon: "clipboard", text: "Completion of admission and clearance requirements." },
    { icon: "clock", text: "Required attendance." },
    { icon: "handshake", text: "Compliance with trainee conduct standards." },
    { icon: "award", text: "Successful completion of assessment." },
  ],
  confirmsHeading: "What the certificate confirms",
  confirms: "The certificate confirms successful completion of the academy’s training and assessment requirements.",
  notLicence: "It does not replace a firearm licence, permit, or other authorisation required by law.",
  conductHeading: "Trainee conduct",
  conduct: "Participants must follow instructor directions, observe safety rules, attend punctually, and treat others respectfully.",
  conductWarning: "Unsafe or negligent behaviour may result in suspension from training and loss of certification eligibility.",
  cta: { label: "Ask About Certification", href: "/contact?type=Certification" },
};

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */
export const faqs = [
  { q: "How long is the programme?", a: "The programme runs over two days. Contact us for available dates." },
  { q: "Can beginners enquire?", a: "Yes. Beginners may contact the academy to discuss the programme and admission requirements." },
  { q: "Does applying guarantee admission?", a: "No. Enrolment depends on eligibility, required clearance, and confirmation from the academy." },
  { q: "Will I receive a certificate?", a: "Successful participants receive a certificate after meeting the course and assessment requirements." },
  { q: "What is the training fee?", a: "Contact us for the confirmed fee and details of what it includes." },
  { q: "Can organisations enquire about staff training?", a: "Yes. Organisations can contact the academy to discuss their team’s needs." },
  { q: "Does certification replace a firearm licence?", a: "No. A training certificate does not replace any legally required licence, permit, or authorisation." },
];

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */
export const contactPage = {
  heading: "Let’s Talk About Safety",
  intro: "Contact OGAAL Academy for training schedules, admission requirements, organisational training, and general enquiries.",
  enquiryTypes: ["Training", "Admissions", "Organisational Training", "Certification", "General"] as const,
};
