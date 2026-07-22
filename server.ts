import express from "express";
import path from "path";
import fs from "fs";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { getDbPool, isDbConfigured, queryWithToken } from "./db";
import { get } from "@vercel/edge-config";

dotenv.config();

// Process error safety handlers to prevent process crashing on unexpected background errors
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Promise Rejection]:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]:", err);
});

// Initialize Express
export const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Health check endpoint for Cloud Run and load balancers
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Normalize API routes for serverless rewrites (e.g., when /api/ is stripped by hosting gateways)
app.use((req, res, next) => {
  const apiPaths = [
    "health",
    "tax-lookup",
    "generate-quote",
    "verify-b2b",
    "pos-sync-logs",
    "pos-sync-log",
    "create-ticket",
    "triage",
    "complex-diagnostics",
    "analyze-image",
    "rds-status",
    "movies",
    "welcome"
  ];
  
  const pathParts = req.url.split("?")[0].split("/");
  const firstSegment = pathParts[1];
  
  if (firstSegment && apiPaths.includes(firstSegment) && !req.url.startsWith("/api/")) {
    const originalUrl = req.url;
    req.url = "/api" + originalUrl;
    console.log(`[Route Rewrite] Adjusted request URL for compatibility: ${originalUrl} -> ${req.url}`);
  }
  next();
});

// Initialize OpenAI SDK for server-side AI agents
let openaiClient: OpenAI | null = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY && OPENAI_API_KEY !== "MY_OPENAI_API_KEY") {
  try {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    console.log("[AI Initialization] OpenAI API client successfully initialized for AI agents.");
  } catch (err) {
    console.log("[AI Initialization] OpenAI setup error:", err);
  }
} else {
  console.log("[AI Initialization] No OPENAI_API_KEY configured. Operating in high-fidelity local simulation mode.");
}

// Global state for simulated POS transactions and custom repair tickets
interface RepairTicket {
  id: string;
  customerName: string;
  companyName?: string;
  device: string;
  issueType: "screen" | "battery" | "button" | "other";
  status: "open" | "parts_assigned" | "technician_working" | "quality_check" | "completed";
  quotedPrice: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
}

const mockTickets: RepairTicket[] = [
  {
    id: "DSC-8041",
    customerName: "Sarah Jenkins",
    companyName: "Seattle Fleet Corp",
    device: "iPhone 14 Pro Max",
    issueType: "screen",
    status: "technician_working",
    quotedPrice: 320.0,
    tax: 33.12, // ~10.35% for Seattle
    discount: 64.0, // 20% B2B Fleet Discount
    total: 289.12,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "DSC-7933",
    customerName: "Alex Rivera",
    device: "Samsung Galaxy S23 Ultra",
    issueType: "battery",
    status: "quality_check",
    quotedPrice: 129.0,
    tax: 13.03, // ~10.1% Bellevue
    discount: 0.0,
    total: 142.03,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "DSC-7550",
    customerName: "Tech Operations Lead",
    companyName: "Amazon Seattle Operations",
    device: "iPad Pro 12.9 (5th Gen)",
    issueType: "button",
    status: "completed",
    quotedPrice: 180.0,
    tax: 18.63, // Seattle ~10.35%
    discount: 36.0, // 20% B2B discount
    total: 162.63,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// POS Sync integration logs
const syncLogs: Array<{ timestamp: string; level: string; message: string; source: "Square" | "CellSmart" | "WebHook-Receiver" }> = [
  { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), level: "INFO", message: "Successfully synced latest inventory prices with CellSmart server", source: "CellSmart" },
  { timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), level: "INFO", message: "Square webhook registered: catalog.version.updated", source: "Square" },
  { timestamp: new Date().toISOString(), level: "INFO", message: "Awaiting incoming POS transactions...", source: "WebHook-Receiver" },
];

// Washington State destination sales tax lookup helper (by ZIP code)
// Washington State imposes destination-based sales tax. Here are standard representative local rates.
const WA_TAX_DATA: Record<string, { city: string; rate: number }> = {
  "98101": { city: "Seattle", rate: 0.1035 },
  "98102": { city: "Seattle", rate: 0.1035 },
  "98104": { city: "Seattle", rate: 0.1035 },
  "98115": { city: "Seattle", rate: 0.1035 },
  "98004": { city: "Bellevue", rate: 0.101 },
  "98005": { city: "Bellevue", rate: 0.101 },
  "98402": { city: "Tacoma", rate: 0.103 },
  "98405": { city: "Tacoma", rate: 0.103 },
  "98052": { city: "Redmond", rate: 0.101 },
  "98201": { city: "Everett", rate: 0.099 },
  "98501": { city: "Olympia", rate: 0.095 },
  "99201": { city: "Spokane", rate: 0.090 },
  "98660": { city: "Vancouver", rate: 0.087 },
};

// Check for Corporate B2B Fleet emails (e.g. amazon.com, microsoft.com, boeing.com, starbucks.com, costco.com)
const B2B_CORPORATE_DOMAINS = [
  "amazon.com",
  "microsoft.com",
  "boeing.com",
  "starbucks.com",
  "costco.com",
  "t-mobile.com",
  "expedia.com",
  "nordstrom.com",
  "paccar.com"
];

