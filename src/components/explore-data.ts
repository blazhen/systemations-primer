// Explore Your Options page - data and configuration.
// Australian English. No em dashes or en dashes anywhere in this file.

// ---------------------------------------------------------------------------
// SINGLE CONFIGURATION OBJECT
// ---------------------------------------------------------------------------
// Edit these values to go live. Everything else on the page is guided example
// content and stays safe until these are filled in.
//
// WHAT IS REAL / LIVE vs GUIDED vs AWAITING:
// - welcomeVideoUrl: AWAITING. Dan's welcome video has not been recorded or
//   supplied yet. Leave as null and the page shows the "coming soon" state.
//   Paste a Vimeo or YouTube embed URL (or a hosted .mp4) to switch it on.
// - voiceWidget: REAL. The genuine Systemations prospect voice demo widget,
//   already saved in the subaccount as Embedded/Inline, Visualizer mode. It
//   offers "try an example" (fictional Coastal Services) or "demo my business"
//   (takes and confirms business context orally, then role-plays
//   receptionist). Mounted only on the Phone enquiries tab. It does not
//   auto-start a call or request microphone access on load. A truthful
//   fallback shows if the script fails to load.
// - textChatWidget: REAL. The genuine Systemations text chat widget, already
//   saved in the subaccount as Embedded/Inline, contact-form capture OFF,
//   attachments and voice notes OFF, demo copy, no marketing opt-in. Mounted
//   only on the Text conversation tab when the visitor chooses Live AI chat.
//   Isolated in a dedicated iframe srcDoc. Clean removal on unmount prevents
//   duplicate provider DOM. No proxy or backend, no fake generated replies.
// - clientStories: AWAITING. No approved client proof has been supplied yet.
//   Leave as an empty array. The results section is hidden until real,
//   approved stories are added here.
// ---------------------------------------------------------------------------

// Official Systemations logo, reused in the brand bar and footer.
export const LOGO_URL =
  "https://vibe.filesafe.space/1790736768781725209/attachments/c26e8b26-329f-43bc-95f4-556b17047acb.png";

export interface VoiceWidgetConfig {
  loaderUrl: string;
  resourcesUrl: string;
  widgetId: string;
}

export interface ExploreConfig {
  // null until Dan records and supplies the welcome video.
  // Accepts a Vimeo/YouTube embed URL or a hosted video file URL.
  welcomeVideoUrl: string | null;
  // Real. The genuine Systemations voice widget. Mounted on the phone tab.
  voiceWidget: VoiceWidgetConfig | null;
  // Real. The genuine Systemations text chat widget. Mounted on the text tab
  // when the visitor chooses Live AI chat.
  textChatWidget: VoiceWidgetConfig | null;
  // Real. The same prospect voice demo widget, used for the personalised
  // spoken-brief flow when a business profile is approved.
  personalisedVoiceWidget: VoiceWidgetConfig | null;
  // Optional. Empty until real, approved client stories are supplied.
  clientStories: ClientStory[];
}

export interface ClientStory {
  number: string;
  quote: string;
  name: string;
  business: string;
}

// Reusable agent profile for the AI demo assistant shown in the live text
// and voice demo headers. The native embedded profiles are updated separately.
export interface AgentProfile {
  name: string;
  role: string;
  photoUrl: string;
  alt: string;
}

export const AI_AGENT_PROFILE: AgentProfile = {
  name: "Erin",
  role: "AI demo assistant",
  photoUrl:
    "https://images.leadconnectorhq.com/image/f_webp/q_80/r_320/u_https://assets.cdn.filesafe.space/I5m0bMvsNg1SYDQ1yYZy/media/6ad9aa3ea0c3fa1f7d6b516f.jpg",
  alt: "Erin, Systemations AI demo assistant",
};

export const EXPLORE_CONFIG: ExploreConfig = {
  welcomeVideoUrl: null,
  voiceWidget: {
    loaderUrl: "https://widgets.leadconnectorhq.com/loader.js",
    resourcesUrl: "https://widgets.leadconnectorhq.com/chat-widget/loader.js",
    widgetId: "6ad99f274325b0230232a159",
  },
  textChatWidget: {
    loaderUrl: "https://widgets.leadconnectorhq.com/loader.js",
    resourcesUrl: "https://widgets.leadconnectorhq.com/chat-widget/loader.js",
    widgetId: "6ad99734c5fa6117302d51ee",
  },
  // Real. The same prospect voice demo widget, used for the personalised
  // spoken-brief flow when a business profile is approved.
  personalisedVoiceWidget: {
    loaderUrl: "https://widgets.leadconnectorhq.com/loader.js",
    resourcesUrl: "https://widgets.leadconnectorhq.com/chat-widget/loader.js",
    widgetId: "6ad99f274325b0230232a159",
  },
  clientStories: [],
};

