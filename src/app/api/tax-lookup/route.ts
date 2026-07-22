import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

export async function POST(req: Request) {
  try {
    const { zipCode } = await req.json();
    console.log(`[Diagnostic] Tax lookup for ZIP: ${zipCode}`);
    if (!zipCode) {
      return NextResponse.json({ error: "zipCode is required." }, { status: 400 });
    }

    const cleanedZip = zipCode.trim();
    const location = WA_TAX_DATA[cleanedZip];

    if (location) {
      return NextResponse.json({
        valid: true,
        zipCode: cleanedZip,
        city: location.city,
        rate: location.rate,
        message: `WASHINGTON TAX COMPLIANT: Destined delivery in ${location.city} (${cleanedZip}) is subject to ${location.rate * 100}% local combined sales tax.`,
      });
    } else {
      const isWA = cleanedZip.startsWith("98") || cleanedZip.startsWith("99");
      if (isWA) {
        return NextResponse.json({
          valid: true,
          zipCode: cleanedZip,
          city: "Washington State Destination",
          rate: 0.088,
          message: `WASHINGTON TAX COMPLIANT: Estimated Washington Destination Sales Tax base of 8.8% applied for ZIP ${cleanedZip}.`,
        });
      } else {
        return NextResponse.json({
          valid: false,
          zipCode: cleanedZip,
          city: "Out of State",
          rate: 0,
          message: "Out of State destination. No Washington destination sales tax collected.",
        });
      }
    }
  } catch (err: any) {
    console.error("[Tax Lookup Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