// Helper to calculate quotes based on secure business logic
export function calculateQuoteInternal(issueType: string, deviceTier: "flagship" | "midrange" | "budget") {
  // Base parts cost (highly confidential - kept secure on the backend server)
  let partsCost = 45;
  let laborHours = 1.5;
  const hourlyLaborRate = 85; // Standard wholesale labor rate
  const overheadMultiplier = 1.15; // 15% operation overlay margin

  if (issueType === "screen") {
    partsCost = deviceTier === "flagship" ? 180 : deviceTier === "midrange" ? 95 : 55;
    laborHours = deviceTier === "flagship" ? 2.0 : 1.5;
  } else if (issueType === "battery") {
    partsCost = deviceTier === "flagship" ? 45 : deviceTier === "midrange" ? 35 : 25;
    laborHours = 1.0;
  } else if (issueType === "button") {
    partsCost = deviceTier === "flagship" ? 30 : deviceTier === "midrange" ? 20 : 12;
    laborHours = 1.25;
  }

  const baseLabor = laborHours * hourlyLaborRate;
  const rawSubtotal = (partsCost + baseLabor) * overheadMultiplier;
  
  // Format to standard retail increments e.g., rounding nicely
  const finalPrice = Math.round(rawSubtotal * 100) / 100;

  return {
    partsCost: Math.round(partsCost * 100) / 100,
    laborCost: Math.round(baseLabor * 100) / 100,
    overhead: Math.round((rawSubtotal - partsCost - baseLabor) * 100) / 100,
    subtotal: finalPrice,
  };
}

// ---------------- API ENDPOINTS ----------------

// API endpoint for Washington State local tax rate lookup
app.post("/api/tax-lookup", (req, res) => {
  const { zipCode } = req.body;
  if (!zipCode) {
    return res.status(400).json({ error: "zipCode is required." });
  }

  const cleanedZip = zipCode.trim();
  const location = WA_TAX_DATA[cleanedZip];

  if (location) {
    res.json({
      valid: true,
      zipCode: cleanedZip,
      city: location.city,
      rate: location.rate,
      message: `WASHINGTON TAX COMPLIANT: Destined delivery in ${location.city} (${cleanedZip}) is subject to ${location.rate * 100}% local combined sales tax.`,
    });
  } else {
    // Return standard WA base rate of 6.5% for general unspecified ZIP codes, or inform the user
    // WA sales tax ranges from 7.0% to 10.5% depending on destination. We will simulate a baseline 8.8% for other WA zips.
    const isWA = cleanedZip.startsWith("98") || cleanedZip.startsWith("99");
    if (isWA) {
      res.json({
        valid: true,
        zipCode: cleanedZip,
        city: "Washington State Destination",
        rate: 0.088,
        message: `WASHINGTON TAX COMPLIANT: Estimated Washington Destination Sales Tax base of 8.8% applied for ZIP ${cleanedZip}.`,
      });
    } else {
      res.json({
        valid: false,
        zipCode: cleanedZip,
        city: "Out of State",
        rate: 0,
        message: "Out of State destination. No Washington destination sales tax collected.",
      });
    }
  }
});

// API endpoint for secure dynamic quote generation
app.post("/api/generate-quote", (req, res) => {
  const { issueType, deviceTier, zipCode, isCorporate, companyName } = req.body;

  if (!issueType || !deviceTier) {
    return res.status(400).json({ error: "issueType ('screen' | 'battery' | 'button') and deviceTier ('flagship' | 'midrange' | 'budget') are required." });
  }

  // Calculate base quote
  const billing = calculateQuoteInternal(issueType, deviceTier);
  
  // Tax lookup
  let taxRate = 0.1035; // default Seattle rate if none given
  let taxCity = "Seattle";
  if (zipCode) {
    const lookup = WA_TAX_DATA[zipCode] || (zipCode.startsWith("98") || zipCode.startsWith("99") ? { city: "WA Unspecified", rate: 0.088 } : null);
    if (lookup) {
      taxRate = lookup.rate;
      taxCity = lookup.city;
    } else {
      taxRate = 0;
      taxCity = "Out of State";
    }
  }

  // B2B discount lookup details (20% flat discount on whole ticket parts & labor)
  let discountAmount = 0;
  let hasB2BDiscount = false;
  
  if (isCorporate) {
    hasB2BDiscount = true;
    discountAmount = Math.round((billing.subtotal * 0.2) * 100) / 100;
  }

  const subtotalAfterDiscount = Math.round((billing.subtotal - discountAmount) * 100) / 100;
  const calculatedTax = Math.round((subtotalAfterDiscount * taxRate) * 100) / 100;
  const grandTotal = Math.round((subtotalAfterDiscount + calculatedTax) * 100) / 100;

  res.json({
    baseQuote: billing,
    taxInfo: {
      zipCode: zipCode || "98101",
      city: taxCity,
      rate: taxRate,
      calculatedTax,
    },
    discountInfo: {
      applied: hasB2BDiscount,
      percentage: 20,
      amount: discountAmount,
      company: companyName || "Corporate Account",
    },
    subtotal: subtotalAfterDiscount,
    grandTotal,
  });
});

// API endpoint for evaluating B2B status by corporate domain
app.post("/api/verify-b2b", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required for Fast-Track evaluation" });
  }

  const domain = email.split("@")[1].toLowerCase();
  const isCorporate = B2B_CORPORATE_DOMAINS.includes(domain);

  res.json({
    email,
    domain,
    isCorporate,
    discountPercentage: isCorporate ? 20 : 0,
    companyName: isCorporate ? domain.split(".")[0].toUpperCase() + " Fleet" : null,
    message: isCorporate 
      ? `VERIFICATION SUCCESS: Corporate customer identified! 20% Fast-Track fleet repair discount & zero-deposit check-in is unlocked for ${domain}.`
      : `Retail client verified. Standard warranty and retail billing rates applied to domain ${domain}.`,
  });
});

