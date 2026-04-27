import {
  AiTriageResult,
  ChecklistItem,
  Crisis,
  CrisisSeverity,
  CrisisStatus,
  CrisisType,
  ScenarioPhase,
  ScenarioType,
  ShowcaseEvent,
  ShowcaseGuestStatus,
  ShowcaseReplayFrame,
  ShowcaseScenario,
} from "@/types/database";

export const SHOWCASE_STORAGE_KEY = "crisis-sync-showcase-v1";
export const SHOWCASE_PHASES: ScenarioPhase[] = [
  "reported",
  "triaged",
  "assigned",
  "responding",
  "resolved",
  "all_clear",
];

const PHASE_OFFSETS: Record<ScenarioPhase, number> = {
  reported: 0,
  triaged: 8_000,
  assigned: 16_000,
  responding: 28_000,
  resolved: 44_000,
  all_clear: 60_000,
};

type ScenarioTemplate = {
  title: string;
  shortLabel: string;
  locationLabel: string;
  roomNumber: string;
  crisisType: CrisisType;
  guestName: string;
  severity: CrisisSeverity;
  description: string;
  aiSummary: string;
  responderFocus: string;
  guestInstructions: string[];
  checklist: Array<{ task: string; priority: ChecklistItem["priority"] }>;
  evidence: Array<{ label: string; value: string }>;
  guestStatuses: Record<ScenarioPhase, ShowcaseGuestStatus>;
  frames: Array<Omit<ShowcaseReplayFrame, "offsetMs">>;
  timeline: Array<Omit<ShowcaseEvent, "offsetMs" | "id">>;
  reportSections: ShowcaseScenario["reportSections"];
  highlightMetrics: ShowcaseScenario["highlightMetrics"];
};

