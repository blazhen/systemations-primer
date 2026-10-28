import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { clearDemoValue, DEMO_KEYS, loadDemoValue, saveDemoValue } from "../lib/demo-storage";
import { type BusinessBrief, useBusinessBrief } from "./explore-business-brief";

// ---------------------------------------------------------------------------
// Shared state for the Pipeline and Contact demos. All data is fictional
// (Northside Home Services, Alex at Coastal Services and friends). One store, so
// a card on the board, the contact record and the task list always agree.
// Australian English. No em dashes or en dashes anywhere.
// ---------------------------------------------------------------------------

export const BUSINESS_NAME = "Northside Home Services";
export const EXAMPLE_LABEL = "Example, fictional data";

export type StageId = "new" | "contacted" | "quote" | "following" | "booked" | "won" | "lost";

export interface StageDef {
  id: StageId;
  label: string;
  // What the system does the moment a deal lands in this stage (shown in the toast).
  systemNext: string;
  // Stage automation panel: trigger, steps in order, and what stops it.
  automation: { trigger: string; steps: string[]; stops: string };
  // A deal sitting here this many days or more is "stuck". null = never stuck.
  stuckAfterDays: number | null;
}

export const STAGES: StageDef[] = [
  {
    id: "new",
    label: "New",
    systemNext: "Sends an instant text reply and creates a task to call back within the hour.",
    automation: {
      trigger: "A new enquiry arrives from the website, a call or a text.",
      steps: [
        "Send an instant text so they know you got it",
        "Create a task: call back within 1 hour",
        "Tell the owner by notification",
      ],
      stops: "Stops when the customer replies or the call-back task is ticked.",
    },
    stuckAfterDays: null,
  },
  {
    id: "contacted",
    label: "Contacted",
    systemNext: "Logs the call, then offers a booking link for a site visit.",
    automation: {
      trigger: "The call-back task is ticked, or the customer replies.",
      steps: [
        "Log the conversation on the customer record",
        "Offer a site visit with a booking link",
        "Create a task: prepare the quote",
      ],
      stops: "Stops when a quote is sent or the customer books a visit.",
    },
    stuckAfterDays: 2,
  },
  {
    id: "quote",
    label: "Quote sent",
    systemNext: "Starts a 3 day countdown and queues a gentle check-in text.",
    automation: {
      trigger: "The quote is marked as sent.",
      steps: [
        "Text the customer: your quote is in your inbox",
        "Wait 3 days",
        "Draft a follow-up for you to approve",
      ],
      stops: "Stops when the customer accepts, declines or replies.",
    },
    stuckAfterDays: 3,
  },
  {
    id: "following",
    label: "Following up",
    systemNext: "Drafts a follow-up and waits for your approval before anything is sent.",
    automation: {
      trigger: "No reply 3 days after the quote.",
      steps: [
        "Draft a friendly follow-up (awaiting your approval)",
        "Create a task: phone them if there is still no answer",
        "Mark the deal as at risk after 4 days",
      ],
      stops: "Stops when the customer replies, books or you mark the deal lost.",
    },
    stuckAfterDays: 4,
  },
  {
    id: "booked",
    label: "Booked",
    systemNext: "Sends a booking confirmation and a reminder the day before the job.",
    automation: {
      trigger: "The customer accepts the quote or picks a time.",
      steps: [
        "Send a booking confirmation by text and email",
        "Add the job to the team calendar",
        "Send a reminder the day before",
      ],
      stops: "Stops when the job is marked complete.",
    },
    stuckAfterDays: null,
  },
  {
    id: "won",
    label: "Won",
    systemNext: "Sends a thank-you, asks for a review and queues the invoice for your approval.",
    automation: {
      trigger: "The job is marked complete.",
      steps: [
        "Send a thank-you text",
        "Ask for a Google review 2 days later",
        "Queue the invoice (awaiting your approval)",
      ],
      stops: "Stops when the review is left or after one reminder.",
    },
    stuckAfterDays: null,
  },
  {
    id: "lost",
    label: "Lost",
    systemNext: "Stops all messages and adds them to a check-back-in-six-months list.",
    automation: {
      trigger: "The deal is marked lost.",
      steps: [
        "Stop every automatic message for this customer",
        "Record the reason",
        "Add to a six month check-back list",
      ],
      stops: "Stops by itself. Nothing more is sent.",
    },
    stuckAfterDays: null,
  },
];