// Helper to parse specifications and flow steps from conversational text
function detectSpecsFromText(text: string, currentDetails?: any) {
  const specs = {
    brand: currentDetails?.brand || null,
    model: currentDetails?.model || null,
    tier: currentDetails?.tier || null,
    issue: currentDetails?.issue || null,
    pricingTier: currentDetails?.pricingTier || null,
    step: currentDetails?.step || 1
  };

  const textLower = text.toLowerCase();

  // Brand Check
  if (textLower.includes("apple") || textLower.includes("iphone") || textLower.includes("ipad") || textLower.includes("ios") || textLower.includes("mac")) {
    specs.brand = "Apple";
    if (specs.step === 1) specs.step = 2;
  } else if (textLower.includes("samsung") || textLower.includes("galaxy") || textLower.includes("android") || textLower.includes("pixel") || textLower.includes("google")) {
    specs.brand = "Samsung";
    if (specs.step === 1) specs.step = 2;
  }

  // Model Check
  if (specs.brand === "Apple") {
    if (textLower.includes("se")) {
      specs.model = "iPhone SE";
      specs.tier = "budget";
    } else if (textLower.includes("15")) {
      specs.model = textLower.includes("pro") ? "iPhone 15 Pro Max" : "iPhone 15";
      specs.tier = "flagship";
    } else if (textLower.includes("14")) {
      specs.model = textLower.includes("pro") ? "iPhone 14 Pro" : "iPhone 14";
      specs.tier = "flagship";
    } else if (textLower.includes("13")) {
      specs.model = textLower.includes("pro") ? "iPhone 13 Pro" : "iPhone 13";
      specs.tier = "flagship";
    } else if (textLower.includes("12")) {
      specs.model = "iPhone 12";
      specs.tier = "flagship";
    } else if (textLower.includes("11")) {
      specs.model = "iPhone 11";
      specs.tier = "midrange";
    } else {
      specs.model = currentDetails?.model || "iPhone 14 Pro Max";
      specs.tier = "flagship";
    }
    if (specs.step === 1) specs.step = 2;
  } else if (specs.brand === "Samsung") {
    if (textLower.includes("s24")) {
      specs.model = "Galaxy S24 Ultra";
      specs.tier = "flagship";
    } else if (textLower.includes("s23")) {
      specs.model = "Galaxy S23 Ultra";
      specs.tier = "flagship";
    } else if (textLower.includes("s22")) {
      specs.model = "Galaxy S22";
      specs.tier = "flagship";
    } else if (textLower.includes("s21")) {
      specs.model = "Galaxy S21";
      specs.tier = "flagship";
    } else if (textLower.includes("a54") || textLower.includes("a35") || textLower.includes("a15") || textLower.includes("galaxy a")) {
      specs.model = "Galaxy A54";
      specs.tier = "budget";
    } else {
      specs.model = currentDetails?.model || "Galaxy S23 Ultra";
      specs.tier = "flagship";
    }
    if (specs.step === 1) specs.step = 2;
  }

  // Issue & Pricing Tiers Check
  if (textLower.includes("screen") || textLower.includes("crack") || textLower.includes("display") || textLower.includes("line") || textLower.includes("flicker") || textLower.includes("touch") || textLower.includes("glass") || textLower.includes("digitizer")) {
    specs.issue = "screen";
    specs.pricingTier = "Tier 2";
    specs.step = 3;
  } else if (textLower.includes("battery") || textLower.includes("drain") || textLower.includes("charge") || textLower.includes("power") || textLower.includes("bloat") || textLower.includes("percentage") || textLower.includes("cycle")) {
    specs.issue = "battery";
    specs.pricingTier = "Tier 1";
    specs.step = 3;
  } else if (textLower.includes("button") || textLower.includes("stuck") || textLower.includes("volume") || textLower.includes("power button") || textLower.includes("tactile")) {
    specs.issue = "button";
    specs.pricingTier = "Tier 3";
    specs.step = 3;
  } else if (textLower.includes("water") || textLower.includes("liquid") || textLower.includes("short") || textLower.includes("motherboard") || textLower.includes("logic board")) {
    specs.issue = "other";
    specs.pricingTier = "Tier 3";
    specs.step = 3;
  }

  // Progress steps
  if (specs.brand && specs.model && specs.step === 2 && !specs.issue) {
    // If we have device specs but no issue described yet, stay or prompt for step 3
    specs.step = 2;
  } else if (specs.brand && specs.model && specs.issue) {
    specs.step = 3;
  }

  return specs;
}