// ---------------------------------------------------------------------------
// Actual demo screenshots from the verified DEMO - Trades & Construction
// subaccount (fictional Brightline Insulation). Genuine Systemations platform
// screens, not real client results and not a live account embed. All names,
// phone and email details, jobs, messages and figures are fictional sample
// data. Original images at 1512x770.
// ---------------------------------------------------------------------------
export interface DemoScreenshot {
  id: string;
  label: string;
  url: string;
  alt: string;
  caption: string;
}

export const DEMO_SCREENSHOTS: DemoScreenshot[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    url: "https://assets.cdn.filesafe.space/I5m0bMvsNg1SYDQ1yYZy/media/6ad9be0bfdcb71bb826bae0a.png",
    alt: "Pipeline board in the Brightline Insulation demonstration account, showing sample enquiries and jobs across stages with fictional job values and an owner assigned.",
    caption:
      "See where every enquiry and job sits. Stages move left to right, each job shows its value, and the owner is visible at a glance.",
  },
  {
    id: "customer-record",
    label: "Customer record",
    url: "https://assets.cdn.filesafe.space/I5m0bMvsNg1SYDQ1yYZy/media/6ad9be0b55feecaeeaa239ee.png",
    alt: "Customer record in the Brightline Insulation demonstration account, showing a sample conversation history with emails and texts, job notes and a next action, all fictional sample data.",
    caption:
      "Keep conversations and job notes together. A sample email and text history sits beside the next action, so nothing lives in a separate inbox.",
  },
  {
    id: "owner-dashboard",
    label: "Owner dashboard",
    url: "https://assets.cdn.filesafe.space/I5m0bMvsNg1SYDQ1yYZy/media/6ad9be0b3699fd27a08df835.png",
    alt: "Owner dashboard in the Brightline Insulation demonstration account, showing sample opportunity status, pipeline value and conversion figures, all fictional sample data.",
    caption:
      "See the bigger picture. Sample opportunity status, pipeline value and conversion sit on one screen instead of in your head.",
  },
];

// Existing Dan photo, reused as the presenter portrait (not a video still).
export { DAN_PHOTO_URL } from "./landing-data";

export const EXPLORE_FAQ_ITEMS = [
  {
    q: "Do I need to try everything?",
    a: "No. Pick the one area that matters most to you right now and start there. The examples are there to help you picture it, not to test you.",
  },
  {
    q: "Will this be built around our business?",
    a: "Yes. We map an approved journey with you and build the scope you agree to. Your build includes the modules agreed for your business. We confirm scope on the call.",
  },
  {
    q: "Do we need to replace all our software?",
    a: "No. We look at what you already run, keep what works and look at feasible integrations for the rest. Selected website and accounting integrations can be discussed on the call.",
  },
  {
    q: "Can I move my call?",
    a: "Yes. Reply to the booking email or text this link came in and we will find a new time that suits you.",
  },
];

// ---------------------------------------------------------------------------
// Priority selector (section 4)
// ---------------------------------------------------------------------------
export type PriorityId = "answering" | "following-up" | "admin";

export interface PriorityOption {
  id: PriorityId;
  label: string;
  blurb: string;
  // which demo tab + scenario it jumps to
  tab: "text" | "phone" | "behind";
  scenario?: TextScenarioId;
  // which text mode to select (live chat or guided examples)
  mode?: "live" | "guided";
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: "answering",
    label: "Answering enquiries",
    blurb: "See a new enquiry come in and get handled in minutes.",
    tab: "text",
    scenario: "new-enquiry",
    mode: "live",
  },
  {
    id: "following-up",
    label: "Following up leads and quotes",
    blurb: "Watch a quote follow-up chase itself, then alert the owner.",
    tab: "text",
    scenario: "quote-followup",
    mode: "guided",
  },
  {
    id: "admin",
    label: "Keeping admin organised",
    blurb: "Step through an enquiry from capture to booking and review.",
    tab: "behind",
  },
];