const scenarioTemplates: Record<ScenarioType, ScenarioTemplate> = {
  fire: {
    title: "Service corridor fire alert",
    shortLabel: "Fire alert",
    locationLabel: "Level 7 east service corridor",
    roomNumber: "712",
    crisisType: "fire",
    guestName: "Aanya Kapoor",
    severity: "critical",
    description: "Smoke haze and burning odor reported near the service closet on level 7.",
    aiSummary: "Smoke is visible in a guest-adjacent corridor. Treat as critical until the source is isolated and the zone is confirmed safe.",
    responderFocus: "Lock down the corridor, clear nearby rooms, and verify whether this is equipment smoke or active fire spread.",
    guestInstructions: [
      "Move away from the corridor and use the nearest safe exit if smoke is visible.",
      "Do not use lifts while staff is directing the response.",
      "Wait at the safe muster point until the venue shares an all-clear.",
    ],
    checklist: [
      { task: "Clear adjacent rooms and corridor traffic", priority: "immediate" },
      { task: "Dispatch engineering and security together", priority: "urgent" },
      { task: "Confirm smoke source and suppression status", priority: "urgent" },
      { task: "Publish guest-safe update to status board", priority: "standard" },
    ],
    evidence: [
      { label: "Origin zone", value: "Housekeeping service closet, Level 7" },
      { label: "Impact radius", value: "14 rooms, 1 guest corridor, 2 lift banks" },
      { label: "Sensor state", value: "Smoke detector alert mirrored to command surface" },
    ],
    guestStatuses: {
      reported: {
        headline: "A safety concern has been reported near Level 7.",
        subline: "Our team is validating the location and moving responders into place.",
        eta: "First update in under 1 minute",
        advisory: "Please avoid Level 7 east corridor for now.",
        accent: "warning",
      },
      triaged: {
        headline: "Responders have prioritized the Level 7 corridor alert.",
        subline: "The zone is being assessed as a fire-safety event until staff confirm the source.",
        eta: "Responder arrival: 1-2 minutes",
        advisory: "Follow staff instructions and use alternate corridors.",
        accent: "warning",
      },
      assigned: {
        headline: "Engineering and security are on the move.",
        subline: "Guest movement is being rerouted while the affected corridor is cleared.",
        eta: "On scene now",
        advisory: "Please keep lifts and corridor access clear.",
        accent: "active",
      },
      responding: {
        headline: "The incident is being contained on Level 7.",
        subline: "Teams are isolating the source and confirming ventilation safety.",
        eta: "Containment update in 2 minutes",
        advisory: "Stay outside the marked corridor until staff reopen it.",
        accent: "active",
      },
      resolved: {
        headline: "The source has been contained and the danger has passed.",
        subline: "Staff are running final safety checks before reopening the zone.",
        eta: "Reopening shortly",
        advisory: "Please wait for the all-clear before returning to the corridor.",
        accent: "success",
      },
      all_clear: {
        headline: "All clear: Level 7 has reopened.",
        subline: "Air quality and corridor safety checks are complete.",
        eta: "Normal operations restored",
        advisory: "Thank you for following staff guidance.",
        accent: "success",
      },
    },
    frames: [
      {
        phase: "reported",
        title: "Alert received",
        summary: "Guest report lands with smoke details, exact floor, and impact radius.",
        operatorNote: "Command center flags the corridor as high-risk before confirmation to reduce delay.",
        guestNote: "Guest flow is diverted away from the corridor immediately.",
        statusLabel: "Alerting on-duty teams",
        respondersLabel: "0 responders confirmed",
        spotlight: "Fast triage beats uncertainty in the first seconds.",
      },
      {
        phase: "triaged",
        title: "AI triage locks severity",
        summary: "The incident is classified as critical with a corridor-clearance first response.",
        operatorNote: "AI recommends engineering + security dual dispatch and guest-safe copy.",
        guestNote: "Safety instructions are ready for guests without exposing sensitive details.",
        statusLabel: "Critical triage complete",
        respondersLabel: "2 teams pinged",
        spotlight: "Severity, guidance, and routing happen in one motion.",
      },
      {
        phase: "assigned",
        title: "Teams dispatched",
        summary: "Nearest responders are assigned while the map highlights the affected zone.",
        operatorNote: "The venue heatmap now centers on Level 7 east corridor.",
        guestNote: "Guests see a clean status update instead of chaotic detail.",
        statusLabel: "Responders en route",
        respondersLabel: "Engineering + Security",
        spotlight: "Assignment and guest messaging stay perfectly in sync.",
      },
      {
        phase: "responding",
        title: "Containment underway",
        summary: "The corridor is isolated and the source is being physically verified.",
        operatorNote: "Checklist progress and responder focus stay visible above the fold.",
        guestNote: "Only the actionable guidance is shown to guests.",
        statusLabel: "Containing risk",
        respondersLabel: "Scene under control",
        spotlight: "The UI keeps everyone calm while the teams work fast.",
      },
      {
        phase: "resolved",
        title: "Risk neutralized",
        summary: "The source is contained and the venue shifts from response into recovery.",
        operatorNote: "The dossier starts writing itself with timeline and action context.",
        guestNote: "Guests are told reopening is pending final safety checks.",
        statusLabel: "Resolved",
        respondersLabel: "Recovery checks running",
        spotlight: "Resolution is visible, structured, and export-ready.",
      },
      {
        phase: "all_clear",
        title: "All clear",
        summary: "Urgency drains from the interface and the venue returns to normal mode.",
        operatorNote: "Scenario is now replayable for judges and post-incident review.",
        guestNote: "Guests see a reassuring all-clear message, not technical jargon.",
        statusLabel: "Normal operations restored",
        respondersLabel: "Teams standing down",
        spotlight: "The finish feels as polished as the crisis response.",
      },
    ],
    timeline: [
      {
        phase: "reported",
        title: "Guest report captured",
        description: "A guest report with smoke haze details arrives from Level 7 east corridor.",
        actor: "Guest reporting flow",
        tone: "warning",
      },
      {
        phase: "triaged",
        title: "AI triage confirmed",
        description: "The incident is elevated to critical with corridor-first guidance.",
        actor: "AI incident commander",
        tone: "primary",
      },
      {
        phase: "assigned",
        title: "Responders dispatched",
        description: "Engineering and security are assigned and tracked on the heatmap.",
        actor: "Command center",
        tone: "primary",
      },
      {
        phase: "responding",
        title: "Containment update",
        description: "The corridor is isolated while teams verify the smoke source.",
        actor: "Field responders",
        tone: "primary",
      },
      {
        phase: "resolved",
        title: "Source contained",
        description: "Teams confirm the source is controlled and shift into recovery checks.",
        actor: "Engineering lead",
        tone: "success",
      },
      {
        phase: "all_clear",
        title: "All-clear published",
        description: "Guest-safe reopening guidance is published across the venue surfaces.",
        actor: "Status board",
        tone: "success",
      },
    ],
    reportSections: {
      overview: "A fire-risk alert was reported near the Level 7 east service corridor. CrisisSync coordinated triage, dual dispatch, guest-safe comms, and a structured recovery handoff inside one timeline.",
      timeline: [
        "Guest report captured with exact floor and hazard description.",
        "AI triage escalated severity to critical and recommended corridor clearance.",
        "Engineering and security were dispatched in parallel.",
        "Containment checks were completed and ventilation safety confirmed.",
        "Guest-facing all-clear was published after recovery checks passed.",
      ],
      actions: [
        "Cleared the affected corridor and adjacent room access.",
        "Dispatched engineering and security simultaneously.",
        "Published guest-safe route guidance during containment.",
        "Recorded response milestones for leadership review and export.",
      ],
      recommendations: [
        "Audit service closet electrical risk on upper floors.",
        "Pre-stage guest-safe broadcast templates for corridor closures.",
        "Run quarterly corridor evacuation rehearsals with on-duty teams.",
      ],
    },
    highlightMetrics: [
      { label: "Time to triage", value: "8 sec", detail: "Severity and responder focus locked instantly" },
      { label: "Responders dispatched", value: "2 teams", detail: "Engineering and security coordinated together" },
      { label: "Guest-safe update", value: "1 tap", detail: "Public message published without exposing room data" },
    ],
  },
  medical: {
    title: "Lobby medical emergency",
    shortLabel: "Medical",
    locationLabel: "Main lobby concierge",
    roomNumber: "L1",
    crisisType: "medical",
    guestName: "Rohit Mehta",
    severity: "high",
    description: "A guest has fainted near concierge and needs urgent assessment in a public area.",
    aiSummary: "A public-area collapse needs immediate first response, crowd control, and a clean medical handoff path.",
    responderFocus: "Get the trained responder on scene, secure space around the guest, and maintain a clear route for any EMS escalation.",
    guestInstructions: [
      "Please give responders space near concierge.",
      "Do not move the guest unless a responder instructs you to do so.",
      "Wait for venue guidance before crossing the marked area.",
    ],
    checklist: [
      { task: "Dispatch trained responder with medical kit", priority: "immediate" },
      { task: "Create crowd-control perimeter", priority: "urgent" },
      { task: "Capture consciousness / breathing update", priority: "urgent" },
      { task: "Prepare EMS handoff notes", priority: "standard" },
    ],
    evidence: [
      { label: "Incident zone", value: "Lobby concierge and check-in queue" },
      { label: "Crowd condition", value: "High footfall due to evening arrivals" },
      { label: "Responder path", value: "Open from concierge rear access to main entrance" },
    ],
    guestStatuses: {
      reported: {
        headline: "A medical response is being organized in the lobby.",
        subline: "Staff are securing the area and sending a trained responder.",
        eta: "Responder arrival in under 1 minute",
        advisory: "Please keep the concierge area clear.",
        accent: "warning",
      },
      triaged: {
        headline: "The lobby incident has been triaged as high priority.",
        subline: "A trained responder is moving with equipment and crowd-control support.",
        eta: "On scene shortly",
        advisory: "Use the alternate check-in lane if available.",
        accent: "warning",
      },
      assigned: {
        headline: "A responder has been assigned to the medical incident.",
        subline: "The guest is being assessed while the lobby path stays open.",
        eta: "Assessment in progress",
        advisory: "Please avoid gathering near concierge.",
        accent: "active",
      },
      responding: {
        headline: "Medical assessment is underway.",
        subline: "The team is stabilizing the guest and preparing any next-step escalation.",
        eta: "Status update coming soon",
        advisory: "Follow staff directions around the concierge area.",
        accent: "active",
      },
      resolved: {
        headline: "The immediate medical risk has been stabilized.",
        subline: "Staff are wrapping up the response and restoring normal lobby flow.",
        eta: "Area reopening shortly",
        advisory: "Please continue using the marked route until the all-clear appears.",
        accent: "success",
      },
      all_clear: {
        headline: "All clear: the lobby is back to normal operations.",
        subline: "The medical response is complete and guest movement has resumed.",
        eta: "Normal service now active",
        advisory: "Thank you for giving responders space.",
        accent: "success",
      },
    },
    frames: [
      {
        phase: "reported",
        title: "Collapse reported",
        summary: "A guest fainting in the lobby immediately changes the operating posture.",
        operatorNote: "The system focuses on first-response speed and crowd control.",
        guestNote: "Guest-safe copy avoids panic while protecting the response path.",
        statusLabel: "Urgent medical intake",
        respondersLabel: "Responder not yet on scene",
        spotlight: "Public-area incidents need clarity more than complexity.",
      },
      {
        phase: "triaged",
        title: "Priority confirmed",
        summary: "AI marks the case as high priority with a responder + perimeter workflow.",
        operatorNote: "Concierge, security, and medical actions are aligned in one surface.",
        guestNote: "Guests receive simple movement instructions.",
        statusLabel: "High-priority triage",
        respondersLabel: "Medical kit en route",
        spotlight: "Triage drives calm crowd management.",
      },
      {
        phase: "assigned",
        title: "Responder assigned",
        summary: "The nearest trained responder is assigned with clear lobby pathing.",
        operatorNote: "The dashboard shows assignment and crowd-control status together.",
        guestNote: "A safe waiting path is visible to guests.",
        statusLabel: "Responder assigned",
        respondersLabel: "1 lead + 1 support",
        spotlight: "Even simple staffing info feels powerful when it is visible instantly.",
      },
      {
        phase: "responding",
        title: "Assessment live",
        summary: "The guest is being assessed and the response path stays open.",
        operatorNote: "The commander card keeps the next best action pinned at the top.",
        guestNote: "The public board shows progress without exposing medical details.",
        statusLabel: "Assessment underway",
        respondersLabel: "Scene stable",
        spotlight: "Privacy-safe transparency is a strong online-demo story.",
      },
      {
        phase: "resolved",
        title: "Immediate risk stabilized",
        summary: "The incident moves from urgent response to wrap-up and documentation.",
        operatorNote: "The timeline and dossier now reflect responder actions cleanly.",
        guestNote: "Guests see that the area is reopening soon.",
        statusLabel: "Stabilized",
        respondersLabel: "Wrap-up phase",
        spotlight: "Resolution and documentation happen together.",
      },
      {
        phase: "all_clear",
        title: "Lobby restored",
        summary: "The interface returns to calm mode and the lobby flow normalizes.",
        operatorNote: "Replay and dossier are ready for judges instantly.",
        guestNote: "The board confirms the area is back to normal service.",
        statusLabel: "Normal operations restored",
        respondersLabel: "Teams available again",
        spotlight: "The end state feels deliberate, not abrupt.",
      },
    ],
    timeline: [
      {
        phase: "reported",
        title: "Medical alert received",
        description: "A guest collapse is reported from the concierge queue.",
        actor: "Guest reporting flow",
        tone: "warning",
      },
      {
        phase: "triaged",
        title: "Medical priority set",
        description: "AI recommends urgent first response plus crowd-control perimeter.",
        actor: "AI incident commander",
        tone: "primary",
      },
      {
        phase: "assigned",
        title: "Responder assigned",
        description: "The nearest trained responder is routed to the lobby with kit support.",
        actor: "Command center",
        tone: "primary",
      },
      {
        phase: "responding",
        title: "Assessment underway",
        description: "The guest is being assessed while the concierge route is kept open.",
        actor: "Medical responder",
        tone: "primary",
      },
      {
        phase: "resolved",
        title: "Stabilization complete",
        description: "The immediate risk has passed and the lobby is shifting back to normal flow.",
        actor: "Response lead",
        tone: "success",
      },
      {
        phase: "all_clear",
        title: "All-clear published",
        description: "Normal lobby operations resume and the incident is archived for replay.",
        actor: "Status board",
        tone: "success",
      },
    ],
    reportSections: {
      overview: "A medical emergency in the lobby was triaged, routed, stabilized, and documented without disrupting the entire guest arrival experience.",
      timeline: [
        "Lobby medical alert captured from concierge queue.",
        "AI triage recommended urgent first response and crowd-control.",
        "Responder and support path were assigned immediately.",
        "Assessment and stabilization completed on scene.",
        "Guest-safe all-clear published after lobby flow was restored.",
      ],
      actions: [
        "Sent a trained responder with equipment.",
        "Maintained a protected perimeter around the guest.",
        "Kept concierge and entrance pathing functional.",
        "Logged a clean response narrative for leadership review.",
      ],
      recommendations: [
        "Pre-stage medical response templates for high-footfall periods.",
        "Review lobby AED / medical kit visibility.",
        "Add concierge-side crowd-control cues for peak check-in hours.",
      ],
    },
    highlightMetrics: [
      { label: "Assessment launch", value: "16 sec", detail: "Responder assignment and crowd-control pathing aligned" },
      { label: "Public disruption", value: "Low", detail: "Guest board absorbed the confusion" },
      { label: "Dossier quality", value: "Ready", detail: "Leadership export prepared by resolution" },
    ],
  },
  security: {
    title: "Restricted-area security breach",
    shortLabel: "Security",
    locationLabel: "North guest corridor access gate",
    roomNumber: "118",
    crisisType: "security",
    guestName: "Meera Iyer",
    severity: "high",
    description: "An unauthorized person is repeatedly attempting access to a guest corridor entry gate.",
    aiSummary: "This is a high-priority access-control incident with guest reassurance and corridor control as the primary outcome goals.",
    responderFocus: "Secure the access point, preserve guest calm, and identify whether the incident is trespass, confusion, or escalation risk.",
    guestInstructions: [
      "Please avoid the north corridor entry for now.",
      "Use the main lobby route while staff manage the access point.",
      "Speak to reception if you need escorted access.",
    ],
    checklist: [
      { task: "Dispatch security lead to access gate", priority: "immediate" },
      { task: "Lock guest corridor route and redirect traffic", priority: "urgent" },
      { task: "Verify CCTV snapshot and identity notes", priority: "standard" },
      { task: "Publish reassurance update to guest board", priority: "standard" },
    ],
    evidence: [
      { label: "Access point", value: "North guest corridor magnet lock gate" },
      { label: "Crowd exposure", value: "Visible from lobby-side foot traffic" },
      { label: "Security intel", value: "CCTV angle available with reception mirror view" },
    ],
    guestStatuses: {
      reported: {
        headline: "A security concern has been reported near a guest access point.",
        subline: "Our team is validating the access issue and securing the area.",
        eta: "First responder update in under 1 minute",
        advisory: "Use the main lobby route for corridor access.",
        accent: "warning",
      },
      triaged: {
        headline: "The access-control issue is being treated as a priority security response.",
        subline: "The route is being stabilized while security moves into position.",
        eta: "Responder arrival: now",
        advisory: "Please avoid the north entry point.",
        accent: "warning",
      },
      assigned: {
        headline: "Security responders are at the access point.",
        subline: "Guest corridor traffic is being redirected while the gate is secured.",
        eta: "Stabilization update in 1 minute",
        advisory: "Follow alternate route signage and reception guidance.",
        accent: "active",
      },
      responding: {
        headline: "The security team is resolving the access issue.",
        subline: "The route remains protected while staff verify identity and intent.",
        eta: "Resolution update shortly",
        advisory: "Please continue using the main route.",
        accent: "active",
      },
      resolved: {
        headline: "The security issue has been contained.",
        subline: "The access point is secure and staff are completing final checks.",
        eta: "Reopening shortly",
        advisory: "Please wait for the all-clear before returning to the north gate.",
        accent: "success",
      },
      all_clear: {
        headline: "All clear: guest corridor access is restored.",
        subline: "The access point is secure and normal routing is back.",
        eta: "Normal operations restored",
        advisory: "Thank you for using the alternate route.",
        accent: "success",
      },
    },
    frames: [
      {
        phase: "reported",
        title: "Access alert triggered",
        summary: "An access-control incident is reported before it turns into a wider guest disruption.",
        operatorNote: "The system immediately frames this as both security and guest-experience risk.",
        guestNote: "Guests are rerouted without seeing sensitive security detail.",
        statusLabel: "Security alert",
        respondersLabel: "Validation started",
        spotlight: "Fast containment matters as much as final resolution.",
      },
      {
        phase: "triaged",
        title: "Breach risk confirmed",
        summary: "AI marks it as high-priority and recommends corridor lock + reassurance copy.",
        operatorNote: "The responder focus is explicit, not buried in notes.",
        guestNote: "The board says exactly what guests need to do.",
        statusLabel: "Priority security response",
        respondersLabel: "Route lock active",
        spotlight: "The UI turns a tense moment into a controlled one.",
      },
      {
        phase: "assigned",
        title: "Security on route",
        summary: "Security is assigned and the access gate becomes the dashboard focal point.",
        operatorNote: "The heatmap and queue both highlight the same area.",
        guestNote: "Guests keep moving because the route update is immediate.",
        statusLabel: "Security dispatched",
        respondersLabel: "1 security lead",
        spotlight: "Visual focus keeps the demo understandable in seconds.",
      },
      {
        phase: "responding",
        title: "Gate secured",
        summary: "The gate is stabilized and security verifies identity and intent on scene.",
        operatorNote: "Evidence and notes stack into one cinematic detail view.",
        guestNote: "The public board stays calm and useful.",
        statusLabel: "Access stabilizing",
        respondersLabel: "Scene secure",
        spotlight: "Security incidents feel premium when the workflow is this clear.",
      },
      {
        phase: "resolved",
        title: "Issue contained",
        summary: "The access point is secure and teams shift into final checks.",
        operatorNote: "The dossier is ready with security actions and prevention notes.",
        guestNote: "Guests are told reopening is imminent.",
        statusLabel: "Contained",
        respondersLabel: "Final checks",
        spotlight: "Resolution is both operational and presentable.",
      },
      {
        phase: "all_clear",
        title: "Corridor restored",
        summary: "The route reopens and the UI returns to normal mode.",
        operatorNote: "This scenario is now replayable in one tap.",
        guestNote: "Normal guest routing has resumed.",
        statusLabel: "All clear",
        respondersLabel: "Available again",
        spotlight: "The recovery phase feels intentional, not tacked on.",
      },
    ],
    timeline: [
      {
        phase: "reported",
        title: "Unauthorized access attempt reported",
        description: "Repeated entry attempts are logged at the north guest corridor gate.",
        actor: "Reception relay",
        tone: "warning",
      },
      {
        phase: "triaged",
        title: "Security posture escalated",
        description: "The system recommends gate lock and corridor redirect immediately.",
        actor: "AI incident commander",
        tone: "primary",
      },
      {
        phase: "assigned",
        title: "Security lead assigned",
        description: "Nearest security responder is assigned and CCTV context is attached.",
        actor: "Command center",
        tone: "primary",
      },
      {
        phase: "responding",
        title: "Access point stabilized",
        description: "The gate is secured while identity verification happens on scene.",
        actor: "Security lead",
        tone: "primary",
      },
      {
        phase: "resolved",
        title: "Threat contained",
        description: "The route remains secure while staff complete recovery checks.",
        actor: "Security lead",
        tone: "success",
      },
      {
        phase: "all_clear",
        title: "All-clear published",
        description: "Guest routing is restored and the incident moves to replay archive.",
        actor: "Status board",
        tone: "success",
      },
    ],
    reportSections: {
      overview: "A guest-corridor access attempt was contained before it could disrupt the wider venue. CrisisSync coordinated route lock, responder dispatch, guest-safe comms, and final recovery messaging from one flow.",
      timeline: [
        "Reception relayed repeated access attempts at a restricted gate.",
        "AI triage escalated the response and recommended route control.",
        "Security lead was dispatched with CCTV context.",
        "The access point was stabilized and identity risk was resolved.",
        "Guest-safe all-clear restored normal routing.",
      ],
      actions: [
        "Locked and monitored the affected access point.",
        "Rerouted guest flow around the north corridor gate.",
        "Attached CCTV context for faster responder assessment.",
        "Published clear recovery messaging after the threat was contained.",
      ],
      recommendations: [
        "Strengthen restricted-access signage near corridor gates.",
        "Add reception quick actions for access-control incidents.",
        "Review CCTV coverage at guest-routing choke points.",
      ],
    },
    highlightMetrics: [
      { label: "Threat containment", value: "< 1 min", detail: "Access point locked before escalation" },
      { label: "Guest reroute", value: "Instant", detail: "Public board and ops queue updated together" },
      { label: "Recovery readiness", value: "High", detail: "Security notes and replay generated automatically" },
    ],
  },
  vip_panic: {
    title: "VIP arrival crowd surge",
    shortLabel: "VIP panic",
    locationLabel: "Sky lounge VIP arrival lane",
    roomNumber: "VIP",
    crisisType: "security",
    guestName: "Zara Khan",
    severity: "high",
    description: "A crowd surge at the VIP arrival lane is creating crush risk and blocking concierge control.",
    aiSummary: "This is a crowd-pressure and reputation-sensitive security response that needs rerouting, perimeter control, and calm public messaging.",
    responderFocus: "Break the surge line, open a clean path for VIP transit, and keep guest messaging controlled and reassuring.",
    guestInstructions: [
      "Please step back from the VIP arrival lane and follow staff directions.",
      "Use the main lounge route until the lane is reopened.",
      "Do not crowd the entry point while the area is being reset.",
    ],
    checklist: [
      { task: "Deploy security to VIP arrival lane", priority: "immediate" },
      { task: "Open alternate lounge path and redirect footfall", priority: "urgent" },
      { task: "Stabilize crowd density with concierge support", priority: "urgent" },
      { task: "Publish calm guest-safe message", priority: "standard" },
    ],
    evidence: [
      { label: "Pressure zone", value: "VIP lounge arrival bottleneck" },
      { label: "Crowd profile", value: "Mixed guests, entourage, photography cluster" },
      { label: "Operational sensitivity", value: "Guest experience + safety + brand visibility" },
    ],
    guestStatuses: {
      reported: {
        headline: "A crowd-management response is underway near the VIP lounge.",
        subline: "Staff are resetting the flow to keep the area safe and comfortable.",
        eta: "Lane reset in under 2 minutes",
        advisory: "Please use the main lounge route.",
        accent: "warning",
      },
      triaged: {
        headline: "The VIP arrival lane is being managed as a high-priority crowd event.",
        subline: "Security and concierge are controlling the bottleneck before it escalates.",
        eta: "Responders on scene now",
        advisory: "Please avoid gathering near the lane entrance.",
        accent: "warning",
      },
      assigned: {
        headline: "Security teams are clearing the VIP lane.",
        subline: "Guest movement is being redirected while the lane resets.",
        eta: "Flow reset in progress",
        advisory: "Follow the marked alternate route.",
        accent: "active",
      },
      responding: {
        headline: "The crowd surge is being stabilized.",
        subline: "Staff are reopening safe flow while keeping the lane controlled.",
        eta: "Status update shortly",
        advisory: "Please continue using the alternate lounge entry.",
        accent: "active",
      },
      resolved: {
        headline: "The crowd surge has been controlled.",
        subline: "The area is being checked for a smooth return to normal flow.",
        eta: "Lane reopening shortly",
        advisory: "Wait for the all-clear before returning to the VIP lane.",
        accent: "success",
      },
      all_clear: {
        headline: "All clear: the VIP arrival lane is open again.",
        subline: "Guest flow has normalized and the area is back in service.",
        eta: "Normal lounge routing restored",
        advisory: "Thank you for following the reroute guidance.",
        accent: "success",
      },
    },
    frames: [
      {
        phase: "reported",
        title: "Crowd surge detected",
        summary: "A reputation-sensitive crowd event is treated as a safety response immediately.",
        operatorNote: "This is where hospitality polish and safety operations merge.",
        guestNote: "Guest copy stays calming, not alarming.",
        statusLabel: "Crowd pressure rising",
        respondersLabel: "Lane support pending",
        spotlight: "This scenario looks big on camera without backend complexity.",
      },
      {
        phase: "triaged",
        title: "Crowd risk prioritized",
        summary: "The system frames it as a crush-risk prevention problem, not a generic disturbance.",
        operatorNote: "Responder focus is about flow control, not only security presence.",
        guestNote: "Guests see alternate routing fast.",
        statusLabel: "Flow-control response",
        respondersLabel: "Security + concierge",
        spotlight: "Perfect hackathon feature: high drama, very buildable.",
      },
      {
        phase: "assigned",
        title: "Perimeter teams assigned",
        summary: "Security and concierge are assigned to split pressure and open a clean lane.",
        operatorNote: "The heatmap emphasizes the VIP choke point clearly.",
        guestNote: "Alternative path guidance is already live.",
        statusLabel: "Lane reset underway",
        respondersLabel: "Perimeter active",
        spotlight: "A crisp visual focal point makes this instantly demo-friendly.",
      },
      {
        phase: "responding",
        title: "Crowd stabilizing",
        summary: "Teams are smoothing traffic and protecting the arrival path.",
        operatorNote: "The incident commander card keeps the next action obvious.",
        guestNote: "The public board avoids panic language entirely.",
        statusLabel: "Flow stabilizing",
        respondersLabel: "Surge reduced",
        spotlight: "This feels premium because the communication is deliberate.",
      },
      {
        phase: "resolved",
        title: "Pressure released",
        summary: "The lane is safe and the venue shifts into reopening mode.",
        operatorNote: "The dossier captures crowd management as a serious ops workflow.",
        guestNote: "Guests are told reopening is nearly complete.",
        statusLabel: "Controlled",
        respondersLabel: "Final reset",
        spotlight: "A flashy but credible hospitality-specific scenario.",
      },
      {
        phase: "all_clear",
        title: "VIP lane restored",
        summary: "The arrival lane returns to normal operation and the scenario enters replay archive.",
        operatorNote: "Judges can immediately replay the crowd-management story.",
        guestNote: "Normal guest movement resumes.",
        statusLabel: "All clear",
        respondersLabel: "Back to standby",
        spotlight: "The polished finish matters as much as the dramatic start.",
      },
    ],
    timeline: [
      {
        phase: "reported",
        title: "VIP crowd pressure reported",
        description: "Concierge flags crowd compression at the VIP arrival lane.",
        actor: "Concierge",
        tone: "warning",
      },
      {
        phase: "triaged",
        title: "Flow-control response activated",
        description: "AI triage prioritizes perimeter control and alternate routing.",
        actor: "AI incident commander",
        tone: "primary",
      },
      {
        phase: "assigned",
        title: "Security and concierge assigned",
        description: "Dual teams move to split crowd pressure and reopen safe routing.",
        actor: "Command center",
        tone: "primary",
      },
      {
        phase: "responding",
        title: "Bottleneck stabilizing",
        description: "The lane is being reset while guests are routed cleanly around it.",
        actor: "Field teams",
        tone: "primary",
      },
      {
        phase: "resolved",
        title: "Lane secured",
        description: "The crowd surge is under control and the area is entering recovery mode.",
        actor: "Security lead",
        tone: "success",
      },
      {
        phase: "all_clear",
        title: "All-clear posted",
        description: "The VIP lane reopens and normal guest flow resumes.",
        actor: "Status board",
        tone: "success",
      },
    ],
    reportSections: {
      overview: "A VIP arrival crowd surge was controlled before it became a guest-safety or brand incident. CrisisSync turned a fast-moving hospitality moment into a structured, calm response.",
      timeline: [
        "Concierge flagged dangerous crowd pressure near the VIP lane.",
        "AI triage prioritized flow control and alternate routing.",
        "Security and concierge were deployed in parallel.",
        "Guest movement stabilized while the lane was reset.",
        "The area reopened with a clean all-clear.",
      ],
      actions: [
        "Deployed perimeter control to the surge point.",
        "Opened a clean alternate route for guests.",
        "Published calm guest-facing reroute guidance.",
        "Logged a full hospitality-safe recovery narrative.",
      ],
      recommendations: [
        "Predefine surge-control presets for VIP arrivals.",
        "Add concierge quick-access crowd templates.",
        "Use lane heatmapping for future arrival rehearsals.",
      ],
    },
    highlightMetrics: [
      { label: "Crowd stabilization", value: "Under 1 min", detail: "Pressure released before escalation" },
      { label: "Brand-safe comms", value: "Live", detail: "Guest board stayed reassuring throughout" },
      { label: "Replay value", value: "High", detail: "Great online-hackathon storytelling scenario" },
    ],
  },
  kitchen_hazard: {
    title: "Kitchen hazard containment",
    shortLabel: "Kitchen hazard",
    locationLabel: "Banquet kitchen prep line",
    roomNumber: "BOH",
    crisisType: "maintenance",
    guestName: "Arjun Nair",
    severity: "high",
    description: "Oil leak near a hot prep line is creating slip and flare-up risk in the banquet kitchen.",
    aiSummary: "This is a high-priority back-of-house hazard with both safety and service continuity implications.",
    responderFocus: "Stop the hazard from escalating into fire or injury, isolate the prep line, and protect live service continuity.",
    guestInstructions: [
      "Back-of-house teams are managing a service-area hazard.",
      "Guest-facing service remains active while staff reroute internally.",
      "Please follow host guidance if any service path is temporarily adjusted.",
    ],
    checklist: [
      { task: "Isolate the prep line and kill immediate ignition risk", priority: "immediate" },
      { task: "Dispatch engineering and kitchen lead", priority: "urgent" },
      { task: "Set alternate service route for banquet output", priority: "urgent" },
      { task: "Publish guest-safe service continuity note", priority: "standard" },
    ],
    evidence: [
      { label: "Hazard source", value: "Oil leak near banquet hot line" },
      { label: "Business impact", value: "Banquet service continuity at risk" },
      { label: "Risk blend", value: "Slip hazard + flare-up potential + service pressure" },
    ],
    guestStatuses: {
      reported: {
        headline: "A back-of-house service-area hazard is being managed.",
        subline: "Staff are securing the source while keeping guest service moving.",
        eta: "Internal response live now",
        advisory: "Guest service remains active while staff reroute internally.",
        accent: "warning",
      },
      triaged: {
        headline: "The kitchen hazard has been elevated for rapid response.",
        subline: "The area is being isolated to protect staff safety and service continuity.",
        eta: "Containment update in 1 minute",
        advisory: "Please follow host guidance if routing changes temporarily.",
        accent: "warning",
      },
      assigned: {
        headline: "Engineering and kitchen leads are on the move.",
        subline: "The prep line is isolated while staff protect output flow.",
        eta: "Scene update now",
        advisory: "Guest-facing service remains active.",
        accent: "active",
      },
      responding: {
        headline: "The kitchen hazard is being contained.",
        subline: "Teams are securing the area and keeping banquet service moving through an alternate path.",
        eta: "Recovery update shortly",
        advisory: "Please continue following venue guidance.",
        accent: "active",
      },
      resolved: {
        headline: "The kitchen hazard has been contained.",
        subline: "Staff are completing final safety checks before returning to the normal prep line.",
        eta: "Normal service shortly",
        advisory: "Temporary service routing remains in place until the all-clear.",
        accent: "success",
      },
      all_clear: {
        headline: "All clear: the banquet kitchen is back to normal operation.",
        subline: "The hazard is resolved and standard prep flow has resumed.",
        eta: "Normal service restored",
        advisory: "Thank you for following staff guidance during the reroute.",
        accent: "success",
      },
    },
    frames: [
      {
        phase: "reported",
        title: "Back-of-house hazard flagged",
        summary: "A kitchen hazard is raised before it becomes an injury or open-flame incident.",
        operatorNote: "The UI makes back-of-house incidents feel as important as lobby incidents.",
        guestNote: "Guests get continuity messaging instead of operational noise.",
        statusLabel: "Kitchen hazard reported",
        respondersLabel: "Containment pending",
        spotlight: "Hospitality judges love operational realism like this.",
      },
      {
        phase: "triaged",
        title: "Service continuity triage",
        summary: "AI treats the event as both a safety and service continuity problem.",
        operatorNote: "The commander card highlights alternate banquet routing, not just hazard response.",
        guestNote: "Guest messaging focuses on continuity and calm.",
        statusLabel: "High-priority BOH response",
        respondersLabel: "Engineering + kitchen lead",
        spotlight: "This scenario shows operational depth without needing new backend systems.",
      },
      {
        phase: "assigned",
        title: "Dual response assigned",
        summary: "Engineering and kitchen leads are assigned to isolate the prep line fast.",
        operatorNote: "Assignment and operational impact are shown together.",
        guestNote: "No panic, just clear service continuity language.",
        statusLabel: "Prep line isolated",
        respondersLabel: "2 teams active",
        spotlight: "A very hackathon-friendly ‘wow, this feels real’ moment.",
      },
      {
        phase: "responding",
        title: "Hazard containment live",
        summary: "The line is being secured while banquet flow moves to a safe fallback route.",
        operatorNote: "The incident detail view shows evidence, checklist, replay, and guest board copy together.",
        guestNote: "Service continuity messaging remains visible.",
        statusLabel: "Containment underway",
        respondersLabel: "Fallback route active",
        spotlight: "This makes the product feel deeper than a simple incident form.",
      },
      {
        phase: "resolved",
        title: "Hazard neutralized",
        summary: "The hazard is controlled and staff are validating a safe return to normal prep flow.",
        operatorNote: "The dossier now documents both safety action and service continuity.",
        guestNote: "Guests are told service normalization is near.",
        statusLabel: "Resolved",
        respondersLabel: "Safety checks running",
        spotlight: "The business continuity angle makes this stand out.",
      },
      {
        phase: "all_clear",
        title: "Kitchen restored",
        summary: "Normal prep flow resumes and the scenario becomes replay-ready.",
        operatorNote: "Judges can instantly inspect the replay or dossier.",
        guestNote: "Normal service is confirmed without exposing kitchen detail.",
        statusLabel: "All clear",
        respondersLabel: "Teams reset",
        spotlight: "The full loop feels premium and complete.",
      },
    ],
    timeline: [
      {
        phase: "reported",
        title: "Kitchen hazard logged",
        description: "The banquet prep line reports a fast-moving oil leak risk.",
        actor: "Kitchen team",
        tone: "warning",
      },
      {
        phase: "triaged",
        title: "Continuity triage set",
        description: "The incident is prioritized for both safety and service continuity.",
        actor: "AI incident commander",
        tone: "primary",
      },
      {
        phase: "assigned",
        title: "Engineering and kitchen lead assigned",
        description: "Dual teams move to isolate the line and protect banquet output.",
        actor: "Command center",
        tone: "primary",
      },
      {
        phase: "responding",
        title: "Fallback service route active",
        description: "Containment continues while banquet flow uses a temporary safe route.",
        actor: "Kitchen lead",
        tone: "primary",
      },
      {
        phase: "resolved",
        title: "Hazard contained",
        description: "The prep line is secured and final safety checks begin.",
        actor: "Engineering lead",
        tone: "success",
      },
      {
        phase: "all_clear",
        title: "All-clear published",
        description: "The kitchen returns to normal flow and the scenario enters archive.",
        actor: "Status board",
        tone: "success",
      },
    ],
    reportSections: {
      overview: "A banquet-kitchen hazard was contained before it could escalate into injury, fire risk, or major service disruption. CrisisSync coordinated safety response with service continuity in one mobile-first workflow.",
      timeline: [
        "Kitchen team reported a prep-line hazard with slip and flare-up risk.",
        "AI triage elevated the response and highlighted service continuity needs.",
        "Engineering and kitchen leads were assigned together.",
        "The prep line was isolated while banquet output moved to a fallback route.",
        "The hazard was resolved and normal prep flow restored with an all-clear.",
      ],
      actions: [
        "Isolated ignition and slip risk at the prep line.",
        "Coordinated engineering and kitchen response.",
        "Protected banquet output via alternate routing.",
        "Documented the incident as both safety and service-continuity response.",
      ],
      recommendations: [
        "Create preset back-of-house hazard scenarios for banquet teams.",
        "Audit prep-line leak risk during high-volume service windows.",
        "Keep fallback routing templates ready for event kitchens.",
      ],
    },
    highlightMetrics: [
      { label: "Service continuity", value: "Maintained", detail: "Fallback route kept banquet output moving" },
      { label: "Hazard isolation", value: "Fast", detail: "High-risk line secured before escalation" },
      { label: "Judge appeal", value: "Strong", detail: "Operational realism with polished UI payoff" },
    ],
  },
};

