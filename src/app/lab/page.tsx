"use client";

import React, { useState, useEffect } from 'react';
import {
  User, Database, AlertCircle, Wifi, Terminal, Activity,
  MapPin, Settings, ShieldCheck, Cpu, RefreshCw, Plus, FileText,
  Trash2, Mail, Eye, EyeOff, Globe, Server, Check, CheckCircle2,
  TrendingUp, DollarSign, Zap, ShoppingCart, ChevronUp, ChevronDown,
  LogOut
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RdsDiagnosticPanel } from '../../components/RdsDiagnosticPanel';
import CacheManagement from '../../components/CacheManagement';
import { HardwareScanChart } from '../../components/HardwareScanChart';
import TicketTemplatesPanel from '../../components/TicketTemplatesPanel';
import { RepairTicket, POSLog, QuoteResponse, TicketTemplate } from '@/lib/types';
import { calculateQuoteInternal, WA_TAX_DATA } from '@/lib/repair-logic';

export default function LabPortal() {
  const { user: auth0User, isLoading: isAuth0Loading, error: auth0Error } = useUser();

  // State from App.tsx
  const [labTab, setLabTab] = useState<"triage" | "pos" | "tax" | "postgres" | "settings">("triage");
  const [diagnosticMode, setDiagnosticMode] = useState<"standard" | "thinking" | "vision">("standard");

  // Device/Quote state
  const [deviceBrand, setDeviceBrand] = useState<string>("Apple");
  const [deviceModel, setDeviceModel] = useState<string>("iPhone 14 Pro Max");
  const [deviceTier, setDeviceTier] = useState<"flagship" | "midrange" | "budget">("flagship");
  const [issueType, setIssueType] = useState<"screen" | "battery" | "button">("screen");
  const [customerName, setCustomerName] = useState<string>("Jane Miller");
  const [zipInput, setZipInput] = useState<string>("98101");
  const [isCorporate, setIsCorporate] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [includeBatteryUpsell, setIncludeBatteryUpsell] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<"budget" | "professional" | "authorized">("professional");

  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse>({
    tiers: {
      budget: { partsCost: 45, laborCost: 50, subtotal: 171, discountAmount: 0, calculatedTax: 17.70, grandTotal: 188.70, extras: ["Aftermarket Quality", "90-Day Warranty"] },
      professional: { partsCost: 95, laborCost: 50, subtotal: 261, discountAmount: 0, calculatedTax: 27.01, grandTotal: 288.01, extras: ["Premium Soft OLED", "Lifetime Warranty", "Free Protective Shield"] },
      authorized: { partsCost: 180, laborCost: 75, subtotal: 459, discountAmount: 0, calculatedTax: 47.51, grandTotal: 506.51, extras: ["Genuine OEM Parts", "Lifetime Warranty", "Free Protective Shield"] }
    },
    taxInfo: { zipCode: "98101", city: "Seattle", rate: 0.1035 },
    discountInfo: { applied: false, percentage: 15, company: "" }
  });

  // Triage / Scan state
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [isReportExpanded, setIsReportExpanded] = useState(true);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [deepDiagnosticResult, setDeepDiagnosticResult] = useState("");
  const [isDeepDiagnosing, setIsDeepDiagnosing] = useState(false);
  const [thinkingPrompt, setThinkingPrompt] = useState("");
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  // POS / DB state
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [posLogs, setPosLogs] = useState<POSLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [ticketCreationSuccess, setTicketCreationSuccess] = useState(false);
  const [taxVerifiedMessage, setTaxVerifiedMessage] = useState("");
  const [isValidZip, setIsValidZip] = useState(true);
  const [taxCity, setTaxCity] = useState("Seattle");
  const [taxRate, setTaxRate] = useState(0.1035);

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Mock handlers
  const handleVerifyB2B = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
  };

  const handleTaxLookup = async (zip: string) => {
    // Implement or fetch from API
  };

  const fetchDynamicQuote = async () => {
    // Implement or fetch from API
  };

  const startPhysicalUsbScan = async () => {
    // Implement WebUSB
  };

  const downloadPdfReport = () => {};
  const shareReportViaEmail = () => {};
  const createOfficialTicket = async () => {};
  const clearChatLogs = () => setMessages([]);
  const handleSendTriageChat = async (e: any, text?: string) => {};
  const handleRunThinkingDiagnostic = async (e: any) => {};
  const handleVisionDiagnostic = async () => {};
  const handleImageUploadChange = (e: any) => {};
  const fetchPOSLogs = async () => {};
  const handleApplyTemplate = (t: TicketTemplate) => {};

  // Force login if not authenticated
  useEffect(() => {
    if (!isAuth0Loading && !auth0User) {
      window.location.href = "/api/auth/login?returnTo=/lab";
    }
  }, [auth0User, isAuth0Loading]);

  if (isAuth0Loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-400 font-mono text-sm animate-pulse">AUTHORIZING LAB SESSION...</p>
        </div>
      </div>
    );
  }

  if (auth0Error) return <div className="p-8 text-red-500">Auth Error: {auth0Error.message}</div>;
  if (!auth0User) return null; // Redirecting

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Technician Authentication Status bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            {auth0User.picture ? (
              <img src={auth0User.picture} alt="Profile" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Authed: {auth0User.name || auth0User.email}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wider font-extrabold border border-emerald-500/30">LAB SESSION LOCKED</span>
            </h3>
            <p className="text-xs text-slate-400">
              Logged in with technician credential {auth0User.email}. Backing up active Spokane WA tickets.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/auth/logout"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </a>
        </div>
      </div>

      {/* Header section representing Lab identity */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest font-mono">D&CP INTELLIGENT LABORATORY INTERFACE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Diagnostics Lab Dashboard</h1>
          <p className="text-sm text-slate-400">Manage virtual hardware checks, Washington dest-tax compliance calculations, and live POS sync registries.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400">Sync:</span> <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-3">
            <span className="text-slate-400">Latency:</span> <span className="text-blue-400 font-bold">12ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        <aside className="col-span-12 lg:col-span-3 bg-slate-850/60 border border-slate-800 rounded-xl p-4 flex flex-col space-y-5">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-mono">Device Hardware Analyzer</p>
            <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800 space-y-4 shadow-inner">
              <button
                type="button"
                disabled={isScanning}
                onClick={startPhysicalUsbScan}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-750 disabled:from-slate-700 disabled:to-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg"
              >
                {isScanning ? "PROBING HARDWARE..." : "🔌 Connect Phone (Cable)"}
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setLabTab("triage")} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${labTab === "triage" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> AI Diagnostic Console</div>
            </button>
            <button onClick={() => setLabTab("pos")} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${labTab === "pos" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> POS Ledger & Sync</div>
            </button>
            <button onClick={() => setLabTab("tax")} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${labTab === "tax" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> WA Tax Agent</div>
            </button>
          </nav>

          <TicketTemplatesPanel onApplyTemplate={handleApplyTemplate} />
        </aside>

        <div className="col-span-12 lg:col-span-9">
          {labTab === "triage" && (
            <div className="space-y-6">
              <section className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                 <h2 className="text-xl font-bold text-white mb-4">Strategic Value Matrix</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Budget */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-slate-400 text-xs font-bold uppercase mb-2">Budget</h4>
                      <div className="text-2xl font-bold">${quote.tiers.budget.grandTotal.toFixed(2)}</div>
                    </div>
                    {/* Professional */}
                    <div className="bg-blue-600/10 p-4 rounded-xl border-2 border-blue-500 scale-105 shadow-2xl">
                      <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">Professional</h4>
                      <div className="text-3xl font-bold text-white">${quote.tiers.professional.grandTotal.toFixed(2)}</div>
                    </div>
                    {/* Authorized */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-slate-400 text-xs font-bold uppercase mb-2">Authorized</h4>
                      <div className="text-2xl font-bold">${quote.tiers.authorized.grandTotal.toFixed(2)}</div>
                    </div>
                 </div>
              </section>
              <HardwareScanChart deviceBrand={deviceBrand} deviceModel={deviceModel} issueType={issueType} />
            </div>
          )}

          {labTab === "postgres" && <RdsDiagnosticPanel />}
          {labTab === "settings" && <CacheManagement onAddToast={() => {}} />}
        </div>
      </div>
    </div>
  );
}