// ---------------------------------------------------------------------------
// Text conversation demo
// ---------------------------------------------------------------------------
// The prospect plays the CUSTOMER. Each node shows an assistant message on the
// left, then offers the customer reply choices. Selecting a reply appends that
// customer message on the right and advances to the next node, which shows the
// assistant's response. Both sides stay visible in the transcript.
export type TextScenarioId = "new-enquiry" | "quote-followup" | "booking-reminder";

export interface EnquiryState {
  status: string;
  name: string;
  business: string;
  service: string;
  suburb: string;
  callback: string;
  booking: string;
}

export interface TimelineEvent {
  label: string;
  detail: string;
}

export interface TextReply {
  // the customer message shown on the right when chosen
  label: string;
  // node id to advance to, or null to end the example
  to: string | null;
  // enquiry state captured when this customer reply is chosen
  enquiry?: Partial<EnquiryState>;
  // timeline events added when this customer reply is chosen
  timeline?: TimelineEvent[];
}

export interface TextNode {
  id: string;
  // the assistant message shown on the left when we arrive at this node
  assistant: string;
  // customer reply choices offered to the prospect
  replies: TextReply[];
}

export interface TextScenario {
  id: TextScenarioId;
  label: string;
  startNode: string;
  nodes: Record<string, TextNode>;
}

const blankEnquiry: EnquiryState = {
  status: "New enquiry",
  name: "Alex",
  business: "Coastal Services",
  service: "",
  suburb: "",
  callback: "",
  booking: "",
};

export { blankEnquiry };