type ScenarioVenueInput = {
  venueId: string;
  venueName?: string;
};

const scenarioPhaseEntries = SHOWCASE_PHASES.map((phase) => ({
  phase,
  offsetMs: PHASE_OFFSETS[phase],
}));

export function mapPhaseToCrisisStatus(phase: ScenarioPhase): CrisisStatus {
  switch (phase) {
    case "triaged":
      return "triaged";
    case "assigned":
      return "assigned";
    case "responding":
      return "responding";
    case "resolved":
      return "resolved";
    case "all_clear":
      return "closed";
    case "reported":
    default:
      return "reported";
  }
}

export function createShowcaseScenario(type: ScenarioType, venue: ScenarioVenueInput): ShowcaseScenario {
  const template = scenarioTemplates[type];
  const startedAt = new Date().toISOString();
  const seed = Date.now();
  const scenarioId = `showcase-${type}-${seed}`;
  const crisisId = `${scenarioId}-crisis`;
  const reportId = `${scenarioId}-report`;

  const replayFrames = template.frames.map((frame, index) => ({
    ...frame,
    offsetMs: scenarioPhaseEntries[index]?.offsetMs ?? 0,
  }));

  const events = template.timeline.map((entry, index) => ({
    ...entry,
    offsetMs: PHASE_OFFSETS[entry.phase],
    id: `${scenarioId}-event-${index + 1}`,
  }));

  const checklist: ChecklistItem[] = template.checklist.map((item, index) => ({
    task: item.task,
    priority: item.priority,
    completed: false,
    id: `${scenarioId}-check-${index + 1}`,
  }));

  return {
    id: scenarioId,
    crisisId,
    reportId,
    type,
    venueId: venue.venueId,
    venueName: venue.venueName || "Showcase Venue",
    startedAt,
    title: template.title,
    shortLabel: template.shortLabel,
    locationLabel: template.locationLabel,
    roomNumber: template.roomNumber,
    crisisType: template.crisisType,
    guestName: template.guestName,
    severity: template.severity,
    description: template.description,
    aiSummary: template.aiSummary,
    responderFocus: template.responderFocus,
    guestInstructions: template.guestInstructions,
    checklist,
    evidence: template.evidence,
    replayFrames,
    events,
    guestStatuses: template.guestStatuses,
    reportSections: template.reportSections,
    highlightMetrics: template.highlightMetrics,
  };
}