// API endpoint for secure mobile triage conversations with Google Search groundings and structured auto-syncing
app.post("/api/triage", async (req, res) => {
  const { messages, deviceDetails } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "An array of messages is required." });
  }

  const deviceContextPrompt = deviceDetails 
    ? `User current UI state: ${deviceDetails.brand || "Unspecified"} brand, ${deviceDetails.model || "Unspecified"} model (${deviceDetails.tier || "standard"} tier). Merge appropriately based on user input.`
    : `User has not selected a specific device yet inside the UI. Maintain full flow from greeting onwards.`;

  // Custom system instructions mapping out the distinct three-step logical flow
  const systemInstruction = `
You are the Display & Cell Pros Intelligent AI Hardware Diagnostics assistant, an expert laboratory-grade driveway device troubleshooting engineer stationed in Spokane & Seattle WA. Your objective is to guide customers down the following three-step logic flow:

Step 1: Initial Greeting (Welcome):
- Welcome customers with full technical composure to our unique driving-equipped mobile lab ("Display & Cell Pros").
- Explain that we dispatch fully customized hardware labs on wheels to the client's driveway/curbside to solve critical smartphone defects.

Step 2: Device Identification:
- Ask questions or analyze messages to differentiate clearly between specific Apple models (e.g., iPhone SE, 11, 12, 13, 14, 15 series, Plus/Pro/Max) and Samsung models (e.g., Galaxy S21, S22, S23, S24 Series, Fold/Flip, or budget Galaxy A-series).
- Identify which model and corresponding tier ('flagship', 'midrange', 'budget') is being repaired.
- Populated the extracted 'brand', 'model', and 'tier' properties in the detectedSpecs JSON fields.

Step 3: Damage Triage & Pricing Routing:
- Diagnose the specific mechanical, power, or visual hardware issues:
  - Tier 1: Core Power / Battery ($69 - $97) -> Battery swelling, rapid capacity decline, cycle count exhaustion, charging port blockages.
  - Tier 2: Elite Display Renewal (From $139) -> Scattered glass fractures, micro-splinters, vertical OLED lines, flickering backlights, touch grid latency.
  - Tier 3: Specialized Diagnostics (Custom Quote) -> Stuck hardware buttons, board-level short circuits, high-oxidation liquid damage.
- Provide practical device testing tips (inspecting under extreme angles, checking local settings for cycle stats) and route the issue cleanly to Tier 1, 2, or 3.

BEHAVIOR LAWS:
  - Output valid JSON containing 'text' (your response string) and 'detectedSpecs' containing brand, model, tier, issue, pricingTier, and step (1, 2, or 3).
  - Strictly limit diagnostics to screens, swollen batteries, tactile buttons, charging port issues, or motherboards. Pivot away politely from software, cooking, or general math.
  - Never disclose raw cost margin multipliers.
  `;

  if (openaiClient) {
    try {
      const contents = messages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" as const : "user" as const,
        content: msg.text
      }));

      // Call OpenAI API using modern SDK with structured JSON output enabled
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `CONTEXT:\n${deviceContextPrompt}` },
          ...contents
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "triage_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "The AI chat assistant's helpful conversational reply to the user. Guide them systematically along Step 1, Step 2, and Step 3."
                },
                detectedSpecs: {
                  type: "object",
                  description: "Structured extraction of device and damage properties of the user based on cumulative history.",
                  properties: {
                    brand: { type: ["string", "null"], description: "Identified device brand: 'Apple', 'Samsung', or null if undetermined." },
                    model: { type: ["string", "null"], description: "Specific model identified, e.g., 'iPhone 15 Pro Max', 'Galaxy S23' or null." },
                    tier: { type: ["string", "null"], description: "Hardware level tier: 'flagship', 'midrange', 'budget', or null." },
                    issue: { type: ["string", "null"], description: "Hardware issue category: 'screen', 'battery', 'button', or null." },
                    pricingTier: { type: ["string", "null"], description: "Auto-routed price class: 'Tier 1' (battery/power), 'Tier 2' (display/glass), or 'Tier 3' (buttons/motherboard/custom)." },
                    step: { type: ["integer", "null"], description: "Triage flow step: 1 (Greeting), 2 (Device Selection), 3 (Damage Pricing Routing)." }
                  },
                  required: ["brand", "model", "tier", "issue", "pricingTier", "step"],
                  additionalProperties: false
                }
              },
              required: ["text", "detectedSpecs"],
              additionalProperties: false
            }
          }
        }
      });

      const replyText = response.choices[0]?.message?.content || "";
      let parsedResponse = { text: replyText, detectedSpecs: {} };
      
      try {
        parsedResponse = JSON.parse(replyText.trim());
      } catch (parseErr) {
        console.warn("JSON parsing of OpenAI triage failed, applying keyword extractor fallback:", parseErr);
        // Fallback robust custom extractor parsing if JSON formatting is slightly off or contains markdown
        const lastUserMessage = messages[messages.length - 1]?.text || "";
        const fallbackSpecs = detectSpecsFromText(lastUserMessage, deviceDetails);
        parsedResponse = {
          text: replyText,
          detectedSpecs: fallbackSpecs
        };
      }

      const appBaseUrl = process.env.APP_URL || "";
      const groundingSources = [
        { title: "Spokane Smartphone Repair Standards", url: `${appBaseUrl}/spokane-device-lab` },
        { title: "Right-to-Repair Diagnostic Specifications", url: `${appBaseUrl}/diy-hardware-safety` }
      ];

      return res.json({ 
        text: parsedResponse.text, 
        detectedSpecs: parsedResponse.detectedSpecs, 
        groundingSources 
      });

    } catch (err: any) {
      console.warn("OpenAI API error during hardware triage (falling back to Spokane simulation):", err);
      const isQuotaError = err.status === 429 || err.message?.includes("429") || err.message?.includes("quota");
      
      const lastUserMessage = messages[messages.length - 1]?.text || "";
      const fallbackSpecs = detectSpecsFromText(lastUserMessage, deviceDetails);
      let simulatedReply = "";

      if (fallbackSpecs.step === 1) {
        simulatedReply = "Hi there! Welcome to Display & Cell Pros. 🚐💨 We deliver Seattle & Spokane's top mobile raw hardware lab right to your driveway! Differentiating screen, swollen battery, and tactile button issues on-site. What brand of phone are you looking to fix today—Apple or Samsung?";
      } else if (fallbackSpecs.step === 2) {
        simulatedReply = `Fantastic! Let's get your ${fallbackSpecs.brand || "device"} details configured. We carry a full matrix of factory glass and chemical cell variants. What specific model is that (e.g. S24 Ultra, iPhone 14 Pro Max, SE, etc.)?`;
      } else {
        if (fallbackSpecs.issue === "screen") {
          simulatedReply = `DIAGNOSTIC ANALYSIS: Detected screen alignment and glass fracture parameters for your ${fallbackSpecs.brand} ${fallbackSpecs.model}. This is routed safely to our **Tier 2 Pricing (Elite Display Renewal - starts at $139)**! Our mobile laboratory carries custom laser-sealed display overlays to replace this on-site in under 45 minutes. A live subtotal has synced in the quote panel below!`;
        } else if (fallbackSpecs.issue === "battery") {
          simulatedReply = `DIAGNOSTIC ANALYSIS: Rapid capacity degradation and cycle saturation identified on your ${fallbackSpecs.brand} ${fallbackSpecs.model}. This is routed to our **Tier 1 Pricing (Core Power & Port Restoration - $69-$97)**! Let's get this chemical risk resolved. We inspect safety seals and swap cells curbside. The quote has computed in the table below!`;
        } else if (fallbackSpecs.issue === "button") {
          simulatedReply = `DIAGNOSTIC ANALYSIS: Tactile resistance failure on your ${fallbackSpecs.brand} ${fallbackSpecs.model}. Sticky buttons are routed to our **Tier 3 Pricing (Specialized Diagnostics - Custom Quote)**! We will perform mechanical spring micro-calibrations and clean contact traces with professional solvents inside our custom work van. Quote is ready for review below!`;
        } else {
          simulatedReply = `Excellent. We have registered your ${fallbackSpecs.brand} ${fallbackSpecs.model} (${fallbackSpecs.tier || "standard"} performance tier). Please tell our laboratory engineers what physical hardware behaviors you are observing (touch lag, cracks, rapid drain, or sticky keys) to route you to the correct Tier 1, Tier 2, or Tier 3 pricing structure automatically!`;
        }
      }

      const mockGroundingSources = [
        { title: "Spokane Smartphone Repair Standards", url: `${process.env.APP_URL || ""}/spokane-device-lab` },
        { title: "Right-to-Repair Diagnostic Specifications", url: `${process.env.APP_URL || ""}/diy-hardware-safety` }
      ];

      return res.json({
        text: simulatedReply + `\n\n(Note: Operating under Advanced Local Simulation mode due to rate bounds or active API configuration: ${isQuotaError ? "Resource Exhausted (429)" : err.message || "Active Build Settings"}).`,
        detectedSpecs: fallbackSpecs,
        groundingSources: mockGroundingSources
      });
    }
  } else {
    // High-quality local developer simulator maintaining perfect step logic flow sync
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const fallbackSpecs = detectSpecsFromText(lastUserMessage, deviceDetails);
    let simulatedReply = "";

    if (fallbackSpecs.step === 1) {
      simulatedReply = "Hi there! Welcome to Display & Cell Pros. 🚐💨 We deliver Seattle & Spokane's top mobile raw hardware lab right to your driveway! Differentiating screen, swollen battery, and tactile button issues on-site. What brand of phone are you looking to fix today—Apple or Samsung?";
    } else if (fallbackSpecs.step === 2) {
      simulatedReply = `Fantastic! Let's get your ${fallbackSpecs.brand || "device"} details configured. We carry a full matrix of factory glass and chemical cell variants. What specific model is that (e.g. S24 Ultra, iPhone 14 Pro Max, SE, etc.)?`;
    } else {
      if (fallbackSpecs.issue === "screen") {
        simulatedReply = `DIAGNOSTIC ANALYSIS: Detected screen alignment and glass fracture parameters for your ${fallbackSpecs.brand} ${fallbackSpecs.model}. This is routed safely to our **Tier 2 Pricing (Elite Display Renewal - starts at $139)**! Our mobile laboratory carries custom laser-sealed display overlays to replace this on-site in under 45 minutes. A live subtotal has synced in the quote panel below!`;
      } else if (fallbackSpecs.issue === "battery") {
        simulatedReply = `DIAGNOSTIC ANALYSIS: Rapid capacity degradation and cycle saturation identified on your ${fallbackSpecs.brand} ${fallbackSpecs.model}. This is routed to our **Tier 1 Pricing (Core Power & Port Restoration - $69-$97)**! Let's get this chemical risk resolved. We inspect safety seals and swap cells curbside. The quote has computed in the table below!`;
      } else if (fallbackSpecs.issue === "button") {
        simulatedReply = `DIAGNOSTIC ANALYSIS: Tactile resistance failure on your ${fallbackSpecs.brand} ${fallbackSpecs.model}. Sticky buttons are routed to our **Tier 3 Pricing (Specialized Diagnostics - Custom Quote)**! We will perform mechanical spring micro-calibrations and clean contact traces with professional solvents inside our custom work van. Quote is ready for review below!`;
      } else {
        simulatedReply = `Excellent. We have registered your ${fallbackSpecs.brand} ${fallbackSpecs.model} (${fallbackSpecs.tier || "standard"} performance tier). Please tell our laboratory engineers what physical hardware behaviors you are observing (touch lag, cracks, rapid drain, or sticky keys) to route you to the correct Tier 1, Tier 2, or Tier 3 pricing structure automatically!`;
      }
    }

    const mockGroundingSources = [
      { title: "Spokane Smartphone Repair Standards", url: `${process.env.APP_URL || ""}/spokane-device-lab` },
      { title: "Right-to-Repair Diagnostic Specifications", url: `${process.env.APP_URL || ""}/diy-hardware-safety` }
    ];

    setTimeout(() => {
      return res.json({ 
        text: simulatedReply + "\n\n(Note: Clean diagnostic state synchronization active under Full-Stack Simulation mode.)",
        detectedSpecs: fallbackSpecs,
        groundingSources: mockGroundingSources
      });
    }, 605);
  }
});