export function stageById(id: StageId): StageDef {
  return STAGES.find((s) => s.id === id) ?? (STAGES[0] as StageDef);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type EventKind = "sms" | "email" | "call" | "note" | "stage" | "task";
export type EventDirection = "in" | "out" | "system";

export interface TimelineEvent {
  id: string;
  when: string; // display label, for example "Mon 9:14am" or "Just now"
  kind: EventKind;
  direction: EventDirection;
  text: string;
  // Which workflow step caused this event (shown when the visitor clicks it).
  cause: { workflow: string; step: string; why: string } | null;
}

export interface Task {
  id: string;
  title: string;
  due: string;
  done: boolean;
  // Ticking the task moves the card here, if set.
  movesTo?: StageId;
}

export interface Draft {
  id: string;
  subject: string;
  body: string;
  status: "awaiting" | "approved";
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  suburb: string;
  tags: string[];
  source: string;
  owner: string;
  stage: StageId;
  job: string;
  value: number; // dollars; 0 means "to be quoted"
  daysInStage: number;
  summary: string; // one line for the "sample contact" picker
  timeline: TimelineEvent[];
  tasks: Task[];
  draft: Draft | null;
}

export interface Toast {
  id: number;
  text: string;
}

export interface CrmState {
  contacts: Contact[];
  selectedId: string;
  toast: Toast | null;
  seq: number; // counter for new ids
}

// ---------------------------------------------------------------------------
// Sample data (fictional). Three featured contacts: new enquiry, quote out,
// repeat customer. Others fill the board.
// ---------------------------------------------------------------------------
function ev(
  id: string,
  when: string,
  kind: EventKind,
  direction: EventDirection,
  text: string,
  cause: TimelineEvent["cause"] = null,
): TimelineEvent {
  return { id, when, kind, direction, text, cause };
}

export function createSeed(): CrmState {
  const contacts: Contact[] = [
    {
      id: "priya",
      name: "Priya Nair",
      company: "Nair Family Home",
      phone: "0400 555 014",
      email: "priya.nair@example.com",
      suburb: "Brunswick",
      tags: ["New enquiry", "Home", "Website form"],
      source: "Website form",
      owner: "Sam",
      stage: "new",
      job: "Kitchen renovation",
      value: 3200,
      daysInStage: 0,
      summary: "New enquiry from the website this morning.",
      timeline: [
        ev(
          "p1",
          "Today 8:02am",
          "email",
          "in",
          'Form: "We want to redo our kitchen, can someone quote this week?"',
        ),
        ev(
          "p2",
          "Today 8:02am",
          "sms",
          "out",
          "Hi Priya, thanks for contacting Northside Home Services. We have your enquiry and will call you within the hour.",
          {
            workflow: "New enquiry",
            step: "Step 1: send an instant text",
            why: "This runs the moment a website form arrives, so no one is left waiting.",
          },
        ),
        ev("p3", "Today 8:02am", "task", "system", "Task created: call Priya back within 1 hour", {
          workflow: "New enquiry",
          step: "Step 2: create a call-back task",
          why: "It puts the next action on your list so the enquiry cannot be forgotten.",
        }),
      ],
      tasks: [
        {
          id: "pt1",
          title: "Call Priya back",
          due: "Within 1 hour",
          done: false,
          movesTo: "contacted",
        },
        { id: "pt2", title: "Book a site visit", due: "This week", done: false },
      ],
      draft: null,
    },
    {
      id: "alex",
      name: "Alex",
      company: "Coastal Services",
      phone: "0400 555 027",
      email: "alex@coastalservices.example.com",
      suburb: "Geelong",
      tags: ["Commercial", "Quote out", "Referral"],
      source: "Referral",
      owner: "Jordan",
      stage: "quote",
      job: "Warehouse fit-out",
      value: 18400,
      daysInStage: 4,
      summary: "Quote sent four days ago, no reply yet.",
      timeline: [
        ev(
          "a1",
          "Mon 9:14am",
          "call",
          "in",
          "Call from Alex: wants a quote for the warehouse fit-out.",
          {
            workflow: "Missed call",
            step: "Step 1: log the call",
            why: "Every call lands on the customer record, even when no one picks up.",
          },
        ),
        ev(
          "a2",
          "Mon 9:15am",
          "sms",
          "out",
          "Hi Alex, sorry we missed you. Can we call at 2pm today?",
          {
            workflow: "Missed call",
            step: "Step 2: text back",
            why: "A missed call gets a text within a minute.",
          },
        ),
        ev(
          "a3",
          "Mon 2:10pm",
          "note",
          "out",
          "Call with Alex. Single storey, open floor plan. Site visit Wednesday.",
        ),
        ev("a4", "Thu 11:30am", "email", "out", "Quote #Q-1042 for $18,400 sent.", {
          workflow: "Quote sent",
          step: "Step 1: email the quote",
          why: "Marking the quote as sent emails it and starts the follow-up countdown.",
        }),
        ev(
          "a5",
          "Thu 11:31am",
          "stage",
          "system",
          "Moved to Quote sent. Follow-up countdown started (3 days).",
          {
            workflow: "Quote sent",
            step: "Step 2: start the 3 day timer",
            why: "If nothing happens in 3 days, you get a follow-up draft to approve.",
          },
        ),
      ],
      tasks: [
        {
          id: "at1",
          title: "Phone Alex if no reply",
          due: "Today",
          done: false,
          movesTo: "following",
        },
        { id: "at2", title: "Send compliance certificate", due: "Tomorrow", done: false },
      ],
      draft: null,
    },
    {
      id: "mark",
      name: "Mark Delaney",
      company: "Delaney Home",
      phone: "0400 555 031",
      email: "mark.delaney@example.com",
      suburb: "Torquay",
      tags: ["Repeat customer", "Home", "Review left"],
      source: "Repeat customer",
      owner: "Sam",
      stage: "booked",
      job: "Bathroom refit",
      value: 2650,
      daysInStage: 1,
      summary: "Repeat customer, second job booked.",
      timeline: [
        ev(
          "m1",
          "Last year",
          "note",
          "system",
          "Job complete: kitchen refit, $4,100. Review left (5 stars).",
        ),
        ev(
          "m2",
          "Tue 4:20pm",
          "sms",
          "in",
          "Hi, could you do the bathroom too? Same as last time.",
        ),
        ev(
          "m3",
          "Tue 4:21pm",
          "sms",
          "out",
          "Hi Mark, good to hear from you. I have a quote ready, check your email.",
          {
            workflow: "Repeat customer",
            step: "Step 1: recognise the number",
            why: "The system knows Mark from last time, so it skips the usual questions.",
          },
        ),
        ev(
          "m4",
          "Wed 9:00am",
          "stage",
          "system",
          "Quote accepted. Moved to Booked for Friday 8am.",
          {
            workflow: "Quote accepted",
            step: "Step 1: confirm the booking",
            why: "Accepting the quote books the job and sends a confirmation.",
          },
        ),
        ev(
          "m5",
          "Wed 9:01am",
          "email",
          "out",
          "Booking confirmation sent. Reminder set for Thursday.",
          {
            workflow: "Quote accepted",
            step: "Step 2: confirmation and reminder",
            why: "Sends the confirmation now and a reminder the day before.",
          },
        ),
      ],
      tasks: [
        { id: "mt1", title: "Confirm crew for Friday", due: "Thursday", done: false },
        { id: "mt2", title: "Mark job complete", due: "Friday", done: false, movesTo: "won" },
      ],
      draft: null,
    },
    {
      id: "sam",
      name: "Sam Whitaker",
      company: "Whitaker Builders",
      phone: "0400 555 042",
      email: "sam@whitakerbuilders.example.com",
      suburb: "Ballarat",
      tags: ["Builder", "Contacted"],
      source: "Phone call",
      owner: "Jordan",
      stage: "contacted",
      job: "New build joinery",
      value: 9800,
      daysInStage: 3,
      summary: "Spoke on the phone, waiting on plans.",
      timeline: [
        ev("s1", "Mon 10:00am", "call", "in", "Call from Sam about a new build in Ballarat."),
        ev("s2", "Mon 10:20am", "note", "out", "Sam will send plans by Wednesday."),
      ],
      tasks: [
        { id: "st1", title: "Chase plans from Sam", due: "Today", done: false, movesTo: "quote" },
      ],
      draft: null,
    },
    {
      id: "jess",
      name: "Jess Moreno",
      company: "Moreno Home",
      phone: "0400 555 058",
      email: "jess.moreno@example.com",
      suburb: "Newtown",
      tags: ["Home", "Following up"],
      source: "Google search",
      owner: "Sam",
      stage: "following",
      job: "Deck and pergola",
      value: 4200,
      daysInStage: 5,
      summary: "Followed up once, still quiet.",
      timeline: [
        ev("j1", "Last Fri", "email", "out", "Quote #Q-1038 for $4,200 sent."),
        ev("j2", "Tue 9:00am", "email", "out", "Friendly follow-up sent (approved by Sam).", {
          workflow: "Quote follow-up",
          step: "Step 3: send the approved follow-up",
          why: "Nothing is sent until someone approves the draft.",
        }),
      ],
      tasks: [{ id: "jt1", title: "Phone Jess", due: "Today", done: false }],
      draft: null,
    },
    {
      id: "harbour",
      name: "Dev Patel",
      company: "Harbour Cafe",
      phone: "0400 555 066",
      email: "dev@harbourcafe.example.com",
      suburb: "Williamstown",
      tags: ["Commercial", "Quote out"],
      source: "Website form",
      owner: "Jordan",
      stage: "quote",
      job: "Cafe refit",
      value: 7300,
      daysInStage: 1,
      summary: "Quote sent yesterday.",
      timeline: [ev("h1", "Yesterday 3:00pm", "email", "out", "Quote #Q-1044 for $7,300 sent.")],
      tasks: [{ id: "ht1", title: "Check Dev opened the quote", due: "Friday", done: false }],
      draft: null,
    },
    {
      id: "tran",
      name: "Linh Tran",
      company: "Tran Rentals",
      phone: "0400 555 073",
      email: "linh@tranrentals.example.com",
      suburb: "Footscray",
      tags: ["Landlord", "New enquiry"],
      source: "Facebook",
      owner: "Sam",
      stage: "new",
      job: "Rental unit repaint",
      value: 2900,
      daysInStage: 0,
      summary: "Message from Facebook.",
      timeline: [
        ev("t1", "Today 7:40am", "sms", "in", "Do you do rentals? Two units, same building."),
      ],
      tasks: [
        {
          id: "tt1",
          title: "Call Linh back",
          due: "Within 1 hour",
          done: false,
          movesTo: "contacted",
        },
      ],
      draft: null,
    },
    {
      id: "oak",
      name: "Rhys Collins",
      company: "Oakview Estate",
      phone: "0400 555 081",
      email: "rhys@oakview.example.com",
      suburb: "Werribee",
      tags: ["Builder", "Won"],
      source: "Referral",
      owner: "Jordan",
      stage: "won",
      job: "Estate stage 2 fencing",
      value: 22100,
      daysInStage: 6,
      summary: "Job complete, invoice awaiting approval.",
      timeline: [
        ev(
          "o1",
          "Last Mon",
          "note",
          "system",
          "Job complete. Thank-you text sent. Invoice queued for approval.",
        ),
      ],
      tasks: [{ id: "ot1", title: "Approve invoice", due: "Today", done: false }],
      draft: null,
    },
    {
      id: "lowe",
      name: "Pat Lowe",
      company: "Lowe Garage",
      phone: "0400 555 095",
      email: "pat@lowegarage.example.com",
      suburb: "Frankston",
      tags: ["Lost", "Price"],
      source: "Google search",
      owner: "Sam",
      stage: "lost",
      job: "Garage renovation",
      value: 1900,
      daysInStage: 9,
      summary: "Went with a cheaper quote.",
      timeline: [
        ev(
          "l1",
          "Last week",
          "note",
          "system",
          "Marked lost: price. Added to six month check-back list.",
        ),
      ],
      tasks: [],
      draft: null,
    },
  ];
  return { contacts, selectedId: "alex", toast: null, seq: 1 };
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
export function isStuck(c: Contact): boolean {
  const limit = stageById(c.stage).stuckAfterDays;
  return limit !== null && c.daysInStage >= limit;
}

export function formatMoney(n: number): string {
  if (n <= 0) return "To be quoted";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function cleanText(s: string, max: number): string {
  return (
    s
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max)
  );
}

// ---------------------------------------------------------------------------
// "Your pipeline": when the visitor filled in "Use my business", sample jobs
// and the stage wording come from their own services.
// ---------------------------------------------------------------------------
export function servicesList(brief: BusinessBrief | null): string[] {
  if (!brief) return [];
  return brief.services
    .split(/[,;\n]|\band\b|&/i)
    .map((s) => cleanText(s, 40))
    .filter(Boolean)
    .slice(0, 6);
}

export function stageLabel(id: StageId, brief: BusinessBrief | null): string {
  if (brief?.helpWith === "appointment-enquiries") {
    if (id === "quote") return "Appointment offered";
    if (id === "following") return "Awaiting reply";
    if (id === "booked") return "Appointment booked";
  }
  return stageById(id).label;
}

export function jobLabel(c: Contact, index: number, brief: BusinessBrief | null): string {
  const services = servicesList(brief);
  if (!services.length || c.id.startsWith("lead-")) return c.job;
  // Stable per contact (position in the sample list), so adding a lead never shifts other cards.
  const seedIndex = SEED_ORDER.indexOf(c.id);
  return services[(seedIndex >= 0 ? seedIndex : index) % services.length] ?? c.job;
}

const SEED_ORDER: string[] = createSeed().contacts.map((c) => c.id);

function isValidSaved(s: unknown): s is CrmState {
  if (!s || typeof s !== "object") return false;
  const o = s as Partial<CrmState>;
  if (typeof o.seq !== "number" || typeof o.selectedId !== "string") return false;
  if (!Array.isArray(o.contacts) || o.contacts.length === 0) return false;
  return o.contacts.every(
    (c) =>
      c &&
      typeof c.id === "string" &&
      typeof c.name === "string" &&
      typeof c.value === "number" &&
      typeof c.daysInStage === "number" &&
      STAGES.some((st) => st.id === c.stage) &&
      Array.isArray(c.tasks) &&
      Array.isArray(c.timeline) &&
      Array.isArray(c.tags),
  );
}

export function businessName(brief: BusinessBrief | null): string {
  return brief?.businessName.trim() || BUSINESS_NAME;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
type Action =
  | { type: "move"; id: string; to: StageId; by: "drag" | "button" | "task" }
  | { type: "toggleTask"; contactId: string; taskId: string }
  | { type: "chase"; id: string }
  | { type: "approve"; id: string }
  | { type: "addLead"; name: string; message: string; business: string }
  | { type: "sendQuote"; id: string; total: number; ref: string }
  | { type: "select"; id: string }
  | { type: "dismissToast" }
  | { type: "reset" }
  | { type: "load"; state: CrmState };

function setToast(s: CrmState, text: string): CrmState {
  return { ...s, toast: { id: s.seq, text }, seq: s.seq + 1 };
}

function update(s: CrmState, id: string, fn: (c: Contact) => Contact): Contact[] {
  return s.contacts.map((c) => (c.id === id ? fn(c) : c));
}

function reducer(s: CrmState, a: Action): CrmState {
  switch (a.type) {
    case "load":
      return a.state;
    case "reset":
      return createSeed();
    case "dismissToast":
      return { ...s, toast: null };
    case "sendQuote": {
      const c = s.contacts.find((x) => x.id === a.id);
      if (!c || !(a.total > 0)) return s;
      const withQuote: CrmState = {
        ...s,
        contacts: update(s, a.id, (x) => ({
          ...x,
          value: Math.round(a.total),
          daysInStage: 0,
          timeline: [
            ...x.timeline,
            {
              id: `e${s.seq}`,
              when: "Just now",
              kind: "email",
              direction: "out",
              text: `Quote ${cleanText(a.ref, 20)} for ${formatMoney(a.total)} sent.`,
              cause: {
                workflow: "Quote sent",
                step: "Step 1: email the quote",
                why: "Sending the quote from the quote builder emails it and starts the follow-up countdown.",
              },
            },
          ],
        })),
        seq: s.seq + 1,
      };
      return c.stage === "quote"
        ? withQuote
        : reducer(withQuote, { type: "move", id: a.id, to: "quote", by: "button" });
    }
    case "select":
      return s.contacts.some((c) => c.id === a.id) ? { ...s, selectedId: a.id } : s;
    case "move": {
      const c = s.contacts.find((x) => x.id === a.id);
      if (!c || c.stage === a.to) return s;
      const def = stageById(a.to);
      const step = def.automation.steps[0] ?? "";
      const next: CrmState = {
        ...s,
        contacts: update(s, a.id, (x) => ({
          ...x,
          stage: a.to,
          daysInStage: 0,
          // Moving a deal by hand cancels a draft still waiting for approval.
          draft: x.draft?.status === "awaiting" ? null : x.draft,
          timeline: [
            ...x.timeline,
            {
              id: `e${s.seq}`,
              when: "Just now",
              kind: "stage",
              direction: "system",
              text: `Moved to ${def.label}. ${step}.`,
              cause: {
                workflow: `Stage: ${def.label}`,
                step: "Step 1: " + step.charAt(0).toLowerCase() + step.slice(1),
                why:
                  a.by === "task"
                    ? "Ticking the task moved the card, and the stage workflow started."
                    : "Moving the card starts the workflow for this stage.",
              },
            },
          ],
        })),
        seq: s.seq + 1,
      };
      return setToast(next, `${firstName(c.name)} moved to ${def.label}. ${def.systemNext}`);
    }
    case "toggleTask": {
      const c = s.contacts.find((x) => x.id === a.contactId);
      const t = c?.tasks.find((x) => x.id === a.taskId);
      if (!c || !t) return s;
      const done = !t.done;
      let next: CrmState = {
        ...s,
        contacts: update(s, c.id, (x) => ({
          ...x,
          tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done } : y)),
          timeline: done
            ? [
                ...x.timeline,
                {
                  id: `e${s.seq}`,
                  when: "Just now",
                  kind: "task",
                  direction: "system",
                  text: `Task done: ${t.title}`,
                  cause: {
                    workflow: "Task completed",
                    step: "Step 1: log it on the record",
                    why: "Ticking a task adds a line to the timeline, so the history is always complete.",
                  },
                },
              ]
            : x.timeline,
        })),
        seq: s.seq + 1,
      };
      if (done && t.movesTo && t.movesTo !== c.stage) {
        next = reducer(next, { type: "move", id: c.id, to: t.movesTo, by: "task" });
      }
      return next;
    }
    case "chase": {
      const c = s.contacts.find((x) => x.id === a.id);
      if (!c || c.draft?.status === "awaiting") return s;
      const first = firstName(c.name);
      const draft: Draft = {
        id: `d${s.seq}`,
        subject: `Following up on your ${c.job.toLowerCase()} quote`,
        body: `Hi ${first}, just checking in on the quote we sent for ${c.job.toLowerCase()}. Happy to answer any questions or adjust it. Would a quick call tomorrow suit?`,
        status: "awaiting",
      };
      const next: CrmState = {
        ...s,
        contacts: update(s, c.id, (x) => ({
          ...x,
          draft,
          timeline: [
            ...x.timeline,
            {
              id: `e${s.seq}`,
              when: "Just now",
              kind: "email",
              direction: "system",
              text: "Follow-up drafted. Awaiting your approval.",
              cause: {
                workflow: "Quote follow-up",
                step: "Step 3: draft a follow-up for approval",
                why: "The system writes it, you approve it. Nothing is sent without you.",
              },
            },
          ],
        })),
        seq: s.seq + 1,
      };
      return setToast(
        next,
        `Draft ready for ${first}. Awaiting your approval, nothing has been sent.`,
      );
    }
    case "approve": {
      const c = s.contacts.find((x) => x.id === a.id);
      if (!c?.draft || c.draft.status !== "awaiting") return s;
      const first = firstName(c.name);
      const next: CrmState = {
        ...s,
        contacts: update(s, c.id, (x) => ({
          ...x,
          stage: x.stage === "quote" ? "following" : x.stage,
          daysInStage: 0,
          draft: x.draft ? { ...x.draft, status: "approved" } : null,
          timeline: [
            ...x.timeline,
            {
              id: `e${s.seq}`,
              when: "Just now",
              kind: "email",
              direction: "out",
              text: `Follow-up sent: "${x.draft?.subject ?? ""}"`,
              cause: {
                workflow: "Quote follow-up",
                step: "Step 4: send once approved",
                why: "You approved the draft, so it went out and the 4 day timer restarted.",
              },
            },
          ],
        })),
        seq: s.seq + 1,
      };
      return setToast(
        next,
        `Sent to ${first}. The deal moves to Following up and the timer restarts.`,
      );
    }
    case "addLead": {
      const name = cleanText(a.name, 40);
      const message = cleanText(a.message, 300);
      if (!name || !message) return s;
      const first = firstName(name);
      const id = `lead-${s.seq}`;
      const lead: Contact = {
        id,
        name,
        company: "",
        phone: "Not given yet",
        email: "Not given yet",
        suburb: "Not given yet",
        tags: ["New enquiry", "Typed in by you"],
        source: "Typed in the demo",
        owner: "Sam",
        stage: "new",
        job: "To be confirmed",
        value: 0,
        daysInStage: 0,
        summary: "Added by you just now.",
        timeline: [
          ev(`${id}-1`, "Just now", "sms", "in", message),
          ev(
            `${id}-2`,
            "Just now",
            "sms",
            "out",
            `Hi ${first}, thanks for contacting ${cleanText(a.business, 80) || BUSINESS_NAME}. We have your message and will be in touch within the hour.`,
            {
              workflow: "New enquiry",
              step: "Step 1: send an instant text",
              why: "This runs the moment a message arrives, so no one is left waiting.",
            },
          ),
          ev(
            `${id}-3`,
            "Just now",
            "task",
            "system",
            `Task created: call ${first} back within 1 hour`,
            {
              workflow: "New enquiry",
              step: "Step 2: create a call-back task",
              why: "It puts the next action on your list so the enquiry cannot be forgotten.",
            },
          ),
        ],
        tasks: [
          {
            id: `${id}-t1`,
            title: `Call ${first} back`,
            due: "Within 1 hour",
            done: false,
            movesTo: "contacted",
          },
        ],
        draft: null,
      };
      const next: CrmState = {
        ...s,
        contacts: [lead, ...s.contacts],
        selectedId: id,
        seq: s.seq + 1,
      };
      return setToast(
        next,
        `${first} is on the board in New. An auto-reply went out and a call-back task was created.`,
      );
    }
    default:
      return s;
  }
}

