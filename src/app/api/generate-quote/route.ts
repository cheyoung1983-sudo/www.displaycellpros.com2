import { NextResponse } from 'next/server';
import { calculateQuoteInternal, WA_TAX_DATA } from '@/lib/repair-logic';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { issueType, deviceTier, zipCode, isCorporate, companyName, includeBatteryUpsell } = await req.json();
    console.log(`[Diagnostic] Generating quote: ${issueType} | ${deviceTier} | ZIP: ${zipCode}`);

    if (!issueType || !deviceTier) {
      return NextResponse.json({ error: "issueType and deviceTier are required." }, { status: 400 });
    }

    const rawTiers = calculateQuoteInternal(issueType, deviceTier);

    // Tax lookup
    let taxRate = 0.1035;
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

    const processTier = (tier: any, tierName: string) => {
      let subtotal = tier.subtotal;
      let discountAmount = 0;

      if (isCorporate) {
        discountAmount = Math.round((subtotal * 0.15) * 100) / 100;
      }

      if (includeBatteryUpsell && issueType !== "battery") {
        const batteryQuote = calculateQuoteInternal("battery", deviceTier).professional;
        const discountedBattery = (batteryQuote.subtotal * 0.5);
        subtotal += discountedBattery;
      }

      const subtotalAfterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;
      const calculatedTax = Math.round((subtotalAfterDiscount * taxRate) * 100) / 100;
      const grandTotal = Math.round((subtotalAfterDiscount + calculatedTax) * 100) / 100;

      return {
        ...tier,
        discountAmount,
        calculatedTax,
        grandTotal,
        extras: tierName === "authorized" ? ["Genuine OEM Parts", "Lifetime Warranty", "Free Protective Shield"]
               : tierName === "professional" ? ["Premium Soft OLED", "Lifetime Warranty", "Free Protective Shield"]
               : ["Aftermarket Quality", "90-Day Warranty"]
      };
    };

    return NextResponse.json({
      tiers: {
        budget: processTier(rawTiers.budget, "budget"),
        professional: processTier(rawTiers.professional, "professional"),
        authorized: processTier(rawTiers.authorized, "authorized"),
      },
      taxInfo: {
        zipCode: zipCode || "98101",
        city: taxCity,
        rate: taxRate,
      },
      discountInfo: {
        applied: !!isCorporate,
        percentage: 15,
        company: companyName || "Corporate Account",
      }
    });
  } catch (err: any) {
    console.error("[Quote Generation Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