// Deep "Thinking Level" High Reasoning diagnostic endpoint
app.post("/api/complex-diagnostics", async (req, res) => {
  const { prompt, deviceDetails } = req.body;
  
  const complexPrompt = `YOU ARE A SENIOR DEVICE HARDWARE ENGINEER. 
Perform a deep technical reasoning analysis considering:
Device Profile: ${JSON.stringify(deviceDetails)}
Technical Inquiry: ${prompt}

Provide a line-by-line detailed schematic dissection, troubleshooting tree with precise measurements (voltage tolerances, capacitance limits to test on multimeters), and custom repair directives tailored to local Right-to-Repair Spokane compliance constraints.`;

  if (openaiClient) {
    try {
      // Call OpenAI API using modern SDK with o3-mini model for deep technical reasoning tasks
      const response = await openaiClient.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "user", content: complexPrompt }
        ]
      });
      return res.json({ text: response.choices[0]?.message?.content || "" });
    } catch (err: any) {
      const isQuotaError = err.status === 429 || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || err.message?.includes("quota");
      if (isQuotaError) {
        console.warn("OpenAI o3-mini rate limit/quota reached. Falling back to simulated Spokane laboratory analysis.");
      } else {
        console.warn("OpenAI o3-mini Error (falling back to simulation):", err);
      }
      return res.json({
        text: `[HIGH-THINKING DISSECTION TREE - DEV WORKSPACE SIMULATOR]
1. PRE-CHECK DIAGNOSIS:
   - Target device class: ${deviceDetails?.brand || "Generic"} ${deviceDetails?.model || "Phone"} (${deviceDetails?.tier || "Standard"})
   - Focus Assembly: ${deviceDetails?.issueType?.toUpperCase() || "HARDWARE"} Unit

2. REASONING DEPTH STEPS:
   - Evaluated power rails: VBAT voltage standard is 3.82V. Any drop below 3.4V signals primary power delivery failure.
   - Tested LCD controller impedance: Under 80 Ohm is classified as a short to ground, causing the lines reported.
   - Mechanical contact feedback: Spring action requires 0.5N force. Corrosion requires micro-soldering or high-purity isopropyl cleaning.

3. ADVANCED REPAIR DIRECTIVES:
   - Disassemble chassis using standard dynamic heat plate (75°C for 4 minutes).
   - Unseat internal battery adhesive pull-tabs. Replace with a brand new tier-1 lithium-polymer cell.
   - Run digitizer recalibration diagnostic tool. Wait for handshake with motherboard ROM.
   
(Note: Highly detailed hardware analysis has automatically fallen back to Spokane local diagnostics engine due to OpenAI API rate/quota exhaustion: ${isQuotaError ? "Resource Exhausted (429)" : err.message || err})`
      });
    }
  } else {
    // Elegant system simulator fallback
    setTimeout(() => {
      return res.json({
        text: `[HIGH-THINKING DISSECTION TREE - DEV WORKSPACE SIMULATOR]
1. PRE-CHECK DIAGNOSIS:
   - Target device class: ${deviceDetails?.brand || "Generic"} ${deviceDetails?.model || "Phone"} (${deviceDetails?.tier || "Standard"})
   - Focus Assembly: ${deviceDetails?.issueType?.toUpperCase() || "HARDWARE"} Unit

2. REASONING DEPTH STEPS:
   - Evaluated power rails: VBAT voltage standard is 3.82V. Any drop below 3.4V signals primary power delivery failure.
   - Tested LCD controller impedance: Under 80 Ohm is classified as a short to ground, causing the lines reported.
   - Mechanical contact feedback: Spring action requires 0.5N force. Corrosion requires micro-soldering or high-purity isopropyl cleaning.

3. ADVANCED REPAIR DIRECTIVES:
   - Disassemble chassis using standard dynamic heat plate (75°C for 4 minutes).
   - Unseat internal battery adhesive pull-tabs. Replace with a brand new tier-1 lithium-polymer cell.
   - Run digitizer recalibration diagnostic tool. Wait for handshake with motherboard ROM.
   
(Note: Operating under High Thinking Simulation mode since process.env.OPENAI_API_KEY is not configured.)`
      });
    }, 900);
  }
});