export function getScenarioPhaseAtTime(
  scenario: ShowcaseScenario,
  now = Date.now()
): ScenarioPhase {
  const elapsed = now - new Date(scenario.startedAt).getTime();

  let current: ScenarioPhase = "reported";
  for (const phase of SHOWCASE_PHASES) {
    if (elapsed >= PHASE_OFFSETS[phase]) {
      current = phase;
    }
  }

  return current;
}

export function getScenarioProgress(scenario: ShowcaseScenario, now = Date.now()) {
  const elapsed = Math.max(0, now - new Date(scenario.startedAt).getTime());
  const total = PHASE_OFFSETS.all_clear || 1;
  return Math.min(1, elapsed / total);
}

export function isScenarioComplete(scenario: ShowcaseScenario, now = Date.now()) {
  return getScenarioPhaseAtTime(scenario, now) === "all_clear";
}

export function getReplayFrameForPhase(scenario: ShowcaseScenario, phase: ScenarioPhase) {
  return scenario.replayFrames.find((frame) => frame.phase === phase) ?? scenario.replayFrames[0];
}

export function getScenarioEventsUntilPhase(scenario: ShowcaseScenario, phase: ScenarioPhase) {
  const targetOffset = PHASE_OFFSETS[phase];
  return scenario.events.filter((event) => event.offsetMs <= targetOffset);
}