// ---------------------------------------------------------------------------
// Provider and hooks
// ---------------------------------------------------------------------------
export interface CrmApi {
  state: CrmState;
  contacts: Contact[];
  selected: Contact;
  move: (id: string, to: StageId, by?: "drag" | "button") => void;
  toggleTask: (contactId: string, taskId: string) => void;
  chase: (id: string) => void;
  approve: (id: string) => void;
  addLead: (name: string, message: string) => void;
  // Quote builder: sets the deal value, logs the email and moves the card to Quote sent.
  sendQuote: (id: string, total: number, ref: string) => void;
  select: (id: string) => void;
  // Select a contact AND switch to the Contact tab.
  openContact: (id: string) => void;
  reset: () => void;
  dismissToast: () => void;
  atRisk: { count: number; value: number };
}

const CrmContext = createContext<CrmApi | null>(null);

export function CrmProvider({
  children,
  onOpenContact,
}: {
  children: React.ReactNode;
  onOpenContact?: () => void;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, createSeed);
  const { brief } = useBusinessBrief();
  const businessRef = useRef(BUSINESS_NAME);
  businessRef.current = businessName(brief);
  const [ready, setReady] = useState(false);

  // Load after mount (not during render) so the server and browser agree. Saving waits
  // until the loaded state has rendered, so the sample data never overwrites saved data.
  useEffect(() => {
    const saved = loadDemoValue<CrmState>(DEMO_KEYS.crm);
    if (isValidSaved(saved)) {
      dispatch({ type: "load", state: { ...saved, toast: null } });
    } else if (saved) {
      clearDemoValue(DEMO_KEYS.crm);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDemoValue(DEMO_KEYS.crm, { ...state, toast: null });
  }, [state, ready]);

  useEffect(() => {
    if (!state.toast) return;
    const t = window.setTimeout(() => dispatch({ type: "dismissToast" }), 7000);
    return () => window.clearTimeout(t);
  }, [state.toast]);

  const api = useMemo<CrmApi>(() => {
    const selected = (state.contacts.find((c) => c.id === state.selectedId) ??
      state.contacts[0]) as Contact;
    const stuck = state.contacts.filter(isStuck);
    return {
      state,
      contacts: state.contacts,
      selected,
      move: (id, to, by = "button") => dispatch({ type: "move", id, to, by }),
      toggleTask: (contactId, taskId) => dispatch({ type: "toggleTask", contactId, taskId }),
      chase: (id) => dispatch({ type: "chase", id }),
      approve: (id) => dispatch({ type: "approve", id }),
      sendQuote: (id, total, ref) => dispatch({ type: "sendQuote", id, total, ref }),
      addLead: (name, message) =>
        dispatch({ type: "addLead", name, message, business: businessRef.current }),
      select: (id) => dispatch({ type: "select", id }),
      openContact: (id) => {
        dispatch({ type: "select", id });
        onOpenContact?.();
      },
      reset: () => {
        clearDemoValue(DEMO_KEYS.crm);
        dispatch({ type: "reset" });
      },
      dismissToast: () => dispatch({ type: "dismissToast" }),
      atRisk: { count: stuck.length, value: stuck.reduce((n, c) => n + c.value, 0) },
    };
  }, [state, onOpenContact]);

  return <CrmContext.Provider value={api}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmApi {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Toast: one polite live region, shared by both demos. Place <CrmToast /> once.
// ---------------------------------------------------------------------------
export function CrmToast() {
  const { state, dismissToast } = useCrm();
  const [mounted, setMounted] = useState(false);
  const onDismiss = useCallback(() => dismissToast(), [dismissToast]);
  useEffect(() => setMounted(true), []);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
    >
      {mounted && state.toast ? (
        <div
          key={state.toast.id}
          className="sys-crm-toast pointer-events-auto flex max-w-[520px] items-start gap-3 rounded-[16px] px-4 py-3 text-sm shadow-xl"
          style={{ backgroundColor: "var(--sys-navy)", color: "#fff" }}
        >
          <span className="leading-snug">{state.toast.text}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="-my-1 -mr-2 inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
