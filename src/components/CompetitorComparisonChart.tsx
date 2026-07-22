import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Layers, 
  Info, 
  Lock, 
  Search, 
  Server, 
  Database, 
  BarChart2, 
  Sparkles,
  ExternalLink,
  HelpCircle
} from "lucide-react";

interface CapabilityItem {
  category: "AI & Telemetry" | "Hardware & USB" | "Security & Locks" | "Business & Compliance";
  feature: string;
  description: string;
  dcpStatus: "supported" | "simulated" | "missing" | "planned";
  phonecheck: "supported" | "partial" | "missing";
  nsysGroup: "supported" | "partial" | "missing";
  m360: "supported" | "partial" | "missing";
  repairDesk: "supported" | "partial" | "missing";
  importance: "High" | "Medium" | "Critical";
  gapDetails?: string;
}

const COMPARISON_DATA: CapabilityItem[] = [
  {
    category: "AI & Telemetry",
    feature: "OpenAI GPT-4o / o3-mini Schematic Reasoning",
    description: "Deep AI model reasoning for board-level component fault analysis & test point voltage steps.",
    dcpStatus: "supported",
    phonecheck: "missing",
    nsysGroup: "missing",
    m360: "missing",
    repairDesk: "missing",
    importance: "High"
  },
  {
    category: "AI & Telemetry",
    feature: "Multimodal Computer Vision Fracture Analysis",
    description: "AI camera photo inspection to detect micro-cracks, flex ribbon teardowns, and liquid corrosion.",
    dcpStatus: "supported",
    phonecheck: "missing",
    nsysGroup: "partial",
    m360: "missing",
    repairDesk: "missing",
    importance: "High"
  },
  {
    category: "Hardware & USB",
    feature: "Browser-Native WebUSB Direct Probing",
    description: "Direct USB telemetry readouts in modern web browsers without installing desktop software executables.",
    dcpStatus: "supported",
    phonecheck: "missing",
    nsysGroup: "missing",
    m360: "missing",
    repairDesk: "missing",
    importance: "High"
  },
  {
    category: "Hardware & USB",
    feature: "Bulk Parallel Multi-Port Device Flashing (30+ Ports)",
    description: "Concurrent high-speed OS flashing and automated diagnostics on large multi-port USB hubs.",
    dcpStatus: "missing",
    phonecheck: "supported",
    nsysGroup: "supported",
    m360: "supported",
    repairDesk: "missing",
    importance: "Critical",
    gapDetails: "Phonecheck & NSYS support up to 40 concurrent iOS/Android USB flash channels for high-volume trade-in facilities."
  },
  {
    category: "Security & Locks",
    feature: "GSMA Live IMEI Blacklist & Financial Check",
    description: "Real-time carrier database query for reported stolen, blacklisted, or unpaid lease devices.",
    dcpStatus: "missing",
    phonecheck: "supported",
    nsysGroup: "supported",
    m360: "supported",
    repairDesk: "partial",
    importance: "Critical",
    gapDetails: "Essential for buyback/refurbishment workflows to prevent acquiring blacklisted or stolen mobile assets."
  },
  {
    category: "Security & Locks",
    feature: "Automated iCloud / FRP & MDM Lock Detection",
    description: "Instant cloud verification of Factory Reset Protection (FRP), Apple ID lock, and Corporate MDM enrolment.",
    dcpStatus: "missing",
    phonecheck: "supported",
    nsysGroup: "supported",
    m360: "supported",
    repairDesk: "partial",
    importance: "Critical",
    gapDetails: "Competitors run direct API hooks into CheckM8 / Apple GSX to verify lock status before purchasing/repairing."
  },
  {
    category: "Security & Locks",
    feature: "ADISA Certified Data Sanitization & Wipe Certificates",
    description: "Military-grade data erasure complying with NIST 800-88 & ADISA standards with cryptographically signed certificates.",
    dcpStatus: "planned",
    phonecheck: "supported",
    nsysGroup: "supported",
    m360: "supported",
    repairDesk: "missing",
    importance: "High",
    gapDetails: "Enterprise enterprise clients requiring certified data destruction compliance require ADISA or NIST 800-88 audit reports."
  },
  {
    category: "Business & Compliance",
    feature: "Native WA Destination Sales Tax Engine",
    description: "Automated Washington State DOR destination tax rate calculations by ZIP code.",
    dcpStatus: "supported",
    phonecheck: "missing",
    nsysGroup: "missing",
    m360: "missing",
    repairDesk: "partial",
    importance: "Medium"
  },
  {
    category: "Business & Compliance",
    feature: "B2B Fleet Corporate SLA Verification Engine",
    description: "Domain-based corporate verification with automated tier-based volume discounts and zero-deposit check-in.",
    dcpStatus: "supported",
    phonecheck: "missing",
    nsysGroup: "missing",
    m360: "missing",
    repairDesk: "supported",
    importance: "High"
  },
  {
    category: "Business & Compliance",
    feature: "Automated Cosmetic Grading & Trade-In Valuation",
    description: "Algorithmic cosmetic condition grading (Grade A/B/C) with live wholesale marketplace valuation integration.",
    dcpStatus: "planned",
    phonecheck: "supported",
    nsysGroup: "supported",
    m360: "supported",
    repairDesk: "partial",
    importance: "High",
    gapDetails: "Used by buyback operators to provide instant quotes based on live market resale value APIs."
  },
  {
    category: "Hardware & USB",
    feature: "Offline Browser Vault & AWS RDS Postgres Sync",
    description: "Durable offline LocalStorage backup paired with optional enterprise IAM-authenticated AWS RDS Postgres.",
    dcpStatus: "supported",
    phonecheck: "partial",
    nsysGroup: "partial",
    m360: "missing",
    repairDesk: "missing",
    importance: "Medium"
  }
];