export function buildShowcaseAiTriage(scenario: ShowcaseScenario, phase: ScenarioPhase): AiTriageResult {
  return {
    severity: scenario.severity,
    category_confirmed: scenario.crisisType,
    confidence_score: phase === "reported" ? 0.88 : 0.96,
    summary: scenario.aiSummary,
    reasoning: [
      `Scenario preset "${scenario.shortLabel}" is active for ${scenario.venueName}.`,
      "The showcase engine is simulating deterministic updates based on fixed phase timing.",
      `Current phase is ${phase}, so public guidance and responder focus are synchronized.`,
    ],
    guest_instructions: scenario.guestInstructions,
    staff_checklist: scenario.checklist.map((item, index) => ({
      ...item,
      completed:
        phase === "resolved" ||
        phase === "all_clear" ||
        (phase === "responding" && index < 2) ||
        (phase === "assigned" && index < 1),
    })),
    responder_focus: scenario.responderFocus,
    prevention_recommendations: scenario.reportSections.recommendations,
    model_used: "showcase-sim",
  };
}

export function buildShowcaseCrisis(scenario: ShowcaseScenario, now = Date.now()): Crisis {
  const phase = getScenarioPhaseAtTime(scenario, now);
  const triage = buildShowcaseAiTriage(scenario, phase);
  const startedAtMs = new Date(scenario.startedAt).getTime();
  const acknowledgedAt =
    phase === "reported"
      ? undefined
      : new Date(startedAtMs + PHASE_OFFSETS.assigned).toISOString();
  const resolvedAt =
    phase === "resolved" || phase === "all_clear"
      ? new Date(startedAtMs + PHASE_OFFSETS.resolved).toISOString()
      : undefined;

  return {
    id: scenario.crisisId,
    venue_id: scenario.venueId,
    guest_name: scenario.guestName,
    room_number: scenario.roomNumber,
    crisis_type: scenario.crisisType,
    description: scenario.description,
    location_description: scenario.locationLabel,
    severity_assessment: scenario.severity,
    severity: scenario.severity,
    status: mapPhaseToCrisisStatus(phase),
    assigned_staff_id: phase === "reported" ? null : "showcase-responder",
    ai_triage_result: triage,
    ai_severity: scenario.severity,
    ai_confidence: triage.confidence_score,
    ai_reasoning: scenario.aiSummary,
    ai_guest_instructions: scenario.guestInstructions,
    ai_staff_checklist: triage.staff_checklist,
    ai_responder_focus: scenario.responderFocus,
    ai_prevention_insights: scenario.reportSections.recommendations.join(" | "),
    ai_model_used: "showcase-sim",
    created_at: scenario.startedAt,
    acknowledged_at: acknowledgedAt,
    resolved_at: resolvedAt,
    updated_at: new Date(now).toISOString(),
  };
}