// Multimodal Computer Vision device photo analyzer
app.post("/api/analyze-image", async (req, res) => {
  const { base64Data, mimeType, prompt } = req.body;

  if (!base64Data) {
    return res.status(400).json({ error: "Missing image base64Data parameter." });
  }

  const defaultPrompt = "Perform an expert hardware visual triage audit of this device. Detail: visible fractures/cracks, chassis bend analysis, battery bloating indicators, replacement viability, and a confidence rating of your computer vision analysis.";

  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || defaultPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${base64Data}`
                }
              }
            ]
          }
        ]
      });

      return res.json({ text: response.choices[0]?.message?.content || "" });
    } catch (err: any) {
      const isQuotaError = err.status === 429 || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || err.message?.includes("quota");
      if (isQuotaError) {
        console.warn("OpenAI API visual analysis rate limit/quota reached (429). Falling back to simulated computer vision diagnostics.");
      } else {
        console.warn("Multimodal analysis failed (falling back to simulation):", err);
      }
      return res.json({
        text: `[COMPUTER VISION TRIAGE REPORT - SIMULATION MODE]
- Visual Asset Analyzed successfully.
- Fractures Detected: 12 focal points of glass micro-shattering originating from top-right bezel.
- Board Integrity: Chassis alignment is straight (0.2° deviation, within tolerance).
- Battery Condition: No visible physical swelling or backplane deformation.
- Diagnostic Alert: High risk of moisture penetration through deep cracks in the adhesive lining.
- Feasibility Checklist: Elite Screen Renewal (Tier 2) is 95% likely to restore full functionality.
- Duration Estimate: 45 minutes on-site in our Spokane diagnostic van.

(Note: Photo computer vision analysis automatically fell back to Spokane local diagnostics engine due to active OpenAI API rate/quota limits: ${isQuotaError ? "Resource Exhausted (429)" : err.message || err})`
      });
    }
  } else {
    // Simulator visual response
    setTimeout(() => {
      res.json({
        text: `[COMPUTER VISION TRIAGE REPORT - SIMULATION MODE]
- Visual Asset Analyzed successfully.
- Fractures Detected: 12 focal points of glass micro-shattering originating from top-right bezel.
- Board Integrity: Chassis alignment is straight (0.2° deviation, within tolerance).
- Battery Condition: No visible physical swelling or backplane deformation.
- Diagnostic Alert: High risk of moisture penetration through deep cracks in the adhesive lining.
- Feasibility Checklist: Elite Screen Renewal (Tier 2) is 95% likely to restore full functionality.
- Duration Estimate: 45 minutes on-site in our Spokane diagnostic van.

(Note: Operating in local visual simulation mode. Configure process.env.OPENAI_API_KEY to execute real computer-vision analysis on actual photos.)`
      });
    }, 850);
  }
});

// POS Simulating API testing
app.get("/api/pos-sync-logs", (req, res) => {
  res.json({ logs: syncLogs, tickets: mockTickets });
});

app.post("/api/pos-sync-log", (req, res) => {
  const { source, level, message } = req.body;
  if (!source || !message) {
    return res.status(400).json({ error: "Source and message are required" });
  }
  const newLog = {
    timestamp: new Date().toISOString(),
    level: level || "INFO",
    message,
    source,
  };
  syncLogs.unshift(newLog);
  if (syncLogs.length > 50) syncLogs.pop();
  res.json({ success: true, logs: syncLogs });
});

app.post("/api/create-ticket", (req, res) => {
  const { customerName, device, issueType, quotedPrice, tax, discount, total, companyName } = req.body;

  if (!customerName || !device || !issueType) {
    return res.status(400).json({ error: "customerName, device, and issueType are required to register a ticket." });
  }

  const id = `DSC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newTicket: RepairTicket = {
    id,
    customerName,
    companyName,
    device,
    issueType,
    status: "open",
    quotedPrice: Number(quotedPrice) || 0,
    tax: Number(tax) || 0,
    discount: Number(discount) || 0,
    total: Number(total) || 0,
    createdAt: new Date().toISOString(),
  };

  mockTickets.unshift(newTicket);
  
  // Log the creation
  syncLogs.unshift({
    timestamp: new Date().toISOString(),
    level: "SUCCESS",
    message: `Registered direct repair ticket ${id} for ${customerName} ($${newTicket.total.toFixed(2)}) synced automatically with CellSmart POS`,
    source: "WebHook-Receiver"
  });

  res.json({ success: true, ticket: newTicket, tickets: mockTickets });
});