export const TEXT_SCENARIOS: Record<TextScenarioId, TextScenario> = {
  "new-enquiry": {
    id: "new-enquiry",
    label: "New enquiry",
    startNode: "ne-start",
    nodes: {
      "ne-start": {
        id: "ne-start",
        assistant: "Hi, you have reached Coastal Services. How can we help you today?",
        replies: [
          {
            label: "I need a service visit",
            to: "ne-suburb",
            enquiry: { service: "Service visit", status: "New enquiry" },
            timeline: [
              {
                label: "Enquiry captured",
                detail: "New text enquiry from Alex at Coastal Services.",
              },
            ],
          },
        ],
      },
      "ne-suburb": {
        id: "ne-suburb",
        assistant: "No problem. What suburb are you in?",
        replies: [
          {
            label: "Maroochydore",
            to: "ne-callback",
            enquiry: { suburb: "Maroochydore" },
            timeline: [{ label: "Suburb captured", detail: "Maroochydore noted as in area." }],
          },
        ],
      },
      "ne-callback": {
        id: "ne-callback",
        assistant:
          "Got it, Maroochydore is in our area. What is the best time for us to call you back?",
        replies: [
          {
            label: "Afternoon works best",
            to: "ne-task",
            enquiry: { callback: "Afternoon", status: "Callback booked" },
            timeline: [
              {
                label: "Callback booked",
                detail:
                  "Team assigned to call Alex this afternoon and confirm a time. No one had to remember.",
              },
            ],
          },
        ],
      },
      "ne-task": {
        id: "ne-task",
        assistant:
          "All noted. I will pass this to the team and someone will call you this afternoon to confirm a time. Thanks, Alex.",
        replies: [{ label: "End of example", to: null }],
      },
    },
  },

  "quote-followup": {
    id: "quote-followup",
    label: "Quote follow-up",
    startNode: "qf-start",
    nodes: {
      "qf-start": {
        id: "qf-start",
        assistant:
          "Hi Alex, it is Coastal Services following up on the quote we sent through last week. Is there anything we can help with?",
        replies: [
          {
            label: "I have a question",
            to: "qf-question",
            enquiry: { status: "Owner to call" },
            timeline: [
              {
                label: "Follow-up paused",
                detail: "Generic follow-up stopped so the owner can step in.",
              },
              {
                label: "Owner alerted",
                detail: "Owner notified to call Alex directly about the quote.",
              },
            ],
          },
          {
            label: "Not ready yet",
            to: "qf-notready",
            enquiry: { status: "Check-in agreed for later" },
            timeline: [
              {
                label: "Check-in agreed",
                detail: "Follow-up paused. A later check-in is scheduled for Alex.",
              },
            ],
          },
        ],
      },
      "qf-question": {
        id: "qf-question",
        assistant:
          "Happy to help. I will flag this for the owner to call you directly so they can go over it with you.",
        replies: [{ label: "End of example", to: null }],
      },
      "qf-notready": {
        id: "qf-notready",
        assistant:
          "No problem at all. I will note you are not ready yet and we can check in again in a couple of weeks. No pressure.",
        replies: [{ label: "End of example", to: null }],
      },
    },
  },

  "booking-reminder": {
    id: "booking-reminder",
    label: "Booking reminder",
    startNode: "br-start",
    nodes: {
      "br-start": {
        id: "br-start",
        assistant:
          "Hi Alex, a quick reminder from Coastal Services about your booking later this week. Does the time still work for you?",
        replies: [
          {
            label: "I need to reschedule",
            to: "br-times",
            enquiry: { status: "Reschedule requested" },
            timeline: [
              {
                label: "Reschedule requested",
                detail: "Approved reminder picked up Alex's request to move the booking.",
              },
            ],
          },
          {
            label: "That works",
            to: "br-keep",
            enquiry: { status: "Booking confirmed" },
            timeline: [
              {
                label: "Booking confirmed",
                detail: "Reminder acknowledged. Booking kept at the original time.",
              },
            ],
          },
        ],
      },
      "br-times": {
        id: "br-times",
        assistant: "No worries. Would Tuesday 9am or Wednesday 2pm suit you better?",
        replies: [
          {
            label: "Tuesday 9am",
            to: "br-moved-tue",
            enquiry: { booking: "Tuesday 9am", status: "Booking rescheduled" },
            timeline: [
              {
                label: "Booking rescheduled",
                detail: "Moved to Tuesday 9am. Reminder updated automatically.",
              },
            ],
          },
          {
            label: "Wednesday 2pm",
            to: "br-moved-wed",
            enquiry: { booking: "Wednesday 2pm", status: "Booking rescheduled" },
            timeline: [
              {
                label: "Booking rescheduled",
                detail: "Moved to Wednesday 2pm. Reminder updated automatically.",
              },
            ],
          },
        ],
      },
      "br-moved-tue": {
        id: "br-moved-tue",
        assistant:
          "Done. I have moved your booking to Tuesday 9am and updated your reminder. See you then.",
        replies: [{ label: "End of example", to: null }],
      },
      "br-moved-wed": {
        id: "br-moved-wed",
        assistant:
          "Done. I have moved your booking to Wednesday 2pm and updated your reminder. See you then.",
        replies: [{ label: "End of example", to: null }],
      },
      "br-keep": {
        id: "br-keep",
        assistant: "Great, we will see you at the booked time. Thanks for confirming, Alex.",
        replies: [{ label: "End of example", to: null }],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Phone call demo (guided example turns)
// ---------------------------------------------------------------------------
export interface PhoneTurn {
  id: string;
  speaker: "customer" | "agent";
  text: string;
  enquiry?: Partial<EnquiryState>;
  timeline?: TimelineEvent;
}

export const PHONE_TURNS: PhoneTurn[] = [
  {
    id: "p1",
    speaker: "customer",
    text: "Hi, I'm calling about getting some service work done. I saw you handle small businesses?",
    enquiry: { ...blankEnquiry, status: "Inbound call, new enquiry" },
    timeline: { label: "Call connected", detail: "Inbound call from Alex at Coastal Services." },
  },
  {
    id: "p2",
    speaker: "agent",
    text: "We do. What sort of service work are you after, and where are you based?",
  },
  {
    id: "p3",
    speaker: "customer",
    text: "Mostly maintenance and a few odd jobs. We're in Maroochydore.",
    enquiry: { service: "Maintenance and odd jobs", suburb: "Maroochydore" },
    timeline: { label: "Service and suburb captured", detail: "Maintenance work, Maroochydore." },
  },
  {
    id: "p4",
    speaker: "agent",
    text: "Got it. What's the best number and time to call you back to confirm?",
  },
  {
    id: "p5",
    speaker: "customer",
    text: "0400 000 000, before 5pm works.",
    enquiry: { callback: "0400 000 000, before 5pm" },
    timeline: { label: "Callback preference captured", detail: "Best time and number noted." },
  },
  {
    id: "p6",
    speaker: "agent",
    text: "All noted. I'll pass this to the team and someone will call to confirm a time. Thanks, Alex.",
    enquiry: { status: "Team assigned" },
    timeline: { label: "Human handoff", detail: "Enquiry handed to the team to call and confirm." },
  },
];

// ---------------------------------------------------------------------------
// Behind the scenes (enquiry timeline)
// ---------------------------------------------------------------------------
export interface BtsStage {
  id: string;
  label: string;
  summary: string;
  // what the owner sees / what changes for them
  ownerNote: string;
  // a sample message or task preview
  preview: {
    kind: "message" | "task" | "email-draft" | "quote" | "invoice";
    title: string;
    body: string;
    // approval state for AI generated content
    awaitingApproval?: boolean;
  };
  // CRM preview stage
  crmStage: string;
}

export const BTS_STAGES: BtsStage[] = [
  {
    id: "captured",
    label: "Enquiry captured",
    summary: "A new enquiry lands in one place from the text conversation.",
    ownerNote: "You see it without anyone typing it in. The details are already filled out.",
    preview: {
      kind: "message",
      title: "New enquiry from Alex",
      body: "Coastal Services, Maroochydore. Service work. Callback 0400 000 000, before 5pm.",
    },
    crmStage: "New",
  },
  {
    id: "assigned",
    label: "Owner assigned",
    summary: "The enquiry is routed to the right person for the job type.",
    ownerNote: "It lands on the right desk without you deciding who each time.",
    preview: {
      kind: "task",
      title: "Task: call Alex to confirm",
      body: "Assigned to the team. Due before 5pm today. Linked to the Coastal Services enquiry.",
    },
    crmStage: "Assigned",
  },
  {
    id: "follow-up",
    label: "Follow-up",
    summary: "A follow-up is drafted for review. Once approved, it can be sent at the agreed time.",
    ownerNote: "You approve the draft before anything goes out. Nothing sends itself on its own.",
    preview: {
      kind: "email-draft",
      title: "Follow-up email to Alex",
      body: "Hi Alex, following up on your service enquiry. Are you still after a hand this week? We can call to confirm a time.",
      awaitingApproval: true,
    },
    crmStage: "Following up",
  },
  {
    id: "booking",
    label: "Booking",
    summary: "The quote is accepted and the booking is confirmed.",
    ownerNote: "You approve the numbers before anything goes out. Nothing is priced on its own.",
    preview: {
      kind: "quote",
      title: "Quote for Coastal Services",
      body: "Service work, Maroochydore. Lines and total prepared for your review before sending.",
      awaitingApproval: true,
    },
    crmStage: "Booked",
  },
  {
    id: "review",
    label: "Review or repeat work",
    summary: "Job complete. A review request is queued and a repeat reminder is set.",
    ownerNote:
      "The invoice waits for your approval, then a repeat-service reminder is set for next time.",
    preview: {
      kind: "invoice",
      title: "Invoice for Coastal Services",
      body: "Prepared from the approved quote. Ready for your approval before it is sent.",
      awaitingApproval: true,
    },
    crmStage: "Complete",
  },
];

// ---------------------------------------------------------------------------
// Phase 1 capability rows (section 6)
// ---------------------------------------------------------------------------
export interface CapabilityRow {
  problem: string;
  capabilities: string[];
  note?: string;
}

export const CAPABILITY_ROWS: CapabilityRow[] = [
  {
    problem: "Where enquiries and leads come in",
    capabilities: ["CRM and lead capture", "Journey mapping", "Pipelines and forms"],
  },
  {
    problem: "How the phone gets answered",
    capabilities: ["Phone AI", "Approved communication workflows"],
  },
  {
    problem: "The inbox and the daily admin",
    capabilities: ["Email sorting and drafts", "Daily briefing"],
  },
  {
    problem: "Quotes, invoices and the calendar",
    capabilities: ["Quotes and invoices", "Calendars and reminders"],
  },
  {
    problem: "Bringing customers back",
    capabilities: ["Repeat-service reminders", "Reporting"],
  },
  {
    problem: "Connecting your existing tools",
    capabilities: [
      "Accounting integrations",
      "Repeat-service integrations",
      "Scope confirmed in your build",
    ],
    note: "With an agreed and tested accounting setup, invoices can flow from Systemations to your accounting platform, and contacts can be imported for matching. Repeat-service reminders can be set for regular work. This is not a blanket two-way sync, and receipts and catalogue items are not synced.",
  },
];

export const PHASE1_INCLUDED = [
  "A foundation and journey workshop",
  "Pipelines and forms",
  "Approved workflows",
  "Contact import and reporting",
  "Team walkthrough and handover",
  "The modules agreed for your business",
];