export function buildShowcaseReportMarkdown(scenario: ShowcaseScenario) {
  const sections = scenario.reportSections;
  return [
    `# ${scenario.title}`,
    "",
    "## Executive Summary",
    sections.overview,
    "",
    "## Response Timeline",
    ...sections.timeline.map((item) => `- ${item}`),
    "",
    "## Responder Actions",
    ...sections.actions.map((item) => `- ${item}`),
    "",
    "## Prevention Recommendations",
    ...sections.recommendations.map((item) => `- ${item}`),
    "",
    "## Showcase Metrics",
    ...scenario.highlightMetrics.map((item) => `- **${item.label}:** ${item.value} — ${item.detail}`),
  ].join("\n");
}

export function getShowcaseGuestStatus(scenario: ShowcaseScenario, phase: ScenarioPhase) {
  return scenario.guestStatuses[phase];
}

export function buildShowcaseTimelineUpdates(scenario: ShowcaseScenario, phase: ScenarioPhase) {
  return getScenarioEventsUntilPhase(scenario, phase).map((event) => ({
    id: event.id,
    crisis_id: scenario.crisisId,
    updated_by: null,
    update_type: event.phase === "resolved" || event.phase === "all_clear" ? "resolved" : "status_change",
    message: `${event.title}: ${event.description}`,
    created_at: new Date(new Date(scenario.startedAt).getTime() + event.offsetMs).toISOString(),
  }));
}

export function getShowcaseScenarioByCrisisId(
  scenarios: ShowcaseScenario[],
  crisisId?: string | null
) {
  if (!crisisId) return null;
  return scenarios.find((scenario) => scenario.crisisId === crisisId) ?? null;
}

export function getShowcaseScenarioByReportId(
  scenarios: ShowcaseScenario[],
  reportId?: string | null
) {
  if (!reportId) return null;
  return scenarios.find((scenario) => scenario.reportId === reportId) ?? null;
}

export function isShowcaseIdentifier(id?: string | null) {
  return Boolean(id && id.startsWith("showcase-"));
}