export function CompetitorComparisonChart() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showOnlyGaps, setShowOnlyGaps] = useState<boolean>(false);

  const filteredData = COMPARISON_DATA.filter((item) => {
    if (activeCategory !== "All" && item.category !== activeCategory) return false;
    if (showOnlyGaps && item.dcpStatus !== "missing" && item.dcpStatus !== "planned") return false;
    return true;
  });

  const missingCount = COMPARISON_DATA.filter(i => i.dcpStatus === "missing").length;
  const plannedCount = COMPARISON_DATA.filter(i => i.dcpStatus === "planned").length;
  const supportedCount = COMPARISON_DATA.filter(i => i.dcpStatus === "supported").length;

  const renderStatusBadge = (status: "supported" | "simulated" | "missing" | "planned" | "partial") => {
    switch (status) {
      case "supported":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> NATIVE
          </span>
        );
      case "simulated":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
            <Sparkles className="w-3 h-3 text-blue-400" /> SIMULATED
          </span>
        );
      case "planned":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
            <Clock className="w-3 h-3 text-amber-400" /> ROADMAP
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            <Info className="w-3 h-3 text-slate-400" /> PARTIAL
          </span>
        );
      case "missing":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono">
            <XCircle className="w-3 h-3 text-rose-400" /> MISSING
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="border-b border-slate-700/80 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-wide font-mono uppercase">
              Industry Diagnostic Benchmarks & Competitor Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Side-by-side technical evaluation of <strong className="text-slate-200">Display & Cell Pros Diagnostics Hub</strong> against leading enterprise mobile diagnostic platforms (<strong className="text-slate-300">Phonecheck</strong>, <strong className="text-slate-300">NSYS Group</strong>, <strong className="text-slate-300">M360</strong>, and <strong className="text-slate-300">RepairDesk</strong>).
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-900 border border-slate-750 px-3 py-1.5 rounded-lg text-center font-mono">
            <span className="text-[10px] text-slate-400 block font-bold">D&CP NATIVE</span>
            <span className="text-sm font-extrabold text-emerald-400">{supportedCount} Features</span>
          </div>
          <div className="bg-slate-900 border border-slate-750 px-3 py-1.5 rounded-lg text-center font-mono">
            <span className="text-[10px] text-slate-400 block font-bold">GAP / ROADMAP</span>
            <span className="text-sm font-extrabold text-rose-400">{missingCount + plannedCount} Missing</span>
          </div>
        </div>
      </div>

      {/* STRATEGIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-blue-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider font-mono">
            <Zap className="w-4 h-4 text-blue-400" /> D&CP Key Differentiators & Strengths
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li><strong className="text-white">Zero Installation (Browser-Native):</strong> Operates instantly via WebUSB without downloading heavy Windows/Mac EXEs.</li>
            <li><strong className="text-white">Cognitive AI Schematic Analysis:</strong> Powered by OpenAI o3-mini & GPT-4o for micro-soldering component diagnosis.</li>
            <li><strong className="text-white">Multimodal Vision Analyst:</strong> Computer vision photo scanning for screen cracks & motherboard liquid corrosion.</li>
            <li><strong className="text-white">Local Tax & B2B Integration:</strong> Built-in WA State DOR destination sales tax & corporate domain discount verification.</li>
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Critical Missing Features (Competitor Edge)
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li><strong className="text-white">Carrier IMEI & Blacklist Checks:</strong> Lacks real-time GSMA database queries to flag stolen or unpaid leased phones.</li>
            <li><strong className="text-white">iCloud / FRP & MDM Lock Verification:</strong> No automated check to verify if Apple ID or FRP locks are active before repair.</li>
            <li><strong className="text-white">Bulk 30+ Hub Parallel Flashing:</strong> Phonecheck & NSYS can erase, flash, and test up to 40 phones concurrently.</li>
            <li><strong className="text-white">ADISA Data Wipe Certification:</strong> Missing NIST 800-88 / ADISA compliant erasure reports required for enterprise clients.</li>
          </ul>
        </div>
      </div>

      {/* FILTER & TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-lg border border-slate-750">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase mr-2">Category:</span>
          {["All", "AI & Telemetry", "Hardware & USB", "Security & Locks", "Business & Compliance"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowOnlyGaps(!showOnlyGaps)}
          className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
            showOnlyGaps
              ? "bg-rose-900/60 border-rose-700 text-rose-200"
              : "bg-slate-900 border-slate-750 text-slate-300 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          {showOnlyGaps ? "Showing Missing Features Only" : "Highlight Gaps Only"}
        </button>
      </div>

      {/* FEATURE COMPARISON TABLE */}
      <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-900/60">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-850 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-700">
              <th className="p-3">Feature Capability</th>
              <th className="p-3 text-center bg-blue-950/40 text-blue-300 border-x border-slate-750">
                Display & Cell Pros
              </th>
              <th className="p-3 text-center">Phonecheck</th>
              <th className="p-3 text-center">NSYS Group</th>
              <th className="p-3 text-center">M360</th>
              <th className="p-3 text-center">RepairDesk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{item.feature}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                      item.importance === "Critical" 
                        ? "bg-rose-950 text-rose-300 border border-rose-800" 
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.importance}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{item.description}</p>
                  {item.gapDetails && (
                    <p className="text-[10px] text-amber-300/90 font-mono bg-amber-950/30 p-1.5 rounded border border-amber-900/40 mt-1">
                      ⚠️ <strong>Competitive Gap:</strong> {item.gapDetails}
                    </p>
                  )}
                </td>

                {/* D&CP Column */}
                <td className="p-3 text-center bg-blue-950/20 border-x border-slate-750 align-middle">
                  {renderStatusBadge(item.dcpStatus)}
                </td>

                {/* Competitors */}
                <td className="p-3 text-center align-middle">
                  {renderStatusBadge(item.phonecheck)}
                </td>
                <td className="p-3 text-center align-middle">
                  {renderStatusBadge(item.nsysGroup)}
                </td>
                <td className="p-3 text-center align-middle">
                  {renderStatusBadge(item.m360)}
                </td>
                <td className="p-3 text-center align-middle">
                  {renderStatusBadge(item.repairDesk)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DEEP GAP ANALYSIS & ROADMAP SECTION */}
      <div className="bg-slate-900/90 border border-slate-750 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            Deep Research: What Diagnostics Hub Is Missing & Strategic Roadmap
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-2 bg-slate-850 p-4 rounded-lg border border-slate-750">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" /> 1. Real-Time GSMA IMEI & Lock API
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              Industry leaders like <strong>Phonecheck</strong> and <strong>NSYS</strong> connect directly to GSMA and Apple GSX servers to check IMEI status for unpaid financial balances, carrier locks, and iCloud/FRP locks. Integrating a third-party IMEI lookup service (e.g., Sickw API or CheckM8) will bridge this critical gap for trade-ins.
            </p>
          </div>

          <div className="space-y-2 bg-slate-850 p-4 rounded-lg border border-slate-750">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" /> 2. Bulk Multi-Port Parallel Flashing
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              High-volume repair shops and enterprise buyback facilities process dozens of devices simultaneously using multi-port powered USB hubs. While D&CP handles single-device WebUSB telemetry efficiently, high-volume batch processing requires native USB daemon hub controller integration.
            </p>
          </div>

          <div className="space-y-2 bg-slate-850 p-4 rounded-lg border border-slate-750">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> 3. ADISA / NIST 800-88 Data Wipe Certification
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              Enterprise fleet clients and corporate asset disposal contracts mandate certified data destruction audit reports. Implementing a cryptographically signed data wipe verification log PDF will allow Display & Cell Pros to win enterprise corporate fleet contracts.
            </p>
          </div>

          <div className="space-y-2 bg-slate-850 p-4 rounded-lg border border-slate-750">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-amber-400" /> 4. Algorithmic Grading & Live Trade-In Market Pricing
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              Platforms like <strong>M360</strong> and <strong>Phonecheck</strong> assign automated cosmetic letter grades (Grade A, B, C) and pull live trade-in valuation feeds from eBay / wholesale aggregators to give instantaneous cash offers to customers during check-in.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default CompetitorComparisonChart;