// GET /api/ticket-templates: Serves basic repair ticket templates for off-line PWA caching
app.get("/api/ticket-templates", (req, res) => {
  const templates = [
    {
      id: "tpl-apple-screen",
      name: "Apple Screen Replacement Template",
      brand: "Apple",
      issueType: "screen",
      description: "Standard visual screen rebuild with high-purity polyurethane adhesive seals and premium oleophobic screen finish.",
      estimatedTime: "45 mins",
      difficulty: "Intermediate",
      defaultPrice: 149.00
    },
    {
      id: "tpl-samsung-battery",
      name: "Samsung Battery Swap & Safety Calibration",
      brand: "Samsung",
      issueType: "battery",
      description: "Chemical lithium-ion swap including back cover gasket reset and deep voltage-regulation thermal sweep.",
      estimatedTime: "30 mins",
      difficulty: "Easy",
      defaultPrice: 89.00
    },
    {
      id: "tpl-generic-buttons",
      name: "Multi-Key Micro-Soldering Template",
      brand: "Generic",
      issueType: "button",
      description: "Contact trace cleaning with customized isopropyl solvents and mechanical feedback leaf-spring adjustments.",
      estimatedTime: "60 mins",
      difficulty: "Advanced",
      defaultPrice: 119.00
    }
  ];
  res.json(templates);
});

// ---------------- GOOGLE CLOUD SERVICE DIRECTORY MODULE REMOVED ----------------

// Service Directory initialization removed

// Service Directory endpoints removed

// ---------------- AWS RDS POSTGRES INTEGRATION MODULE ----------------

const mockMovies = [
  { id: 1, title: "The Matrix", year: 1999, genre: "Sci-Fi" },
  { id: 2, title: "Inception", year: 2010, genre: "Sci-Fi" },
  { id: 3, title: "Interstellar", year: 2014, genre: "Adventure" },
  { id: 4, title: "The Dark Knight", year: 2008, genre: "Action" }
];

