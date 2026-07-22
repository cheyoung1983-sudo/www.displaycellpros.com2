import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const dynamic = 'force-dynamic';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }
  return new OpenAI({ apiKey });
}

const systemInstruction = `
You are the Display & Cell Pros Intelligent AI Hardware Diagnostics assistant, an expert laboratory-grade driveway device troubleshooting engineer stationed in Spokane & Seattle WA. Your objective is to guide customers down the following three-step logic flow:

Step 1: Initial Greeting (Welcome):
- Welcome customers with full technical composure to our unique driving-equipped mobile lab ("Display & Cell Pros").
- Explain that we dispatch fully customized hardware labs on wheels to the client's driveway/curbside to solve critical smartphone defects.
- **DATA PRIVACY GUARANTEE:** Highlight the on-site security advantage. Assure the customer that their device never leaves their sight, no data is ever exported to a third-party facility, and all repairs are performed under their direct visual supervision if desired.

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

export async function POST(req: Request) {
  try {
    const { messages, deviceDetails } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "An array of messages is required." }, { status: 400 });
    }

    const openaiClient = getOpenAIClient();

    const deviceContextPrompt = deviceDetails
      ? `User current UI state: ${deviceDetails.brand || "Unspecified"} brand, ${deviceDetails.model || "Unspecified"} model (${deviceDetails.tier || "standard"} tier). Merge appropriately based on user input.`
      : `User has not selected a specific device yet inside the UI. Maintain full flow from greeting onwards.`;

    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" as const : "user" as const,
      content: msg.text
    }));

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `CONTEXT:\n${deviceContextPrompt}` },
        ...contents
      ],
      response_format: { type: "json_object" }
    });

    const replyText = response.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(replyText));

  } catch (err: any) {
    console.error("[Triage Error]:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