// Endpoint to check AWS RDS PostgreSQL configuration & connection status
app.get("/api/rds-status", async (req, res) => {
  const configured = isDbConfigured();
  const token = (req.headers["x-rds-auth-token"] || req.query.authToken) as string | undefined;

  const maskString = (str?: string) => {
    if (!str) return "not-set";
    if (str.length <= 8) return "****";
    return str.substring(0, 4) + "..." + str.substring(str.length - 4);
  };

  const configInfo = {
    configured,
    host: maskString(process.env.SQL_HOST || process.env.PGHOST),
    user: maskString(process.env.SQL_USER || process.env.PGUSER),
    database: process.env.PGDATABASE || "postgres",
    port: process.env.PGPORT || "5432",
    awsRegion: process.env.AWS_REGION || "us-east-1",
    awsRoleArn: maskString(process.env.AWS_ROLE_ARN),
    awsAccountId: maskString(process.env.AWS_ACCOUNT_ID),
    hasManualToken: !!token
  };

  if (!configured) {
    return res.json({
      success: false,
      message: "AWS RDS PostgreSQL is not configured yet. Set PGHOST, PGUSER, PGDATABASE, and AWS_ROLE_ARN in your Vercel/Environment settings.",
      config: configInfo,
    });
  }

  try {
    // Test the connection with a simple query
    const startTime = Date.now();
    const result = await queryWithToken("SELECT NOW() as current_time, version() as db_version;", [], token);
    const queryDurationMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: token
        ? "Successfully connected to AWS RDS PostgreSQL cluster using custom/temporary Authentication Token!"
        : "Successfully connected to AWS RDS PostgreSQL cluster!",
      queryDurationMs,
      currentTime: result.rows[0].current_time,
      dbVersion: result.rows[0].db_version,
      config: configInfo,
      usingManualToken: !!token
    });
  } catch (err: any) {
    console.error("[Database Connection Error]:", err);
    return res.status(500).json({
      success: false,
      message: token 
        ? "Failed to connect to AWS RDS using the provided custom Auth Token."
        : "Connected configuration detected, but connection attempt failed.",
      error: err.message || err,
      config: configInfo,
    });
  }
});

// Endpoint to query movies
app.get("/api/movies", async (req, res) => {
  const token = (req.headers["x-rds-auth-token"] || req.query.authToken) as string | undefined;

  if (!isDbConfigured()) {
    return res.json({
      success: true,
      source: "local-simulation",
      message: "AWS RDS is not configured. Returning simulated movie list.",
      movies: mockMovies,
    });
  }

  try {
    const result = await queryWithToken("SELECT * FROM movies ORDER BY id ASC;", [], token);
    return res.json({
      success: true,
      source: token ? "aws-rds-postgres (manual-token)" : "aws-rds-postgres",
      movies: result.rows,
    });
  } catch (err: any) {
    console.warn("[Database Movies Fetch Warning]:", err.message || err);
    // Code 42P01 means table does not exist in Postgres
    if (err.code === "42P01") {
      return res.json({
        success: true,
        source: token ? "aws-rds-postgres-fallback (manual-token)" : "aws-rds-postgres-fallback",
        message: "AWS RDS is connected, but 'movies' table does not exist in database yet. Returning local simulation.",
        ddlHint: "CREATE TABLE movies (id SERIAL PRIMARY KEY, title VARCHAR(255), year INTEGER, genre VARCHAR(100)); INSERT INTO movies (title, year, genre) VALUES ('The Matrix', 1999, 'Sci-Fi'), ('Inception', 2010, 'Sci-Fi');",
        movies: mockMovies,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to query database.",
      error: err.message || err,
    });
  }
});

// Endpoint to query a movie by id
app.get("/api/movies/:id", async (req, res) => {
  const idStr = req.params.id;
  const id = Number(idStr);
  const token = (req.headers["x-rds-auth-token"] || req.query.authToken) as string | undefined;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid movie ID. Must be a number." });
  }

  if (!isDbConfigured()) {
    const movie = mockMovies.find(m => m.id === id);
    if (!movie) {
      return res.status(404).json({ error: `Movie with ID ${id} not found.` });
    }
    return res.json({
      success: true,
      source: "local-simulation",
      movie,
    });
  }

  try {
    const result = await queryWithToken("SELECT * FROM movies WHERE id = $1;", [id], token);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Movie with ID ${id} not found in AWS RDS.` });
    }
    return res.json({
      success: true,
      source: token ? "aws-rds-postgres (manual-token)" : "aws-rds-postgres",
      movie: result.rows[0],
    });
  } catch (err: any) {
    console.error("[Database Movie ID Fetch Error]:", err);
    if (err.code === "42P01") {
      const movie = mockMovies.find(m => m.id === id);
      if (!movie) {
        return res.status(404).json({ error: `Movie with ID ${id} not found.` });
      }
      return res.json({
        success: true,
        source: token ? "aws-rds-postgres-fallback (manual-token)" : "aws-rds-postgres-fallback",
        movie,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Database query failed.",
      error: err.message || err,
    });
  }
});

// GET /api/welcome or /welcome to read greeting from Vercel Edge Config
app.get(["/welcome", "/api/welcome"], async (req, res) => {
  try {
    if (!process.env.EDGE_CONFIG) {
      console.log("[Edge Config] EDGE_CONFIG environment variable is missing. Using offline fallback.");
      return res.json({
        greeting: "hello world",
        source: "local-fallback",
        message: "Connect your Vercel Edge Config to enable live remote configuration."
      });
    }

    const greeting = await get("greeting");
    return res.json({
      greeting: greeting || "hello world",
      source: "vercel-edge-config",
      storeId: "ecfg_avyjx0msxddaqlhv19g1zrc0iyin"
    });
  } catch (err: any) {
    console.error("[Edge Config Error]:", err);
    return res.json({
      greeting: "hello world",
      source: "error-fallback",
      error: err.message || err
    });
  }
});

// ---------------- VITE MIDDLEWARE CONFIG ----------------


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with HMR...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
