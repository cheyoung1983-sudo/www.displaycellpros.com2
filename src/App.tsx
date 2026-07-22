import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  Battery, 
  Smartphone, 
  MessageSquare,
  ShoppingCart,
  Briefcase,
  Wrench,
  Send,
  X,
  CheckCircle2,
  ChevronRight,
  Menu,
  Terminal,
  Activity,
  TrendingUp,
  DollarSign,
  Plus,
  RefreshCw,
  User,
  AlertCircle,
  Layers,
  Server,
  Wifi,
  Info,
  FileText,
  Check,
  ArrowRight,
  Database,
  Upload,
  Zap,
  Trash2,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp,
  QrCode,
  Copy,
  Usb,
  Mail,
  Eye,
  EyeOff,
  BarChart2
} from "lucide-react";
import { RepairTicket, POSLog, QuoteResponse } from "./types";
import { Toast, ToastContainer, ToastType } from "./components/ToastNotification";
import { HardwareScanChart } from "./components/HardwareScanChart";
import { UsbSimulator } from "./components/UsbSimulator";
import { RdsDiagnosticPanel } from "./components/RdsDiagnosticPanel";
import { jsPDF } from "jspdf";
import { PrivacyPolicyView } from "./components/PrivacyPolicyView";
import TicketTemplatesPanel from "./components/TicketTemplatesPanel";
import CacheManagement from "./components/CacheManagement";
import QrScannerModal from "./components/QrScannerModal";
import CompetitorComparisonChart from "./components/CompetitorComparisonChart";
import { TicketTemplate } from "./types";

// --- DATA MODELS ---

const SERVICES = [
  {
    tier: "Tier 1",
    title: "Core Power & Port Restoration",
    price: "$69 - $97",
    desc: "Fixed-price minor repairs focusing on power delivery.",
    examples: "Batteries, Charging Ports",
    icon: <Battery className="w-8 h-8 text-blue-400" />
  },
  {
    tier: "Tier 2",
    title: "Elite Display Renewal",
    price: "From $139",
    desc: "Fixed-price major repairs for cracked or failing screens.",
    examples: "iPhone 12-15, Galaxy S Series Screens",
    icon: <Smartphone className="w-8 h-8 text-blue-400" />
  },
  {
    tier: "Tier 3",
    title: "Specialized Diagnostics",
    price: "Custom Quote",
    desc: "Motherboard surgery, data recovery, and micro-soldering.",
    examples: "Liquid Damage, Board-Level Shorts, Cameras",
    icon: <Cpu className="w-8 h-8 text-blue-400" />
  }
];

const STORE_PRODUCTS = [
  { id: 1, name: "Casper Tempered Glass", price: 29.99, category: "Protection", img: "https://images.unsplash.com/photo-1606841120025-a130635c0292?auto=format&fit=crop&w=300&q=80" },
  { id: 2, name: "AmpSentrix Fast Charger (20W)", price: 34.99, category: "Power", img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80" },
  { id: 3, name: "CPO iPhone 13 Pro (128GB)", price: 549.00, category: "Devices", img: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=300&q=80" },
  { id: 4, name: "Heavy Duty Fleet Case", price: 49.99, category: "Protection", img: "https://images.unsplash.com/photo-1541892079639-65107954fa0f?auto=format&fit=crop&w=300&q=80" }
];

// --- MAIN MASTER APP COMPONENT ---

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
    if (path.includes("privacy")) return "privacy";
    if (path.includes("services")) return "services";
    if (path.includes("b2b") || path.includes("fleet")) return "b2b";
    if (path.includes("store")) return "store";
    if (path.includes("lab")) return "lab";
    return "home";
  });
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --- DIAGNOSTIC HUB STATES ---
  const [labTab, setLabTab] = useState<"triage" | "pos" | "tax" | "postgres" | "settings" | "comparison">("triage");

  // Active Customer & Device Details
  const [customerName, setCustomerName] = useState<string>("Jane Miller");
  const [deviceBrand, setDeviceBrand] = useState<string>("Apple");
  const [deviceModel, setDeviceModel] = useState<string>("iPhone 14 Pro Max");
  const [deviceTier, setDeviceTier] = useState<"flagship" | "midrange" | "budget">("flagship");
  const [issueType, setIssueType] = useState<"screen" | "battery" | "button">("screen");
  const [deviceSerial, setDeviceSerial] = useState<string>("DSC-G6TJX0L3V9X");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  
  // Device Hardware Scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isReportExpanded, setIsReportExpanded] = useState<boolean>(true);
  const [copiedTelemetry, setCopiedTelemetry] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [forceScanTimeout, setForceScanTimeout] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (title: string, message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleApplyTemplate = (template: TicketTemplate) => {
    setDeviceBrand(template.brand);
    // Determine default model for high-fidelity representation
    if (template.brand === "Apple") {
      setDeviceModel("iPhone 14 Pro Max");
      setDeviceTier("flagship");
    } else if (template.brand === "Samsung") {
      setDeviceModel("Galaxy S23 Ultra");
      setDeviceTier("flagship");
    } else {
      setDeviceModel("Google Pixel 8 Pro");
      setDeviceTier("flagship");
    }
    
    if (template.issueType === "screen" || template.issueType === "battery" || template.issueType === "button") {
      setIssueType(template.issueType as "screen" | "battery" | "button");
    } else {
      setIssueType("screen");
    }
    
    // Auto populate the customer name if it was default
    if (customerName === "Jane Miller") {
      setCustomerName("Diagnostic Van Client");
    }
    
    addToast(
      "Template Loaded",
      `Pre-loaded parameters for "${template.name}" applied successfully. Ready to run physical scan.`,
      "success"
    );
  };

  // B2B Customer Verification
  const [emailInput, setEmailInput] = useState<string>("marcus@amazon.com");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState<boolean>(false);
  const [isCorporate, setIsCorporate] = useState<boolean>(true);
  const [companyName, setCompanyName] = useState<string>("AMAZON Fleet");
  const [b2bMessage, setB2bMessage] = useState<string>("VERIFICATION SUCCESS: Corporate customer identified! 20% Fast-Track fleet repair discount & zero-deposit check-in is unlocked.");

  // Washington State Destination Sales Tax Config
  const [zipInput, setZipInput] = useState<string>("98101");
  const [taxRate, setTaxRate] = useState<number>(0.1035);
  const [taxCity, setTaxCity] = useState<string>("Seattle");
  const [taxVerifiedMessage, setTaxVerifiedMessage] = useState<string>("WASHINGTON TAX COMPLIANT: Destined delivery in Seattle (98101) is subject to 10.35% local combined sales tax.");
  const [isValidZip, setIsValidZip] = useState<boolean>(true);

  // Live Quote Response
  const [quote, setQuote] = useState<QuoteResponse>({
    baseQuote: { partsCost: 180, laborCost: 170, overhead: 52.5, subtotal: 402.5 },
    taxInfo: { zipCode: "98101", city: "Seattle", rate: 0.1035, calculatedTax: 33.32 },
    discountInfo: { applied: true, percentage: 20, amount: 80.5, company: "AMAZON Fleet" },
    subtotal: 322,
    grandTotal: 355.32
  });
  const [isCalculatingQuote, setIsCalculatingQuote] = useState<boolean>(false);

  // --- LOCAL PERSISTENT STORAGE AUTH & OFFLINE VAULT STATES ---
  const [authUser, setAuthUser] = useState<{ uid: string; displayName: string; email: string } | null>(null);
  const [localBackupTickets, setLocalBackupTickets] = useState<RepairTicket[]>([]);
  const [localBackupError, setLocalBackupError] = useState<string | null>(null);

  // --- EMAIL/PASSWORD AUTH STATES ---
  const [formEmail, setFormEmail] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    // Check if an active session flag was set in localStorage to avoid flashing login forms
    return localStorage.getItem("displaycellpros:hasActiveSession") === "true";
  });

  // --- MULTI-MODAL & ADVANCED DIAGNOSTIC SUB-MODE STATES ---
  const [diagnosticMode, setDiagnosticMode] = useState<"standard" | "thinking" | "vision">("standard");
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [thinkingPrompt, setThinkingPrompt] = useState<string>("Analyze the volume flex ribbon cable. Is impedance of 45 Ohm acceptable for core motherboard signal lines during boot? Detail typical multimeter diagnostic steps.");
  const [deepDiagnosticResult, setDeepDiagnosticResult] = useState<string>("");
  const [isDeepDiagnosing, setIsDeepDiagnosing] = useState<boolean>(false);
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; url: string }>>([]);

  // Fetch backup logs from persistent local storage
  const fetchLocalBackupTickets = async (uid: string) => {
    try {
      setLocalBackupError(null);
      const saved = localStorage.getItem("displaycellpros:tickets");
      if (saved) {
        const allTickets: RepairTicket[] = JSON.parse(saved);
        setLocalBackupTickets(allTickets.filter((t: RepairTicket) => t.userId === uid));
      } else {
        setLocalBackupTickets([]);
      }
    } catch (err) {
      console.error("Failed to load local tickets:", err);
      setLocalBackupError("Failed to access local persistent database.");
    }
  };

  const handleCreateLocalBackupTicket = async () => {
    const ticketId = "DCP-" + Math.floor(100000 + Math.random() * 900000);
    const newTicket: RepairTicket = {
      id: ticketId,
      customerName: customerName || "Jane Miller",
      companyName: isCorporate ? companyName : "",
      device: `${deviceBrand} ${deviceModel}`,
      issueType: issueType,
      status: "open",
      quotedPrice: quote.baseQuote.subtotal,
      tax: quote.taxInfo.calculatedTax,
      discount: quote.discountInfo.amount,
      total: quote.grandTotal,
      createdAt: new Date().toISOString(),
      userId: authUser?.uid || "simulated-user"
    };

    try {
      const saved = localStorage.getItem("displaycellpros:tickets");
      const current = saved ? JSON.parse(saved) : [];
      const updated = [newTicket, ...current];
      localStorage.setItem("displaycellpros:tickets", JSON.stringify(updated));
      setTicketCreationSuccess(true);
      setTimeout(() => setTicketCreationSuccess(false), 3000);
      if (authUser) {
        setLocalBackupTickets(updated.filter((t: RepairTicket) => t.userId === authUser.uid));
      } else {
        setLocalBackupTickets([newTicket]);
      }
      addToast(
        "Ticket Backed Up",
        `Ticket ${ticketId} has been securely saved to your local offline backup vault.`,
        "success"
      );
    } catch (err) {
      console.error("Failed to save ticket locally:", err);
      setLocalBackupError("Failed to write to local storage.");
    }
  };

  const handleDeleteLocalBackupTicket = async (ticketId: string) => {
    if (!confirm(`Are you sure you want to delete backup ticket ${ticketId}?`)) return;

    try {
      setLocalBackupError(null);
      const saved = localStorage.getItem("displaycellpros:tickets");
      const current = saved ? JSON.parse(saved) : [];
      const updated = current.filter((t: RepairTicket) => t.id !== ticketId);
      localStorage.setItem("displaycellpros:tickets", JSON.stringify(updated));
      if (authUser) {
        setLocalBackupTickets(updated.filter((t: RepairTicket) => t.userId === authUser.uid));
      } else {
        setLocalBackupTickets([]);
      }
      addToast(
        "Backup Deleted",
        `Backup ticket ${ticketId} has been successfully deleted from local storage.`,
        "success",
        3000
      );
    } catch (err) {
      console.error("Failed to delete ticket locally:", err);
      setLocalBackupError("Failed to update local database.");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword) {
      addToast("Validation Error", "Please fill in all fields.", "warning", 4000);
      return;
    }
    if (formPassword.length < 6) {
      addToast("Validation Error", "Password must be at least 6 characters.", "warning", 4005);
      return;
    }
    setIsAuthLoading(true);
    setTimeout(() => {
      try {
        const storedUsersRaw = localStorage.getItem("displaycellpros:registeredUsers");
        const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        
        if (usersList.some((u: any) => u.email.toLowerCase() === formEmail.toLowerCase())) {
          addToast("Registration Error", "A technician with this email is already registered.", "warning", 4000);
          setIsAuthLoading(false);
          return;
        }

        const newSimUser = {
          uid: "sim-uid-" + Math.random().toString(36).substr(2, 9),
          displayName: formEmail.split("@")[0] || "Technician",
          email: formEmail,
          password: formPassword
        };

        usersList.push(newSimUser);
        localStorage.setItem("displaycellpros:registeredUsers", JSON.stringify(usersList));

        const sessionUser = { uid: newSimUser.uid, displayName: newSimUser.displayName, email: newSimUser.email };
        setAuthUser(sessionUser);
        localStorage.setItem("displaycellpros:simulatedUser", JSON.stringify(sessionUser));
        localStorage.setItem("displaycellpros:hasActiveSession", "true");
        addToast("Account Created", "Welcome! Your persistent local session is active.", "success", 5000);
        setFormEmail("");
        setFormPassword("");
      } catch (err) {
        console.error("Failed registration:", err);
        addToast("Registration Error", "Failed to save technician account details.", "error", 4000);
      } finally {
        setIsAuthLoading(false);
      }
    }, 500);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword) {
      addToast("Validation Error", "Please fill in all fields.", "warning", 4000);
      return;
    }
    setIsAuthLoading(true);
    setTimeout(() => {
      try {
        const storedUsersRaw = localStorage.getItem("displaycellpros:registeredUsers");
        const defaultUsers = [
          {
            uid: "sim-uid-local-specialist",
            displayName: "Spokane Specialist",
            email: "specialist@displaycellpros.com",
            password: "spokane123"
          }
        ];
        const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : defaultUsers;
        if (!storedUsersRaw) {
          localStorage.setItem("displaycellpros:registeredUsers", JSON.stringify(defaultUsers));
        }

        const foundUser = usersList.find((u: any) => u.email.toLowerCase() === formEmail.toLowerCase());
        if (!foundUser) {
          addToast("Authentication Failed", "No registered technician matches this email.", "warning", 4000);
          setIsAuthLoading(false);
          return;
        }

        if (foundUser.password !== formPassword) {
          addToast("Authentication Failed", "Incorrect password for this technician.", "warning", 4000);
          setIsAuthLoading(false);
          return;
        }

        const sessionUser = {
          uid: foundUser.uid,
          displayName: foundUser.displayName,
          email: foundUser.email
        };
        setAuthUser(sessionUser);
        localStorage.setItem("displaycellpros:simulatedUser", JSON.stringify(sessionUser));
        localStorage.setItem("displaycellpros:hasActiveSession", "true");
        addToast("Signed In", `Connected to secure local session: ${formEmail}`, "success", 4000);
        setFormEmail("");
        setFormPassword("");
      } catch (err) {
        console.error("Failed authentication:", err);
        addToast("Authentication Error", "Error accessing local storage accounts.", "error", 4000);
      } finally {
        setIsAuthLoading(false);
      }
    }, 500);
  };

  const handleLocalQuickLogin = async () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      const simUser = {
        uid: "sim-uid-local-specialist",
        displayName: "Spokane Specialist",
        email: "specialist@displaycellpros.com"
      };
      setAuthUser(simUser);
      localStorage.setItem("displaycellpros:simulatedUser", JSON.stringify(simUser));
      localStorage.setItem("displaycellpros:hasActiveSession", "true");
      addToast("Signed In", "Connected via secure offline credentials bypass.", "success", 4000);
      setIsAuthLoading(false);
    }, 500);
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setAuthUser(null);
      localStorage.removeItem("displaycellpros:simulatedUser");
      localStorage.removeItem("displaycellpros:hasActiveSession");
      setLocalBackupTickets([]);
      addToast("Signed Out", "You have successfully signed out of your local session.", "success", 4000);
      setIsAuthLoading(false);
    }, 300);
  };

  // Local Auth Session loader
  useEffect(() => {
    if (authUser) {
      fetchLocalBackupTickets(authUser.uid);
    }
    setIsAuthChecking(false);
  }, [authUser]);

  // Hardware Diagnostic Chat Console State
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { 
      role: "assistant", 
      text: "Display & Cell Pros Local Diagnostic Hub activated. Secure offline sandbox online. Please describe your hardware issue. I am constrained strictly to screen, battery, and button diagnostics." 
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("Screen touch lag and horizontal pink lines");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // POS Tickets and Live Synchronization Logs
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [posLogs, setPosLogs] = useState<POSLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [ticketCreationSuccess, setTicketCreationSuccess] = useState<boolean>(false);

  // Washington Preset ZIP Clicker
  const WA_ZIP_PRESETS = [
    { zip: "98101", city: "Seattle", rate: "10.35%" },
    { zip: "98004", city: "Bellevue", rate: "10.1%" },
    { zip: "98402", city: "Tacoma", rate: "10.3%" },
    { zip: "98052", city: "Redmond", rate: "10.1%" },
    { zip: "98201", city: "Everett", rate: "9.9%" },
    { zip: "98501", city: "Olympia", rate: "9.5%" }
  ];

  // Fetch Sync Logs & Tickets on Mount
  useEffect(() => {
    fetchPOSLogs();
  }, []);

  // Recalculate quote automatically on changes
  useEffect(() => {
    fetchDynamicQuote();
  }, [issueType, deviceTier, zipInput, isCorporate, companyName]);

  const fetchPOSLogs = async (retries = 2, delay = 1000) => {
    setIsLoadingLogs(true);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/pos-sync-logs");
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
          setPosLogs(data.logs || []);
          setIsLoadingLogs(false);
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          console.warn("Error fetching POS data (falling back to high-fidelity simulated local stores):", err);
          // High fidelity fallback matching server state
          const fallbackTickets: any[] = [
            {
              id: "DSC-8041",
              customerName: "Sarah Jenkins",
              companyName: "Seattle Fleet Corp",
              device: "iPhone 14 Pro Max",
              issueType: "screen",
              status: "technician_working",
              quotedPrice: 320.0,
              tax: 33.12,
              discount: 64.0,
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
              tax: 13.03,
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
              tax: 18.63,
              discount: 36.0,
              total: 162.63,
              createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
            }
          ];
          const fallbackLogs = [
            { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), level: "INFO", message: "Successfully synced latest inventory prices with CellSmart server", source: "CellSmart" as const },
            { timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), level: "INFO", message: "Square webhook registered: catalog.version.updated", source: "Square" as const },
            { timestamp: new Date().toISOString(), level: "INFO", message: "Awaiting incoming POS transactions...", source: "WebHook-Receiver" as const },
          ];
          setTickets(fallbackTickets);
          setPosLogs(fallbackLogs);
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    setIsLoadingLogs(false);
  };

  const handleVerifyB2B = async (e?: React.FormEvent, retries = 2, delay = 1000) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) return;
    
    setIsVerifyingEmail(true);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/verify-b2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput })
        });
        if (res.ok) {
          const data = await res.json();
          setIsCorporate(data.isCorporate);
          setCompanyName(data.isCorporate ? data.companyName : "");
          setB2bMessage(data.message);
          setIsVerifyingEmail(false);
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          console.warn("B2B API lookup failed (falling back to high-fidelity local domain scanner):", err);
          const emailLower = emailInput.toLowerCase();
          const domain = emailLower.split("@")[1] || "";
          const B2B_DOMAINS = [
            "amazon.com", "microsoft.com", "google.com", "boeing.com",
            "starbucks.com", "costco.com", "displaycellpros.com",
            "t-mobile.com", "expedia.com", "nordstrom.com", "paccar.com"
          ];
          const isCorp = B2B_DOMAINS.includes(domain);
          const company = isCorp ? domain.split(".")[0].toUpperCase() : "";
          setIsCorporate(isCorp);
          setCompanyName(isCorp ? company : "");
          setB2bMessage(isCorp 
            ? `FAST-TRACK APPROVED: ${company} domain detected. 20% flat Corporate Fleet Discount automatically applied.`
            : "Fast-Track evaluation completed: Standard retail pricing applies."
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    setIsVerifyingEmail(false);
  };

  const handleTaxLookup = async (zip: string, retries = 2, delay = 1000) => {
    const targetZip = zip.trim();
    if (!targetZip) return;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/tax-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipCode: targetZip })
        });
        if (res.ok) {
          const data = await res.json();
          
          // Notify the user if the local rate differs from the previously saved/active tax rate value
          if (data.valid && data.rate !== taxRate) {
            const oldPercentage = (taxRate * 100).toFixed(2);
            const newPercentage = (data.rate * 100).toFixed(2);
            addToast(
              "Washington State Tax Rate Adjustment",
              `Destination sales tax adjusted from ${oldPercentage}% (${taxCity}) to ${newPercentage}% (${data.city}).`,
              "info",
              6000
            );
          }
          
          setTaxRate(data.rate);
          setTaxCity(data.city);
          setTaxVerifiedMessage(data.message);
          setIsValidZip(data.valid);
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          console.warn("Tax lookup API failed, falling back to local simulation:", err);
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
          };
          const lookup = WA_TAX_DATA[targetZip] || (targetZip.startsWith("98") || targetZip.startsWith("99") ? { city: "WA Unspecified", rate: 0.088 } : null);
          if (lookup) {
            if (lookup.rate !== taxRate) {
              const oldPercentage = (taxRate * 100).toFixed(2);
              const newPercentage = (lookup.rate * 100).toFixed(2);
              addToast(
                "Washington State Tax Rate Adjustment",
                `Destination sales tax adjusted from ${oldPercentage}% (${taxCity}) to ${newPercentage}% (${lookup.city}).`,
                "info",
                6000
              );
            }
            setTaxRate(lookup.rate);
            setTaxCity(lookup.city);
            setTaxVerifiedMessage(`WASHINGTON TAX COMPLIANT: Destined delivery in ${lookup.city} (${targetZip}) is subject to ${lookup.rate * 100}% local combined sales tax.`);
            setIsValidZip(true);
          } else {
            setTaxRate(0);
            setTaxCity("Out of State");
            setTaxVerifiedMessage(`Non-Washington address (${targetZip}) resolved: Out-of-state exemption (0% sales tax).`);
            setIsValidZip(false);
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  };

  // Re-validate Washington State tax rate automatically if the zip code is changed by the user (exactly 5 digits)
  useEffect(() => {
    const cleaned = zipInput.trim();
    if (cleaned.length === 5) {
      handleTaxLookup(cleaned);
    }
  }, [zipInput]);



  const fetchDynamicQuote = async (retries = 2, delay = 1000) => {
    setIsCalculatingQuote(true);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/generate-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueType,
            deviceTier,
            zipCode: zipInput,
            isCorporate,
            companyName: isCorporate ? companyName : undefined,
          })
        });
        if (res.ok) {
          const data = await res.json();
          setQuote(data);
          setIsCalculatingQuote(false);
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          console.warn("Quote generation API failed, using high-fidelity local simulation:", err);
          // High-fidelity fallback computation matching backend
          let partsCost = 45;
          let laborHours = 1.5;
          const hourlyLaborRate = 85;
          const overheadMultiplier = 1.15;

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
          const subtotalPrice = Math.round(rawSubtotal * 100) / 100;

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
          };

          let tRate = 0.1035;
          let tCity = "Seattle";
          if (zipInput) {
            const lookup = WA_TAX_DATA[zipInput.trim()] || (zipInput.trim().startsWith("98") || zipInput.trim().startsWith("99") ? { city: "WA Unspecified", rate: 0.088 } : null);
            if (lookup) {
              tRate = lookup.rate;
              tCity = lookup.city;
            } else {
              tRate = 0;
              tCity = "Out of State";
            }
          }

          let discountAmount = 0;
          if (isCorporate) {
            discountAmount = Math.round((subtotalPrice * 0.2) * 100) / 100;
          }

          const subtotalAfterDiscount = Math.round((subtotalPrice - discountAmount) * 100) / 100;
          const calculatedTax = Math.round((subtotalAfterDiscount * tRate) * 100) / 100;
          const grandTotal = Math.round((subtotalAfterDiscount + calculatedTax) * 100) / 100;

          setQuote({
            baseQuote: {
              partsCost: Math.round(partsCost * 100) / 100,
              laborCost: Math.round(baseLabor * 100) / 100,
              overhead: Math.round((rawSubtotal - partsCost - baseLabor) * 100) / 100,
              subtotal: subtotalPrice,
            },
            taxInfo: {
              zipCode: zipInput || "98101",
              city: tCity,
              rate: tRate,
              calculatedTax,
            },
            discountInfo: {
              applied: isCorporate,
              percentage: 20,
              amount: discountAmount,
              company: companyName || "Corporate Account",
            },
            subtotal: subtotalAfterDiscount,
            grandTotal,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    setIsCalculatingQuote(false);
  };

  const handleSendTriageChat = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const userMessage = { role: "user" as const, text: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    if (!presetText) {
      setChatInput("");
    }
    setIsChatSending(true);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          deviceDetails: {
            brand: deviceBrand,
            model: deviceModel,
            tier: deviceTier
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
        if (data.groundingSources && Array.isArray(data.groundingSources)) {
          setGroundingSources(data.groundingSources);
        } else {
          setGroundingSources([]);
        }
        
        if (data.detectedSpecs) {
          const specs = data.detectedSpecs;
          if (specs.brand) setDeviceBrand(specs.brand);
          if (specs.model) setDeviceModel(specs.model);
          if (specs.tier) setDeviceTier(specs.tier);
          if (specs.issue) setIssueType(specs.issue);
          
          addToast(
            "Triage Engine Live-Sync",
            `State Updated: Brand to [${specs.brand || "Undetected"}], Model to [${specs.model || "Undetected"}], Damage Routed to [${specs.pricingTier || specs.issue || "Undetected"}].`,
            "success"
          );
        }
      } else {
        throw new Error("Chat request failed");
      }
    } catch (err: any) {
      console.error("Chat triage error:", err);
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          text: "ERROR: Communication timeout on diagnostic proxy. Hardware fail-safes indicate parts replace needed if there is visible physical degradation." 
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleRunThinkingDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thinkingPrompt.trim()) return;
    setIsDeepDiagnosing(true);
    setDeepDiagnosticResult("");
    try {
      const res = await fetch("/api/complex-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: thinkingPrompt,
          deviceDetails: {
            brand: deviceBrand,
            model: deviceModel,
            tier: deviceTier,
            issueType: issueType
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDeepDiagnosticResult(data.text);
      } else {
        const data = await res.json();
        setDeepDiagnosticResult(`ERROR: Deeper reasoning diagnostic model failed. Details: ${data.error || "handshake failed"}`);
      }
    } catch (err: any) {
      console.error(err);
      setDeepDiagnosticResult(`COMMUNICATION TIMEOUT: ${err.message}`);
    } finally {
      setIsDeepDiagnosing(false);
    }
  };

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64Data = reader.result.split(",")[1];
        setSelectedImageBase64(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVisionDiagnostic = async () => {
    if (!selectedImageBase64) {
      alert("Please upload/select a device photo to execute multimodal computer vision analysis.");
      return;
    }
    setIsDeepDiagnosing(true);
    setDeepDiagnosticResult("");
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data: selectedImageBase64,
          mimeType: "image/png",
          prompt: `Perform an expert hardware visual triage audit of this device: ${deviceBrand} ${deviceModel}. Describe cracked glass fracture patterns, swelling indicator confidence, bezel alignment, and specific parts replacement requirements.`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDeepDiagnosticResult(data.text);
      } else {
        const data = await res.json();
        setDeepDiagnosticResult(`ERROR: Computer vision visual processing failed. Details: ${data.error || "failed"}`);
      }
    } catch (err: any) {
      console.error(err);
      setDeepDiagnosticResult(`COMMUNICATION TIME-OUT: ${err.message}`);
    } finally {
      setIsDeepDiagnosing(false);
    }
  };

  const createOfficialTicket = async () => {
    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          companyName: isCorporate ? companyName : undefined,
          device: `${deviceBrand} ${deviceModel}`,
          issueType,
          quotedPrice: quote.baseQuote.subtotal,
          tax: quote.taxInfo.calculatedTax,
          discount: quote.discountInfo.amount,
          total: quote.grandTotal
        })
      });
      if (res.ok) {
        setTicketCreationSuccess(true);
        setTimeout(() => setTicketCreationSuccess(false), 3000);
        fetchPOSLogs();
      }
    } catch (err) {
      console.error("Failed to push ticket to POS:", err);
    }
  };

  const clearChatLogs = () => {
    setMessages([
      { 
        role: "assistant", 
        text: "Diagnostic timeline flushed on Cloud Run. System stands ready for mobile hardware assessment guidelines." 
      }
    ]);
  };

  // Hardware Scan Trigger
  const startHardwareScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    setScanProgress(0);
    setScanStep("Initializing lab device diagnostic interface...");
    
    addToast(
      "Hardware Scan Initiated",
      "Probing local USB physical bus & hardware controllers...",
      "info",
      2500
    );
    
    const steps = [
      { progress: 15, text: "Searching USB physical bus and local hardware controllers..." },
      { progress: 35, text: "Handshaking with connected controller chipset... Success." },
      { progress: 55, text: "Reading hardware serial: DSC-G6TJX0L3V9X..." },
      { progress: 75, text: "Probing Li-Poly thermal sensor and cycle capacity metrics..." },
      { progress: 90, text: "Analyzing screen digitizer controller and OLED voltage rails..." },
      { progress: 100, text: "Scan complete! Pre-filling device status." }
    ];

    let currentStepIndex = 0;
    
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const current = steps[currentStepIndex];

        // Simulate Hardware Scan Timeout if the switch is active
        if (forceScanTimeout && current.progress === 55) {
          clearInterval(interval);
          setIsScanning(false);
          setScanStep("Hardware probe timeout: Connected physical bus unresponsive.");
          addToast(
            "Hardware Scan Timeout",
            "Failed to connect to USB controller: Physical bus unresponsive (Code: 0x8E12A).",
            "error",
            6000
          );
          return;
        }

        setScanProgress(current.progress);
        setScanStep(current.text);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        
        const scanCandidates = [
          { brand: "Samsung", model: "Galaxy S23 Ultra", tier: "flagship" as const, issue: "battery" as const, customer: "Alex Rivera", b2b: false, email: "alex.rivera@gmail.com", zip: "98004", city: "Bellevue", rate: 0.101 },
          { brand: "Apple", model: "iPhone 14 Pro Max", tier: "flagship" as const, issue: "screen" as const, customer: "Sarah Jenkins", b2b: true, email: "marcus@amazon.com", zip: "98101", city: "Seattle", rate: 0.1035 },
          { brand: "Google", model: "Pixel 7a", tier: "midrange" as const, issue: "button" as const, customer: "David Miller", b2b: false, email: "dmiller@gmail.com", zip: "98402", city: "Tacoma", rate: 0.103 }
        ];
        
        const selected = scanCandidates[Math.floor(Math.random() * scanCandidates.length)];
        
        setDeviceBrand(selected.brand);
        setDeviceModel(selected.model);
        setDeviceTier(selected.tier);
        setIssueType(selected.issue);
        setCustomerName(selected.customer);
        setIsCorporate(selected.b2b);
        setEmailInput(selected.email);
        setZipInput(selected.zip);
        setTaxCity(selected.city);
        setTaxRate(selected.rate);
        
        if (selected.b2b) {
          setCompanyName("AMAZON Fleet");
          setB2bMessage("VERIFICATION SUCCESS: Corporate customer identified! 20% Fast-Track fleet repair discount & zero-deposit check-in is unlocked.");
        } else {
          setCompanyName("");
          setB2bMessage("Retail client verified. Standard warranty and retail billing rates applied.");
        }

        setTaxVerifiedMessage(`WASHINGTON TAX COMPLIANT: Destined delivery in ${selected.city} (${selected.zip}) is subject to ${selected.rate * 100}% local combined sales tax.`);
        setIsValidZip(true);
        
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: `[SYSTEM DIAGNOSIS DETECTED via PHYSICAL PROBE]: Verified device ${selected.brand} ${selected.model} (Serial: DSC-G6TJX0L3V9X). Hardware parameters have been successfully digitized and pre-filled in your diagnostics side-panel. Issue identified on: ${selected.issue.toUpperCase()} Assembly.`
          }
        ]);

        addToast(
          "Hardware Scan Successful",
          `Successfully connected. Digitized and pre-filled parameters for ${selected.brand} ${selected.model}.`,
          "success",
          5000
        );

        setHasScanned(true);
        setIsScanning(false);
      }
    }, 600);
  };

  const startPhysicalUsbScan = async () => {
    setIsScanning(true);
    setHasScanned(false);
    setScanProgress(0);
    setScanStep("Initializing WebUSB subsystem client...");

    addToast(
      "Connecting USB Cable...",
      "Waiting for physical device to authorize connection...",
      "info",
      3500
    );

    try {
      const nav = navigator as any;
      if (!nav.usb) {
        throw new Error("WebUSB API is not supported in this browser or is blocked. Standard in-app iframe previews often require opening the application in a new tab first.");
      }

      const device = await nav.usb.requestDevice({ filters: [] });
      
      setScanProgress(30);
      setScanStep(`Device identified! Brand: ${device.manufacturerName || "Unknown"}. Connecting...`);

      await device.open();
      setScanProgress(60);
      setScanStep(`Reading micro-controller parameters & cycle metrics...`);

      try {
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }
        await device.claimInterface(0);
      } catch (claimErr) {
        console.warn("Non-critical handshake claim warning:", claimErr);
      }

      setScanProgress(90);
      setScanStep("Parsing motherboard ROM and battery series impedance...");

      let brand = "Google";
      let model = device.productName || "Mobile Diagnostic Device";
      const manufacturerLower = (device.manufacturerName || "").toLowerCase();

      if (manufacturerLower.includes("apple") || device.vendorId === 0x05ac) {
        brand = "Apple";
        model = device.productName || "iPhone USB Interface";
      } else if (manufacturerLower.includes("samsung") || device.vendorId === 0x04e8) {
        brand = "Samsung";
        model = device.productName || "Galaxy Host controller";
      } else if (manufacturerLower.includes("google") || device.vendorId === 0x18d1) {
        brand = "Google";
        model = device.productName || "Pixel Test Board";
      }

      setTimeout(() => {
        setDeviceBrand(brand);
        setDeviceModel(model);
        setDeviceTier(brand === "Apple" || brand === "Samsung" ? "flagship" : "midrange");
        setIssueType("battery"); 
        setCustomerName("PHYSICAL USB CLIENT");
        setIsCorporate(false);
        setCompanyName("");
        setZipInput("98101");
        setTaxCity("Seattle");
        setTaxRate(0.1035);
        setTaxVerifiedMessage(`WASHINGTON TAX COMPLIANT: Connected via Direct Physical USB-C Cable. Destined Seattle (98101) local combined tax scale is 10.35%.`);
        setIsValidZip(true);

        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: `[DIRECT USB PAIR SUCCESS]: Physically retrieved device details over cable: ${brand} ${model} (Vendor ID: 0x${device.vendorId.toString(16).toUpperCase()}, Product: 0x${device.productId.toString(16).toUpperCase()}, Serial: ${device.serialNumber || "N/A"}). Telemetry diagnostics successfully mapped in real-time!`
          }
        ]);

        addToast(
          "Direct Cable Connection Established",
          `Physically paired with ${brand} ${model} successfully! Telemetry diagnostics active.`,
          "success",
          6000
        );

        setScanProgress(100);
        setScanStep("Direct USB diagnostic link online.");
        setHasScanned(true);
        setIsScanning(false);
      }, 1000);

    } catch (err: any) {
      console.warn("Direct USB connectivity fault:", err);
      setIsScanning(false);

      const errorMsg = err.message || "Operation cancelled or blocked.";
      const isSecurityError = err.name === "SecurityError" || errorMsg.toLowerCase().includes("security") || errorMsg.toLowerCase().includes("iframe") || errorMsg.toLowerCase().includes("permission");
      const isUserCancelled = errorMsg.includes("No device selected");

      let guidance = "Make sure your device is fully unlocked, plugged-in safely, and trust handshake is approved.";
      if (isSecurityError) {
        guidance = "Iframe sandboxing blocked the USB connection popups. Please click the 'Open in New Tab' button in the toolbar above to run in a secure sandbox context!";
      } else if (isUserCancelled) {
        guidance = "No USB diagnostic device was selected. Plug in a device and try again when you are ready.";
      }

      addToast(
        isUserCancelled ? "Pairing Handshake Cancelled" : "Direct USB Connection Blocked",
        guidance,
        isUserCancelled ? "info" : "error",
        isUserCancelled ? 4000 : 10000
      );

      setScanStep(isUserCancelled ? "Handshake cancelled by technician" : `Direct USB Fail: ${errorMsg}`);
    }
  };

  const downloadPdfReport = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Let's create an elegant, professional layout for a calibration & telemetry diagnostic report
      // Set primary color palette
      const primaryColor = [15, 23, 42]; // slate-900
      const accentColor = [59, 130, 246]; // blue-500
      const activeGreen = [16, 185, 129]; // emerald-500
      const darkGray = [71, 85, 105]; // slate-600

      // Outer border / aesthetic framing
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.rect(8, 8, 194, 281);

      // Top Header Accent Strip
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(8, 8, 194, 6, "F");

      // Title Block
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("DEVICE DIAGNOSTIC REPORT", 16, 26);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("AUTO-GENERATED VIA HARDWARE PROBING LINK", 16, 31);

      // Metadata / Timestamp right-aligned
      const timestamp = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.text(`SCAN TIMESTAMP: ${timestamp}`, 190, 26, { align: "right" });
      doc.text("SYSTEM ID: COM-CORE-USB-01", 190, 31, { align: "right" });

      // Horizontal separator line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.line(16, 36, 194, 36);

      // Section 1: Customer & Host Association Info
      doc.setFillColor(248, 250, 252); // slate-50 background for card
      doc.rect(16, 42, 178, 38, "F");
      doc.setDrawColor(226, 232, 240); // border
      doc.rect(16, 42, 178, 38, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("CLIENT & SYSTEM ASSOCIATION DETAILS", 22, 49);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Customer Profile:`, 22, 56);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${customerName || "WALK-IN GUEST"}`, 54, 56);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Corporate Account:`, 22, 62);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${isCorporate ? `YES (${companyName || "N/A"})` : "NO (RETAIL HANDSET)"}`, 54, 62);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Assigned Tax Region:`, 22, 68);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${taxCity || "DEFAULT LOCALE (US-WA)"} (ZIP: ${zipInput || "98101"})`, 54, 68);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Local Processing Rate:`, 22, 74);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${(taxRate * 100).toFixed(4)}% combined state/municipal load`, 54, 74);

      // Right Side metadata (in Section 1)
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Connection Mode:", 120, 56);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // emerald green
      doc.text("USB DIRECT CABLE", 148, 56);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Interface Status:", 120, 62);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246); // blue
      doc.text("HANDSHAKE TERMINATED", 148, 62);

      // Section 2: Hardware Physical Probe Data
      doc.setFillColor(248, 250, 252); 
      doc.rect(16, 88, 178, 38, "F");
      doc.rect(16, 88, 178, 38, "D");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("HARDWARE SPECIFICATIONS & DETECTED CHIPSETS", 22, 95);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Device OEM Brand:", 22, 102);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${deviceBrand || "Generic"}`, 54, 102);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Model Identifier:", 22, 108);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${deviceModel || "Mobile Diagnostics Core"}`, 54, 108);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Performance Tier:", 22, 114);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${(deviceTier || "standard").toUpperCase()}`, 54, 114);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Reported Fault Vector:", 22, 120);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68); // Red
      doc.text(`${(issueType || "system").toUpperCase()}`, 54, 120);

      // Estimated cycle health values in Section 2 side info
      const isBatteryIssue = issueType === "battery";
      const batteryCycleHealth = isBatteryIssue ? 76 : 94;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Rated Battery Health:", 115, 102);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isBatteryIssue ? 239 : 16, isBatteryIssue ? 68 : 185, isBatteryIssue ? 68 : 129);
      doc.text(`${batteryCycleHealth}% Cap Capacity`, 152, 102);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Mainboard Cycle Load:", 115, 108);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("432 charge cycles", 152, 108);

      // Section 3: Diagnostic Telemetry Metrics Log
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("TELEMETRY TIME-SERIES INTERPOLATION", 16, 138);

      // Table mapping
      const tableTop = 144;
      doc.setFillColor(15, 23, 42);
      doc.rect(16, tableTop, 178, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("CYCLE PROBE SAMPLE", 20, tableTop + 5);
      doc.text("NOMINAL RAIL VOLTAGE (V)", 65, tableTop + 5);
      doc.text("MEASURED STABLE ACTIVE VOLTAGE (V)", 120, tableTop + 5);
      doc.text("RELATIVE DELTA VARIANCE (%)", 165, tableTop + 5);

      const tableData = [
        { sample: "1. Core Boot initialization", nominal: "4.15V", measured: isBatteryIssue ? "3.90V" : "4.14V", delta: isBatteryIssue ? "-6.02%" : "-0.24%" },
        { sample: "2. Memory Load state spike", nominal: "4.20V", measured: isBatteryIssue ? "3.84V" : "4.18V", delta: isBatteryIssue ? "-8.57%" : "-0.48%" },
        { sample: "3. GPU/Display high refresh", nominal: "4.18V", measured: isBatteryIssue ? "3.71V" : "4.15V", delta: isBatteryIssue ? "-11.24%" : "-0.72%" },
        { sample: "4. Fast Charge pipeline toggle", nominal: "4.25V", measured: isBatteryIssue ? "3.91V" : "4.23V", delta: isBatteryIssue ? "-8.00%" : "-0.47%" },
        { sample: "5. Thermal regulation check", nominal: "4.12V", measured: isBatteryIssue ? "3.91V" : "4.10V", delta: isBatteryIssue ? "-5.10%" : "-0.49%" },
        { sample: "6. Idle decay state", nominal: "4.16V", measured: isBatteryIssue ? "3.93V" : "4.15V", delta: isBatteryIssue ? "-5.53%" : "-0.24%" },
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      tableData.forEach((row, index) => {
        const yOffset = tableTop + 7 + (index * 7.5) + 6;
        if (index % 2 === 0) {
          doc.setFillColor(241, 245, 249); 
          doc.rect(16, tableTop + 7 + (index * 7.5), 178, 7.5, "F");
        }
        doc.setTextColor(30, 41, 59);
        doc.text(row.sample, 20, yOffset);
        doc.text(row.nominal, 65, yOffset);
        doc.setTextColor(15, 23, 42); 
        doc.text(row.measured, 120, yOffset);
        doc.setTextColor(isBatteryIssue ? 220 : 16, isBatteryIssue ? 38 : 185, isBatteryIssue ? 38 : 129);
        doc.text(row.delta, 165, yOffset);
      });

      // Recommendations
      const recTop = 205;
      doc.setFillColor(239, 246, 255); 
      doc.setDrawColor(191, 219, 254); 
      doc.rect(16, recTop, 178, 48, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("DIAGNOSTIC SYSTEM RECOMMENDATIONS", 22, recTop + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      
      if (isBatteryIssue) {
        doc.text("• Detected voltage load line collapse exceeds the maximum allowable hardware threshold of 3.5%.", 22, recTop + 14);
        doc.text("• Probing sequence indicates active internal dendrite propagation within cell series stack.", 22, recTop + 20);
        doc.text("• Recommend scheduled battery cell replacement within next 48 service hours. DO NOT OVER-CHARGE.", 22, recTop + 26);
        doc.text("• Ensure technician utilizes authentic standard series parts matching OEM ID values.", 22, recTop + 32);
        doc.text(`• Reference service category code: ELEC-BATT-${deviceBrand.toUpperCase()}-HEAVY.`, 22, recTop + 38);
      } else {
        doc.text("• Power rail stability is uniform. Transient drop test successfully cleared within nominal range.", 22, recTop + 14);
        doc.text("• Mainboard charge-counter tracks normal degradation rate of 2.1-2.9% annually.", 22, recTop + 20);
        doc.text("• Scheduled maintenance: Routine exterior hardware clean and liquid seal check recommended next.", 22, recTop + 26);
        doc.text("• No critical components flagged for replacement. Firmware calibration completed successfully.", 22, recTop + 32);
        doc.text(`• Reference service category code: PASS-OK-${deviceBrand.toUpperCase()}-ANNUAL.`, 22, recTop + 38);
      }

      // Disclaimer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); 
      doc.text("DISCLAIMER: This diagnostic summary report was generated locally using WebUSB and active hardware instrumentation layers.", 16, 264);
      doc.text("Voltage curves, impedance factors, and estimated parameters represent simulated profiles compiled on user authorization.", 16, 269);

      // Signatures
      doc.setDrawColor(203, 213, 225); 
      doc.line(16, 252, 90, 252);
      doc.text("SYSTEM CALIBRATOR SIGN-OFF", 16, 257);
      
      doc.line(120, 252, 194, 252);
      doc.text("AUTHORIZED CABLE CLIENT SIGNATURE", 120, 257);

      const docName = `Diagnostic_Report_${deviceBrand || "Device"}_${Date.now()}.pdf`;
      doc.save(docName);

      addToast(
        "PDF Report Downloaded",
        "A structured high-resolution telemetry report has been compiled and saved to your device.",
        "success",
        5500
      );
    } catch (pdfErr: any) {
      console.error("PDF generation failure:", pdfErr);
      addToast(
        "PDF Compilation Error",
        pdfErr.message || "An unexpected error occurred during PDF assembly.",
        "error",
        6000
      );
    }
  };

  const shareReportViaEmail = () => {
    try {
      const traceText = `--- TELEMETRY TRACE ---
ID: COM-CORE-USB-01
Timestamp: ${new Date().toLocaleString()}
Manufacturer: ${deviceBrand}
Model: ${deviceModel}
Tier: ${deviceTier}
Fault: ${issueType.toUpperCase()}
Battery Health: ${issueType === "battery" ? "76%" : "94%"}
Status: ${issueType === "battery" ? "DEGRADED" : "OPTIMAL"}`;

      const subject = encodeURIComponent(`Diagnostic Report - ${deviceBrand} ${deviceModel}`);
      const body = encodeURIComponent(
        `Hello,\n\nHere is the diagnostic telemetry trace summary for the device:\n\n${traceText}\n\nYou can also access the system here:\n${window.location.href}\n\nBest regards,\nLab Terminal Sync`
      );
      
      window.location.href = `mailto:?subject=${subject}&body=${body}`;

      addToast(
        "Email Drafted",
        "Your default email application has been opened with the diagnostic report details.",
        "success",
        4000
      );
    } catch (err: any) {
      console.error("Failed to share report via email:", err);
      addToast(
        "Email Sharing Failed",
        err.message || "Could not open mail client.",
        "error",
        5000
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col justify-between">
      
      {/* HEADER / NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setActiveTab("home")}>
              <Wrench className="h-8 w-8 text-blue-500 mr-3 animate-pulse" />
              <div>
                <span className="font-bold text-xl tracking-tight text-white block leading-none">DISPLAY & CELL PROS</span>
                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Professional On-Site Solutions</span>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6">
                <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")}>Home</NavButton>
                <NavButton active={activeTab === "services"} onClick={() => setActiveTab("services")}>Services</NavButton>
                <NavButton active={activeTab === "b2b"} onClick={() => setActiveTab("b2b")}>B2B Fleet</NavButton>
                <NavButton active={activeTab === "store"} onClick={() => setActiveTab("store")}>Store</NavButton>
                <NavButton active={activeTab === "privacy"} onClick={() => setActiveTab("privacy")}>Privacy & Consent</NavButton>
                
                {/* Diagnostics Embedded Laboratory Link */}
                <button
                  id="tab-diagnostics-lab"
                  onClick={() => setActiveTab("lab")}
                  className={`px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all uppercase flex items-center gap-1.5 relative group ${
                    activeTab === "lab" 
                      ? "text-blue-400 bg-slate-800 shadow-xs border border-blue-500/30" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Cpu className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                  Lab Portal
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[8px] uppercase tracking-tighter bg-blue-600 text-white rounded font-extrabold animate-pulse">
                    Live
                  </span>
                </button>

                <button 
                  onClick={() => setIsAiOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
                >
                  <MessageSquare size={18} />
                  Book / Quote
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-b border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <MobileNavButton onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}>Home</MobileNavButton>
              <MobileNavButton onClick={() => { setActiveTab("services"); setMobileMenuOpen(false); }}>Services</MobileNavButton>
              <MobileNavButton onClick={() => { setActiveTab("b2b"); setMobileMenuOpen(false); }}>B2B Fleet</MobileNavButton>
              <MobileNavButton onClick={() => { setActiveTab("store"); setMobileMenuOpen(false); }}>Store</MobileNavButton>
              <MobileNavButton onClick={() => { setActiveTab("privacy"); setMobileMenuOpen(false); }}>Privacy & Consent</MobileNavButton>
              
              <button 
                  onClick={() => { setActiveTab("lab"); setMobileMenuOpen(false); }}
                  className="w-full text-left flex items-center gap-2 block px-3 py-3 rounded-md text-base font-bold text-blue-400 bg-slate-900 border border-slate-755 mb-2"
                >
                  <Cpu size={18} /> Diagnostics Lab Portal (Beta)
              </button>

              <button 
                  onClick={() => { setIsAiOpen(true); setMobileMenuOpen(false); }}
                  className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-white bg-blue-600"
                >
                  Book Repair / Get Quote
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* CORE CONTENT ROUTING AREA */}
      <main className="flex-1 pb-16">
        {activeTab === "home" && <HomeView onBookClick={() => setIsAiOpen(true)} onLabClick={() => setActiveTab("lab")} />}
        {activeTab === "services" && <ServicesView onBookClick={() => setIsAiOpen(true)} />}
        {activeTab === "b2b" && <B2BView onBookClick={() => setIsAiOpen(true)} />}
        {activeTab === "store" && <StoreView />}
        {activeTab === "privacy" && (
          <PrivacyPolicyView 
            onBackToHome={() => {
              setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onNavigateToLab={() => {
              setActiveTab("lab");
              setLabTab("triage");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
        
        {/* --- DEEP DIAGNOSTIC HUB MAIN PANEL VIEWS --- */}
        {activeTab === "lab" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
            {/* Technician Authentication Status bar or skeleton loader */}
            {isAuthChecking ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 bg-slate-700 rounded" />
                    <div className="h-3 w-72 bg-slate-700/50 rounded" />
                  </div>
                </div>
                <div className="h-9 w-40 bg-slate-700 rounded-lg shrink-0" />
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {authUser ? `Authed: ${authUser.displayName || authUser.email}` : "Local Secure Offline Vault"}
                      {authUser && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wider font-extrabold border border-emerald-500/30">LOCAL LINK LOCKED</span>}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {authUser 
                        ? `Logged in with technician credential ${authUser.email}. Backing up active Spokane WA tickets.` 
                        : "Log in with technician credentials to securely store quote backups in your persistent offline local database."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {authUser ? (
                    <button 
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={handleLocalQuickLogin}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center gap-2 transition-colors border border-blue-500/20"
                    >
                      Quick Bypass Login
                    </button>
                  )}
                </div>
              </div>
            )}

            {localBackupError && (
              <div className="bg-red-950/40 border border-red-950/50 p-3 rounded-lg text-xs text-red-300 font-mono flex items-center gap-2 mb-4 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>[LOCAL PERSISTENT DATABASE EXCEPTION LOG]: {localBackupError}</span>
              </div>
            )}



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

              {/* Lab telemetry summary indicators */}
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

            {/* Dashboard Three Column Workspace Splitter */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
              
              {/* === LEFT RAIL: PRESET & STATE MODIFIER BAR === */}
              <aside className="col-span-12 lg:col-span-3 bg-slate-850/60 border border-slate-800 rounded-xl p-4 flex flex-col space-y-5">
                
                {/* Active Session Device Specifier */}
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-mono">Device Hardware Analyzer</p>
                  <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800 space-y-4 shadow-inner">
                    
                    {/* Hardware Scan Simulator Action */}
                    <div className="pb-3 border-b border-slate-800/80 space-y-2.5">
                      <div className="text-[9px] text-slate-400 font-extrabold uppercase font-mono tracking-wider flex items-center justify-between mb-1">
                        <span>Diagnostic Trigger Layer</span>
                        <span className="text-blue-400">USB 2.0 / 3.0</span>
                      </div>
                      
                      <button
                        type="button"
                        id="btn-physical-usb"
                        disabled={isScanning}
                        onClick={startPhysicalUsbScan}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-750 disabled:from-slate-700 disabled:to-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg hover:scale-[1.01] active:scale-98 transition-all border border-emerald-500/20"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {isScanning ? "PROBING HARDWARE..." : "🔌 Connect Phone (Cable)"}
                      </button>


                      
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-850/60 space-y-1 text-[8.5px] text-slate-400 font-mono">
                        <div className="text-slate-300 font-extrabold uppercase text-[8px] flex items-center gap-1">
                          <span>💡 CABLE PORT TIPS:</span>
                        </div>
                        <p className="leading-snug">
                          1. Plug phone via certified USB cable to host motherboard.<br />
                          2. Unlock device screen & grant Trust / Debug permissions.<br />
                          3. If trapped in the safe iframe sandbox, <b className="text-blue-400 hover:underline">Open in a New Tab</b> to unlock Google Chrome's WebUSB hardware popup permission engine!
                        </p>
                      </div>

                      {isScanning && (
                        <div className={`mt-3 bg-slate-950 border rounded-lg p-3 font-mono text-[10px] text-emerald-400 leading-tight space-y-2.5 shadow-inner transition-all duration-500 ${
                          scanProgress >= 90 ? "border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse" : "border-slate-800"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-extrabold text-[8.5px] uppercase tracking-widest transition-colors duration-500 ${scanProgress >= 90 ? "text-amber-400 animate-pulse" : "text-slate-400"}`}>
                              {scanProgress >= 90 ? "⚡ FINAL DIAGNOSTIC STEPS" : "HARDWARE PROBE ACTIVE"}
                            </span>
                            <span className={`font-bold animate-pulse transition-colors duration-500 ${scanProgress >= 90 ? "text-amber-400" : "text-blue-400"}`}>{scanProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                scanProgress >= 90 
                                  ? "bg-gradient-to-r from-amber-500 to-orange-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                                  : "bg-emerald-400"
                              }`}
                              style={{ width: `${scanProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-slate-350 transition-all text-[9px] leading-snug">{scanStep}</p>
                        </div>
                      )}

                      {!isScanning && hasScanned && (
                        <div id="diagnostic-report-collapsible-container" className="mt-4 border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-lg">
                          {/* Header bar that acts as a toggle */}
                          <div 
                            onClick={() => setIsReportExpanded(!isReportExpanded)}
                            className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800/80 cursor-pointer select-none hover:bg-slate-850 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isReportExpanded ? "animate-pulse bg-emerald-400" : "bg-blue-400"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isReportExpanded ? "bg-emerald-500" : "bg-blue-500"}`}></span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase font-mono">
                                {isReportExpanded ? "REAL-TIME DIAGNOSTIC RE-RAILS" : "SCAN TELEMETRY READY"}
                              </span>
                            </div>
                            <button
                              type="button"
                              id="btn-toggle-report"
                              onClick={(e) => {
                                e.stopPropagation(); // Avoid triggering double toggle
                                setIsReportExpanded(!isReportExpanded);
                              }}
                              className="text-[9px] font-black uppercase font-mono tracking-widest text-blue-400 hover:text-white hover:bg-blue-600 bg-blue-950/40 hover:border-blue-550 border border-blue-900/60 px-2 py-1 rounded transition-all flex items-center gap-1"
                            >
                              <span>{isReportExpanded ? "MINIMIZE REPORT" : "VIEW FULL REPORT"}</span>
                              {isReportExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          
                          {/* Collapsible report Content with animation */}
                          {isReportExpanded && (
                            <div className="p-3 bg-slate-950/40 animate-in fade-in slide-in-from-top-1 duration-150">
                              <HardwareScanChart 
                                deviceBrand={deviceBrand}
                                deviceModel={deviceModel}
                                issueType={issueType}
                              />
                              
                              {/* QR Code Synchronization Card */}
                              <div id="diagnostic-qr-sync-panel" className="mt-3 bg-slate-900 border border-slate-800/80 rounded-lg p-3 flex flex-col sm:flex-row items-center gap-3.5 shadow-inner">
                                <div className="relative shrink-0 p-1.5 bg-white rounded-lg border border-slate-700 shadow-md flex items-center justify-center">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
`--- TELEMETRY TRACE ---
ID: COM-CORE-USB-01
Timestamp: ${new Date().toLocaleString()}
Manufacturer: ${deviceBrand}
Model: ${deviceModel}
Tier: ${deviceTier}
Fault: ${issueType.toUpperCase()}
Battery Health: ${issueType === "battery" ? "76%" : "94%"}
Status: ${issueType === "battery" ? "DEGRADED" : "OPTIMAL"}`
                                    )}&color=0f172a`}
                                    alt="Diagnostic Handshake QR Code"
                                    id="diagnostic-qr-code-img"
                                    className="w-24 h-24 select-none rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-[6.5px] text-white font-black font-mono px-1 rounded shadow-md animate-pulse">
                                    LIVE
                                  </div>
                                </div>

                                <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[9.5px] font-extrabold text-slate-300 uppercase tracking-wider font-mono">
                                      Terminal Sync QR Code
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
                                    Scan with any workbench terminal or secondary mobile reader to instantly transfer active calibrator state parameters.
                                  </p>
                                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-[8px] font-bold text-slate-500 font-mono">
                                    <span>CODE:</span>
                                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-800">
                                      {deviceBrand.toUpperCase()}-{deviceModel.slice(0, 8).replace(/\s+/g, "").toUpperCase()}-{issueType.toUpperCase()}
                                    </span>
                                    <span className="text-slate-700">|</span>
                                    <span className="text-emerald-400/95 uppercase tracking-widest animate-pulse flex items-center gap-1 font-extrabold mr-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                      TELEMETRY READY
                                    </span>
                                    <span className="text-slate-700 hidden sm:inline">|</span>
                                    <button
                                      type="button"
                                      id="btn-copy-telemetry-trace"
                                      onClick={() => {
                                        const traceText = `--- TELEMETRY TRACE ---
ID: COM-CORE-USB-01
Timestamp: ${new Date().toLocaleString()}
Manufacturer: ${deviceBrand}
Model: ${deviceModel}
Tier: ${deviceTier}
Fault: ${issueType.toUpperCase()}
Battery Health: ${issueType === "battery" ? "76%" : "94%"}
Status: ${issueType === "battery" ? "DEGRADED" : "OPTIMAL"}`;
                                        navigator.clipboard.writeText(traceText);
                                        setCopiedTelemetry(true);
                                        addToast(
                                          "Telemetry Copied",
                                          "Raw diagnostic telemetry trace parameters have been copied to clipboard.",
                                          "success",
                                          3000
                                        );
                                        setTimeout(() => setCopiedTelemetry(false), 3000);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[8px] font-extrabold text-blue-400 hover:text-blue-300 rounded transition-all font-mono shadow-sm cursor-pointer select-none"
                                    >
                                      {copiedTelemetry ? (
                                        <>
                                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                                          <span className="text-emerald-400 uppercase tracking-wider">COPIED</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-2.5 h-2.5 text-blue-400" />
                                          <span>COPY DATA</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2.5">
                                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                                  ID: COM-CORE-USB-01
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    id="btn-share-email-report"
                                    onClick={shareReportViaEmail}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-300 hover:text-white font-mono text-[9px] font-extrabold uppercase tracking-wider rounded transition-all shadow border border-slate-800 hover:border-slate-700 cursor-pointer"
                                    title="Draft an email containing telemetry summary and link"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Share via Email</span>
                                  </button>
                                  <button
                                    type="button"
                                    id="btn-download-pdf-report"
                                    onClick={downloadPdfReport}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono text-[9px] font-extrabold uppercase tracking-wider rounded transition-all shadow border border-blue-500/20 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-200" />
                                    <span>Download PDF Report</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Customer details input */}
                    <div>
                      <label htmlFor="customerName" className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">Customer Name</label>
                      <input 
                        id="customerName"
                        name="customerName"
                        type="text" 
                        value={customerName} 
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 transition-colors uppercase font-sans"
                        placeholder="E.g. Jane Miller"
                      />
                    </div>

                    {/* Device Serial input with QR Scan action */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="deviceSerial" className="block text-[10px] text-slate-400 font-bold uppercase font-mono">Device Serial</label>
                        <span className="text-[8px] font-mono text-blue-450 uppercase font-black">Digital Decoded</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <input 
                            id="deviceSerial"
                            name="deviceSerial"
                            type="text" 
                            value={deviceSerial} 
                            onChange={(e) => setDeviceSerial(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded pl-2.5 pr-8 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 uppercase font-bold tracking-wider"
                            placeholder="E.g. DSC-G6TJX0L3V9X"
                          />
                          <div className="absolute right-2 top-2 text-[9px] text-emerald-400 font-mono font-bold select-none uppercase">
                            OK
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQrScannerOpen(true)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border border-blue-500/20 rounded transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-98 cursor-pointer shadow"
                          title="Open high-fidelity QR Code & Barcode Scanner"
                        >
                          <QrCode className="w-3.5 h-3.5 text-white" />
                          <span className="text-[9.5px] font-black uppercase font-mono tracking-wider hidden sm:inline">SCAN</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="deviceBrand" className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">Brand</label>
                        <select 
                          id="deviceBrand"
                          name="deviceBrand"
                          value={deviceBrand}
                          onChange={(e) => {
                            setDeviceBrand(e.target.value);
                            if (e.target.value === "Apple") {
                              setDeviceModel("iPhone 14 Pro Max");
                              setDeviceTier("flagship");
                            } else if (e.target.value === "Samsung") {
                              setDeviceModel("Galaxy S23 Ultra");
                              setDeviceTier("flagship");
                            } else {
                              setDeviceModel("Pixel 7a");
                              setDeviceTier("midrange");
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded p-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        >
                          <option value="Apple">Apple</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Google">Google</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="deviceModel" className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">Model Name</label>
                        <input
                          id="deviceModel"
                          name="deviceModel"
                          type="text"
                          value={deviceModel}
                          onChange={(e) => setDeviceModel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded p-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">Device Quality Class</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                        {(["flagship", "midrange", "budget"] as const).map((tier) => (
                          <button
                            key={tier}
                            onClick={() => setDeviceTier(tier)}
                            className={`text-[9px] font-bold py-1 rounded capitalize transition-all ${
                              deviceTier === tier 
                                ? "bg-blue-600 text-white shadow-sm font-extrabold" 
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">Hardware Diagnostic Target</label>
                      <div className="flex flex-col gap-1.5">
                        {(["screen", "battery", "button"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setIssueType(t)}
                            className={`text-[11px] font-semibold text-left px-3 py-2 rounded flex items-center justify-between border capitalize ${
                              issueType === t 
                                ? "bg-blue-900/40 border-blue-500 text-blue-200 font-bold" 
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            <span>{t} Assembly</span>
                            {issueType === t && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs indicators in Left Rail */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 font-mono">Active Lab Module</p>
                  <nav className="space-y-1">
                    <button
                      onClick={() => setLabTab("triage")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "triage" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        <span>AI Diagnostic Console</span>
                      </div>
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-mono ${
                        labTab === "triage" ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                      }`}>LV3</span>
                    </button>

                    <button
                      onClick={() => setLabTab("pos")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "pos" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>POS Ledger & Sync APIs</span>
                      </div>
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-mono ${
                        labTab === "pos" ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                      }`}>{tickets.length}</span>
                    </button>

                    <button
                      onClick={() => setLabTab("tax")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "tax" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>WA Tax Compliance Agent</span>
                      </div>
                      <span className="text-[10px] text-green-400 font-bold">100%</span>
                    </button>

                    <button
                      onClick={() => setLabTab("postgres")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "postgres" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span>AWS RDS Postgres (IAM)</span>
                      </div>
                      <span className="px-1.5 py-0.2 text-[9px] rounded font-mono bg-blue-905/40 text-blue-400 font-bold">
                        DB
                      </span>
                    </button>

                    <button
                      onClick={() => setLabTab("settings")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "settings" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-450" />
                        <span>Cache & SW Settings</span>
                      </div>
                      <span className="px-1.5 py-0.2 text-[9px] rounded font-mono bg-blue-955/40 text-blue-400 font-bold">
                        PORTAL
                      </span>
                    </button>

                    <button
                      onClick={() => setLabTab("comparison")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        labTab === "comparison" 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-amber-400" />
                        <span>Competitor Benchmarks</span>
                      </div>
                      <span className="px-1.5 py-0.2 text-[9px] rounded font-mono bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40">
                        VS
                      </span>
                    </button>
                  </nav>
                </div>

                {/* B2B FLEET Verification Frame */}
                <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800 mt-auto">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fast-Track B2B Verify</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 rounded">20% SLA</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                    Instant fleet validation checker by corporate email domain.
                  </p>
                  
                  <form onSubmit={handleVerifyB2B} className="mt-3 flex gap-1.5">
                    <label htmlFor="b2bEmailInput" className="sr-only">Fleet Corporate Email</label>
                    <input 
                      id="b2bEmailInput"
                      name="b2bEmailInput"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. marcus@amazon.com"
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs focus:outline-none text-white font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingEmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold font-mono transition-colors"
                    >
                      {isVerifyingEmail ? "..." : "CHECK"}
                    </button>
                  </form>

                  {b2bMessage && (
                    <div className={`mt-2.5 p-2 rounded text-[10px] leading-relaxed font-mono border ${
                      isCorporate 
                        ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-300" 
                        : "bg-amber-950/40 border-amber-900/50 text-amber-300"
                    }`}>
                      <div className="font-bold flex items-center gap-1">
                        {isCorporate ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {isCorporate ? "CORPORATE SLA LOCKED" : "RETAIL PRICING"}
                      </div>
                      <p className="mt-1 opacity-90 text-[9px] leading-normal">{b2bMessage}</p>
                    </div>
                  )}
                </div>

                 {/* Local Persistent Storage Backup Card */}
                <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Durable Offline Backup</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Persist diagnostic quotes and customer device state records locally in your browser's secure offline storage.
                  </p>
                  {authUser ? (
                    <button
                      type="button"
                      onClick={handleCreateLocalBackupTicket}
                      disabled={ticketCreationSuccess}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-md font-mono transition-all"
                    >
                      <Database className="w-3 h-3" />
                      Back up Quote
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLocalQuickLogin}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[10.5px] uppercase tracking-wider rounded-md font-mono transition-all"
                    >
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Quick Login to Backup
                    </button>
                  )}
                  {ticketCreationSuccess && (
                     <p className="text-[9px] text-emerald-400 font-bold font-mono tracking-wider text-center animate-bounce mt-1">
                       ✔️ BACKUP PERSISTED SECURELY
                     </p>
                  )}
                </div>
              </aside>

              {/* === CENTRAL ACTIVE PANEL: MODULE VIEWPORTS (Col-span 6) === */}
              <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                


                {/* AWS RDS POSTGRESQL DIAGNOSTIC PANEL */}
                {labTab === "postgres" && (
                  <RdsDiagnosticPanel />
                )}

                {/* LAB PORTAL SERVICE WORKER & CACHE STORAGE SETTINGS */}
                {labTab === "settings" && (
                  <CacheManagement onAddToast={addToast} />
                )}

                {/* COMPETITOR DIAGNOSTIC BENCHMARKS & GAP ANALYSIS CHART */}
                {labTab === "comparison" && (
                  <CompetitorComparisonChart />
                )}

                {/* 1. TRIAGE CHAT MODULE */}
                {labTab === "triage" && (
                  <section className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col flex-1 shadow-md overflow-hidden animate-in fade-in duration-200">
                    <div className="px-5 py-4 border-b border-slate-700/80 flex justify-between items-center bg-slate-850/45">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <h2 className="text-xs font-bold text-slate-250 tracking-wider uppercase font-mono">
                          Hardware Diagnostic Sandbox v3.5
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={clearChatLogs}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors uppercase font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-900"
                        >
                          Clear logs
                        </button>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-900/50 text-blue-300 tracking-wider border border-blue-800/30">
                          OPENAI CLUSTER
                        </span>
                      </div>
                    </div>

                    {/* Sub-modes selector tab bar */}
                    <div className="px-5 py-3 bg-slate-850/80 border-b border-slate-700/80 flex flex-wrap gap-2">
                      <button
                        onClick={() => setDiagnosticMode("standard")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all font-mono ${
                          diagnosticMode === "standard"
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/60"
                        }`}
                      >
                        📡 Standard (Grounding)
                      </button>
                      <button
                        onClick={() => setDiagnosticMode("thinking")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all font-mono flex items-center gap-1 ${
                          diagnosticMode === "thinking"
                            ? "bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md border border-violet-500/25"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/60"
                        }`}
                      >
                        🧠 Schematic Reasoning (High-Think)
                      </button>
                      <button
                        onClick={() => setDiagnosticMode("vision")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all font-mono flex items-center gap-1 ${
                          diagnosticMode === "vision"
                            ? "bg-emerald-600 text-white shadow-md border border-emerald-500/25"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/60"
                        }`}
                      >
                        📸 Photo Vision Analyst
                      </button>
                    </div>

                    {/* CHANNEL CONTENT CONDITIONALS */}
                    {diagnosticMode === "standard" && (
                      <>
                        {/* Chat Messages Frame */}
                        <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-[350px] max-h-[480px] bg-slate-900/40">
                          {messages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              {msg.role === "assistant" && (
                                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-800 flex items-center justify-center shrink-0 text-blue-400 font-bold text-[10px] shadow-sm font-mono">
                                  LAB
                                </div>
                              )}
                              <div className={`p-4 rounded-xl max-w-[85%] leading-relaxed ${
                                msg.role === "user" 
                                  ? "bg-blue-600 text-white rounded-tr-none shadow-sm text-xs font-medium" 
                                  : "bg-slate-800 border border-slate-700 rounded-tl-none shadow-3xs text-xs font-mono text-slate-200"
                              }`}>
                                {msg.role === "assistant" && (
                                  <p className="text-[9px] uppercase font-extrabold text-blue-400 opacity-80 tracking-wider mb-2 select-none border-b border-slate-700 pb-1 font-mono">
                                    [AI DIAGNOSTIC PROXY LOG]
                                  </p>
                                )}
                                <p className="whitespace-pre-line text-xs">{msg.text}</p>
                              </div>
                            </div>
                          ))}

                          {isChatSending && (
                            <div className="flex gap-3.5 justify-start">
                              <div className="w-8 h-8 rounded-lg bg-blue-955/80 flex items-center justify-center shrink-0 font-mono shadow-inner animate-pulse">
                                ...
                              </div>
                              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-xs text-slate-400 italic">
                                <span className="flex items-center gap-2 font-mono text-[10px] animate-pulse">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                  </span>
                                  ANALYZING GOOGLE SEARCH GROUNDING DATA SOURCES...
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Grounding Citations rendering */}
                        {groundingSources.length > 0 && (
                          <div className="px-5 py-3 border-t border-slate-750 bg-slate-900/50">
                            <span className="text-[9px] text-blue-450 uppercase font-extrabold font-mono tracking-widest block mb-1.5">
                              🌐 GOOGLE SEARCH GROUNDING SOURCES USED:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {groundingSources.map((source, index) => (
                                <a 
                                  key={index}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9.5px] font-mono text-blue-400 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded px-2 py-0.5 flex items-center gap-1 transition-all"
                                >
                                  <Info className="w-2.5 h-2.5" />
                                  <span>{source.title.length > 30 ? source.title.substring(0, 30) + "..." : source.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick benchmarking diagnostics triggers */}
                        <div className="p-3 border-t border-slate-700/80 bg-slate-850/60 flex flex-wrap gap-2 items-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold font-mono tracking-wider mr-1">Bench Targets:</span>
                          <button
                            onClick={(e) => handleSendTriageChat(e, "Screen contains horizontal flickering pink lines under diagnostic lighting and lacks vertical calibration.")}
                            className="text-[10px] bg-slate-900 border border-slate-755 hover:border-slate-600 text-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-950 transition-colors shadow-2xs"
                          >
                            📟 Pink OLED Panel
                          </button>
                          <button
                            onClick={(e) => handleSendTriageChat(e, "Battery swollen, battery capacity reports 74% cycle health and it drains 50% in 15 minutes.")}
                            className="text-[10px] bg-slate-900 border border-slate-755 hover:border-slate-600 text-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-950 transition-colors shadow-2xs"
                          >
                            🔋 Swollen Battery
                          </button>
                          <button
                            onClick={(e) => handleSendTriageChat(e, "Power button was exposed to cola and is permanently stuck. No metallic feedback.")}
                            className="text-[10px] bg-slate-900 border border-slate-755 hover:border-slate-600 text-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-950 transition-colors shadow-2xs"
                          >
                            🔘 stuck Button
                          </button>
                        </div>

                        {/* Chat interactive panel */}
                        <div className="p-4 border-t border-slate-700 bg-slate-850/45">
                          <form onSubmit={handleSendTriageChat} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                            <label htmlFor="triageChatInput" className="sr-only">Diagnostic message description</label>
                            <input 
                              id="triageChatInput"
                              name="triageChatInput"
                              type="text" 
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Describe screen flashes, digitizer skips, or battery drain behaviors for Seattle/Spokane local Repairs..." 
                              className="flex-1 bg-transparent border-none text-xs px-2 focus:ring-0 focus:outline-none text-white placeholder-slate-500 font-mono"
                              disabled={isChatSending}
                            />
                            <button 
                              type="submit"
                              disabled={isChatSending || !chatInput.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-colors"
                            >
                              {isChatSending ? "DIAGNOSING" : "RUN"}
                            </button>
                          </form>
                          <div className="flex items-center gap-2 mt-2 px-1 justify-between text-[9px] text-slate-500 font-mono">
                            <span>Google Grounded live query mode active. Spokane-focused local indexes applied.</span>
                          </div>
                        </div>
                      </>
                    )}

                    {diagnosticMode === "thinking" && (
                      <div className="p-5 flex-1 flex flex-col gap-4 min-h-[350px] bg-slate-900/10">
                        <div>
                          <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest font-mono block mb-1">
                            🧠 COGNITIVE REASONING MATRIX (Model: OpenAI o3-mini / GPT-4o)
                          </span>
                          <h3 className="text-sm font-bold text-white">Advanced Electrical Schematic Diagnostic Planner</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                            Queries are dispatched to the <strong className="text-violet-400 font-bold">OpenAI o3-mini</strong> reasoning model to construct step-by-step motherboard test steps with voltage tolerances.
                          </p>
                        </div>

                        <form onSubmit={handleRunThinkingDiagnostic} className="space-y-3">
                          <label htmlFor="thinkingPrompt" className="block text-[10px] text-slate-450 uppercase font-bold font-mono tracking-wider">Troubleshooting directive</label>
                          <textarea
                            id="thinkingPrompt"
                            name="thinkingPrompt"
                            value={thinkingPrompt}
                            onChange={(e) => setThinkingPrompt(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            placeholder="State circuit symptoms, ribbon line specs, short circuit behaviors to plan electrical audits..."
                          />
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isDeepDiagnosing || !thinkingPrompt.trim()}
                              className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono bg-gradient-to-r from-violet-650 ... to-indigo-600 hover:from-violet-550 hover:to-indigo-500 text-white disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 transition-all shadow-md"
                            >
                              {isDeepDiagnosing ? "THINKING PROCESS CHANNELS ACTIVE..." : "DISPATCH COGNITIVE SOLVER"}
                            </button>
                          </div>
                        </form>

                        {deepDiagnosticResult && (
                          <div className="mt-4 bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-indigo-300 shadow-inner max-h-[280px] overflow-y-auto">
                            <div className="text-[9px] text-violet-400 font-extrabold border-b border-slate-850 pb-2 mb-2 uppercase tracking-widest flex justify-between items-center">
                              <span>[SCHEMATIC DISCHARGE GRAPH]</span>
                              <span className="text-slate-505 font-medium">THINKING_LEVEL_HIGH</span>
                            </div>
                            <p className="whitespace-pre-line text-slate-300 font-serif leading-relaxed text-xs">{deepDiagnosticResult}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {diagnosticMode === "vision" && (
                      <div className="p-5 flex-1 flex flex-col gap-4 min-h-[350px] bg-slate-900/10">
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono block mb-1">
                            📸 MULTIMODAL COMPUTER VISION LAB (Model: OpenAI GPT-4o)
                          </span>
                          <h3 className="text-sm font-bold text-white">Visual Mechanical/Fracture Pattern Audit</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                            Upload high-definition closeups of smartphones, bloated cells, stuck power triggers, or oxidized motherboards to compute visual defect check lists.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all relative">
                            <label htmlFor="triageImageUpload" className="sr-only">Upload device photo for mechanical audit</label>
                            <input
                              id="triageImageUpload"
                              name="triageImageUpload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUploadChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-8 h-8 text-slate-500 mb-2" />
                            <p className="text-xs font-bold text-slate-300">
                              {selectedImageName ? `Photo Selected: ${selectedImageName}` : "Click / Drag photo here"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">[Accepted format: images only]</p>
                          </div>

                          <div className="bg-slate-955/80 rounded-xl p-3 border border-slate-800 flex items-center justify-center min-h-[140px]">
                            {selectedImageBase64 ? (
                              <img
                                src={`data:image/png;base64,${selectedImageBase64}`}
                                alt="Hardware diagnostic preview"
                                referrerPolicy="no-referrer"
                                className="max-h-[130px] rounded-lg shadow-md border border-slate-800 object-contain"
                              />
                            ) : (
                              <div className="text-center text-slate-500 font-mono text-[9px] uppercase tracking-widest leading-loose">
                                [Preview Screen empty]
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          {selectedImageBase64 && (
                            <button
                              onClick={() => {
                                setSelectedImageBase64(null);
                                setSelectedImageName("");
                                setDeepDiagnosticResult("");
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold font-mono transition-colors uppercase"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={handleVisionDiagnostic}
                            disabled={isDeepDiagnosing || !selectedImageBase64}
                            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all shadow-md"
                          >
                            {isDeepDiagnosing ? "PROBING GEOMETRIC MESH..." : "EXECUTE COMPUTER VISION AUDIT"}
                          </button>
                        </div>

                        {deepDiagnosticResult && (
                          <div className="mt-4 bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-300 shadow-inner max-h-[250px] overflow-y-auto">
                            <div className="text-[9px] text-emerald-400 font-extrabold border-b border-slate-850 pb-2 mb-2 uppercase tracking-widest mb-2 font-mono">
                              [VISUAL AUDIT RESULT LOG]
                            </div>
                            <p className="whitespace-pre-line text-xs font-serif leading-relaxed text-slate-200">{deepDiagnosticResult}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* 2. POS API SYNC MODULE */}
                {labTab === "pos" && (
                  <section className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col flex-1 shadow-md p-5">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <div>
                          <h2 className="text-sm font-bold text-white uppercase tracking-tight">Active POS Sync Ledger</h2>
                          <p className="text-xs text-slate-400">Continuous operational loop for Square webhook and CellSmart registries.</p>
                        </div>
                      </div>
                      <button 
                        onClick={fetchPOSLogs}
                        disabled={isLoadingLogs}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-755 hover:bg-slate-950 text-slate-200 rounded-md text-xs font-semibold tracking-wide transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
                        Sync Records
                      </button>
                    </div>

                    <div className="mb-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-extrabold text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-400" /> 
                          Square & CellSmart Registry 
                          <span className="bg-emerald-900/50 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-800/40">
                            {tickets.length} ACTIVE
                          </span>
                        </h3>
                        <button
                          onClick={createOfficialTicket}
                          disabled={ticketCreationSuccess}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1 text-[11px] font-bold uppercase transition-all flex items-center gap-1 shadow-sm active:scale-98"
                        >
                          <Plus className="w-3 h-3" />
                          New Quick Ticket
                        </button>
                      </div>

                      {ticketCreationSuccess && (
                        <div className="p-3 bg-emerald-950/70 border border-emerald-900 text-emerald-300 text-xs rounded-lg mb-3 flex items-center gap-2 font-mono">
                          <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                          <span>SUCCESS: Webhook payload transmitted. Ticket registered to synchronized local schema.</span>
                        </div>
                      )}

                      <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900 shadow-inner flex-1 max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950/80 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-700 select-none">
                              <th className="p-3">Ticket ID</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Device & Target</th>
                              <th className="p-3">Sustained Cost</th>
                              <th className="p-3">SLA Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-900/30 font-mono text-[10.5px]">
                            {tickets.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-3 font-semibold text-blue-400 font-bold">{t.id}</td>
                                <td className="p-3 font-sans">
                                  <div className="font-bold text-slate-205">{t.customerName}</div>
                                  <div className="text-[9px] text-slate-500 capitalize">{t.companyName || "Retail Client"}</div>
                                </td>
                                <td className="p-3 font-sans">
                                  <p className="font-semibold text-slate-300 text-[11px]">{t.device}</p>
                                  <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    t.issueType === "screen" ? "bg-amber-950 text-amber-300 border border-amber-900/30" :
                                    t.issueType === "battery" ? "bg-purple-950 text-purple-300 border border-purple-900/30" : "bg-blue-950 text-blue-300 border border-blue-900/30"
                                  }`}>
                                    {t.issueType}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-200">
                                  <div className="font-bold">${t.total.toFixed(2)}</div>
                                  <div className="text-[9px] text-emerald-400 font-normal">Disc: -${t.discount.toFixed(2)}</div>
                                </td>
                                <td className="p-3 uppercase font-bold text-[8.5px]">
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    t.status === "completed" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                                    t.status === "quality_check" ? "bg-amber-950 text-amber-400 border border-amber-900" :
                                    t.status === "technician_working" ? "bg-blue-950 text-blue-400 border border-blue-900" : "bg-slate-950 text-slate-400 border border-slate-900"
                                  }`}>
                                    {t.status.replace("_", " ")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Durable Local Backups (Offline Vault) */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3 border-t border-slate-700/80 pt-5">
                        <h3 className="text-xs font-extrabold text-blue-350 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                          <Database className="w-4 h-4 text-emerald-450" />
                          Durable Local Backups (Offline Vault)
                          {authUser && (
                            <span className="bg-emerald-950/50 text-emerald-300 text-[10px] px-1 py-0.5 rounded font-mono font-bold border border-emerald-800/40">
                              {localBackupTickets.length} BACKUPS
                            </span>
                          )}
                        </h3>
                        {authUser && (
                          <button
                            onClick={() => fetchLocalBackupTickets(authUser.uid)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded border border-slate-800 hover:border-slate-700 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                            title="Refresh backups list from Local Storage"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-400" />
                            Refresh
                          </button>
                        )}
                      </div>

                      {isAuthChecking ? (
                        <div className="text-center p-5 font-mono text-[11px] text-slate-400">Loading simulated session...</div>
                      ) : authUser ? (
                        localBackupTickets.length === 0 ? (
                          <div className="bg-slate-900 border border-slate-850 rounded-lg p-5 text-center font-mono text-[11px] text-slate-400">
                            [System notice: No ticket backups stored for user {authUser.displayName || authUser.email} in the local offline vault yet. Run 'Back up Quote' in the sidebar panel to write to the persistent local database.]
                          </div>
                        ) : (
                          <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-950 shadow-inner max-h-[220px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-800">
                                  <th className="p-3">Local Ref</th>
                                  <th className="p-3">Device Target</th>
                                  <th className="p-3">Grand Total</th>
                                  <th className="p-3">Backup Date</th>
                                  <th className="p-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 font-mono text-[10.5px]">
                                {localBackupTickets.map((ft) => (
                                  <tr key={ft.id} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="p-3 font-semibold text-emerald-400 flex items-center gap-1">
                                      <Database className="w-3 h-3 text-emerald-500" />
                                      <span>{ft.id}</span>
                                    </td>
                                    <td className="p-3 text-slate-300 font-sans">
                                      {ft.device}
                                      <div className="text-[9px] text-slate-500 uppercase mt-0.5">{ft.issueType}</div>
                                    </td>
                                    <td className="p-3 text-white font-bold">
                                      ${ft.total.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-slate-400 text-[10px]">
                                      {new Date(ft.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleDeleteLocalBackupTicket(ft.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                                        title="Delete backup from local storage"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : (
                        <div className="bg-slate-900/65 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-400 leading-relaxed">
                          <p className="font-sans mb-4 text-center text-xs">Unlock persistent multi-device sync, cloud billing pipelines, and custom Spokane service backups.</p>
                          
                          {/* Email & Password Authentication Form */}
                          <form onSubmit={isSignUpMode ? handleEmailSignUp : handleEmailSignIn} className="space-y-3 mb-4 bg-slate-950 p-4 rounded-lg border border-slate-850/80">
                            <div className="text-[10px] font-bold text-blue-450 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-blue-400 font-bold" />
                              <span>{isSignUpMode ? "Create New Account" : "Sign In with Email"}</span>
                            </div>
                            
                            <div>
                              <label htmlFor="authEmail" className="block text-[9px] text-slate-500 uppercase font-bold mb-1 font-mono">Email Address</label>
                              <input
                                id="authEmail"
                                type="email"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-[1px] focus:outline-blue-500 font-mono"
                                required
                                disabled={isAuthLoading}
                              />
                            </div>

                            <div>
                              <label htmlFor="authPassword" className="block text-[9px] text-slate-500 uppercase font-bold mb-1 font-mono">Password</label>
                              <div className="relative">
                                <input
                                  id="authPassword"
                                  type={showPassword ? "text" : "password"}
                                  value={formPassword}
                                  onChange={(e) => setFormPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full bg-slate-900 border border-slate-800 rounded pl-2.5 pr-10 py-1.5 text-xs text-slate-200 focus:outline-[1px] focus:outline-blue-500 font-mono"
                                  required
                                  minLength={6}
                                  disabled={isAuthLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none flex items-center justify-center p-1 rounded hover:bg-slate-800 transition-colors"
                                  title={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isAuthLoading}
                              className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {isAuthLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{isSignUpMode ? "Register Account" : "Sign In"}</span>
                            </button>

                            <div className="text-center mt-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSignUpMode(!isSignUpMode);
                                  setShowPassword(false);
                                }}
                                className="text-[10px] text-slate-400 hover:text-blue-400 underline font-sans transition-colors"
                              >
                                {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                              </button>
                            </div>
                          </form>

                          {/* Divider */}
                          <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-850"></div>
                            <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
                            <div className="flex-grow border-t border-slate-850"></div>
                          </div>

                          {/* Quick Bypass Login */}
                          <div className="mt-3 text-center">
                            <button
                              type="button"
                              onClick={handleLocalQuickLogin}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-[10.5px] font-bold uppercase tracking-wider rounded-lg shadow-md font-mono inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Quick Bypass Login
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sync logs console */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        POS Webhook Transaction Logs
                      </h3>
                      
                      <div className="bg-slate-950 text-slate-300 font-mono text-[10.5px] p-3.5 rounded-xl border border-slate-800 space-y-2 max-h-[150px] overflow-y-auto shadow-inner leading-relaxed">
                        {posLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-2 hover:bg-slate-900 rounded p-1 transition-colors">
                            <span className="text-slate-500 text-[9px]">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className={`font-extrabold text-[8.5px] px-1 rounded uppercase ${
                              log.source === "Square" ? "bg-pink-950/80 text-pink-350 border border-pink-905" : 
                              log.source === "CellSmart" ? "bg-purple-950/80 text-purple-350 border border-purple-905" : "bg-emerald-950 text-emerald-350"
                            }`}>
                              {log.source}
                            </span>
                            <span className={`font-bold ${
                              log.level === "ERROR" ? "text-red-400" : log.level === "SUCCESS" ? "text-emerald-400" : "text-blue-300"
                            }`}>
                              [{log.level}]
                            </span>
                            <span className="text-slate-350">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* 3. TAX COMPLIANCE CONSOLE */}
                {labTab === "tax" && (
                  <section className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col flex-1 shadow-md p-5">
                    <div className="flex items-center gap-2 border-b border-slate-700 pb-4 mb-4">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-tight">WA Destination Tax compliance</h2>
                        <p className="text-xs text-slate-400">
                          Washington Right-to-Repair destination-based tax calculations based on device delivery site.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-5 mb-5 flex-1 items-stretch">
                      <div className="col-span-12 md:col-span-5 space-y-4 flex flex-col justify-between">
                        <div className="bg-slate-900 border border-slate-755 rounded-lg p-4 space-y-4 shadow-inner">
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Rate Resolver</h3>
                          <div>
                            <label htmlFor="waDestinationZip" className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5 font-mono">WA DESTINATION ZIP</label>
                            <div className="flex gap-2">
                              <input 
                                id="waDestinationZip"
                                name="waDestinationZip"
                                type="text" 
                                maxLength={5}
                                value={zipInput} 
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setZipInput(val);
                                }}
                                className="bg-slate-950 border border-slate-800 text-white rounded px-3 py-1.5 text-xs font-bold font-mono tracking-widest w-28 text-center"
                                placeholder="98101"
                              />
                              <button
                                onClick={() => handleTaxLookup(zipInput)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 text-xs font-bold tracking-wide uppercase transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          </div>

                          {taxVerifiedMessage && (
                            <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                              isValidZip 
                                ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-300" 
                                : "bg-amber-950/40 border-amber-900/50 text-amber-300"
                            }`}>
                              <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-[9.5px] font-mono">
                                {isValidZip ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />}
                                TAX SIGNAL
                              </div>
                              <p className="font-mono text-[10.5px] leading-normal">{taxVerifiedMessage}</p>
                            </div>
                          )}
                        </div>

                        {/* Presets Grid */}
                        <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-lg">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2 font-mono">Washington Presets</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {WA_ZIP_PRESETS.map((preset) => (
                              <button
                                key={preset.zip}
                                onClick={() => {
                                  setZipInput(preset.zip);
                                }}
                                className={`text-[10.5px] font-mono p-2 text-left border rounded transition-all leading-snug ${
                                  zipInput === preset.zip 
                                    ? "bg-blue-900/40 border-blue-500 text-blue-200 font-bold shadow-md" 
                                    : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-350"
                                }`}
                              >
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-sans font-bold">{preset.city}</span>
                                  <span className="text-slate-500 text-[9px]">{preset.zip}</span>
                                </div>
                                <p className="text-[10px] text-blue-400 font-extrabold mt-0.5">{preset.rate}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* WA GEOLOCATION SVG MAP */}
                      <div className="col-span-12 md:col-span-7 flex flex-col items-center justify-center border border-dashed border-slate-700/80 rounded-xl bg-slate-900/40 p-4 relative">
                        <div className="absolute top-2.5 left-2.5 bg-slate-950 px-2.5 py-0.5 border border-slate-800 text-[8.5px] font-bold text-slate-400 rounded tracking-widest font-mono">
                          REGIONAL RATE RESOLVER GEOMAP
                        </div>

                        <svg viewBox="0 0 400 250" className="w-full max-w-[320px] text-slate-500 mt-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 50 L250 50 L270 120 L370 120 L380 230 L100 230 L50 210 L45 150 L20 130 Z" className="fill-slate-950/70 stroke-slate-700 stroke-2" />
                          <path d="M20 50 Q 0 80, 20 120 T 50 160 T 50 210" className="stroke-blue-500/40 stroke-2" strokeDasharray="3 3" />
                          <path d="M120 50 L125 230 M150 50 L155 230" className="stroke-slate-800/40 stroke-2" strokeDasharray="5 5" />
                          
                          {/* Pins */}
                          <g>
                            <circle cx="95" cy="95" r="5" className="fill-blue-500 animate-pulse" />
                            <text x="105" y="93" className="text-[9.5px] font-bold font-mono fill-slate-200" fontSize="9">Seattle (10.35%)</text>
                          </g>
                          <g>
                            <circle cx="112" cy="100" r="4" className="fill-blue-400" />
                            <text x="120" y="105" className="text-[8.5px] font-semibold fill-slate-400" fontSize="8">Bellevue (10.1%)</text>
                          </g>
                          <g>
                            <circle cx="85" cy="142" r="4" className="fill-cyan-500" />
                            <text x="50" y="152" className="text-[8.5px] font-semibold fill-slate-405" fontSize="8">Olympia (9.5%)</text>
                          </g>
                          <g>
                            <circle cx="340" cy="100" r="4" className="fill-blue-600" />
                            <text x="270" y="98" className="text-[8px] font-mono fill-slate-500" fontSize="8">Spokane (9.0%)</text>
                          </g>
                          <g>
                            <circle cx="90" cy="210" r="4" className="fill-slate-700" />
                            <text x="98" y="214" className="text-[8px] fill-slate-500" fontSize="8">Vancouver (8.7%)</text>
                          </g>
                        </svg>
                        
                        <div className="text-center mt-3">
                          <p className="text-[11px] font-bold text-slate-200 font-mono">Active Delivery Destination Target: <span className="text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{taxCity} ({zipInput})</span></p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
                            Washington destination rules enforce calculating rates according to target shipping site.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}



              </div>

              {/* === RIGHT COLUMN: LIVE QUOTER & POS LEDGER (Col-span 3) === */}
              <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                
                {/* Live Quoter Panel */}
                <section className="bg-slate-850/60 border border-slate-800 rounded-xl p-5 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 select-none">
                    <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      Live Quote Summary
                    </h3>
                    <span className="bg-slate-950 text-slate-400 text-[9px] px-1.5 py-0.2 rounded font-mono border border-slate-800">V3.5 LAB</span>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    
                    <div className="text-[11px] p-2.5 bg-slate-950 rounded border border-slate-850 text-slate-300 block leading-tight">
                      <span className="font-bold block text-white text-[9px] uppercase tracking-wider mb-0.5">🛠️ Config Target</span>
                      {deviceBrand} {deviceModel} ({deviceTier}) - {issueType} Repair
                    </div>

                    {isCalculatingQuote ? (
                      <div className="py-6 text-center text-slate-500 italic text-[11px]">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto text-blue-500 mb-2" />
                        CALCULATING LAB LABOR TIER OUTCOME...
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-[11px]">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Parts Base Cost</span>
                          <span className="text-white">${quote.baseQuote.partsCost.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-slate-400">
                          <span>L3 Mobile Labor Rate</span>
                          <span className="text-white">${quote.baseQuote.laborCost.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-550 text-[10px]">
                          <span>Lab Overlay margin (15%)</span>
                          <span>${quote.baseQuote.overhead.toFixed(2)}</span>
                        </div>

                        <div className="h-[1px] bg-slate-800/80 my-2"></div>

                        <div className="flex justify-between items-center font-semibold text-slate-300">
                          <span>Wholesale Baseline</span>
                          <span className="text-white">${(quote.baseQuote.partsCost + quote.baseQuote.laborCost + quote.baseQuote.overhead).toFixed(2)}</span>
                        </div>

                        {quote.discountInfo.applied && (
                          <div className="flex justify-between items-center text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded">
                            <span>B2B Fleet Disc (20%)</span>
                            <span>-${quote.discountInfo.amount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-slate-400">
                          <span>Dest Tax ({quote.taxInfo.city || "WA"})</span>
                          <span>
                            {quote.taxInfo.rate > 0 ? `${(quote.taxInfo.rate * 100).toFixed(2)}%` : "0%"} 
                            {" "}(+${quote.taxInfo.calculatedTax.toFixed(2)})
                          </span>
                        </div>

                        <div className="h-[1px] bg-slate-700 my-2"></div>

                        <div className="flex justify-between items-baseline py-1">
                          <span className="font-bold text-slate-300 text-xs">TOTAL DUE</span>
                          <span className="font-extrabold text-blue-400 text-xl tracking-tight">
                            ${quote.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    <button 
                      onClick={createOfficialTicket}
                      disabled={ticketCreationSuccess}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-md active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span>TRANSMIT POS WEBHook</span>
                    </button>
                    <div className="text-[9.5px] text-center text-slate-500 font-mono leading-relaxed mt-1 select-none">
                      *Coordinates automatically sync with physical CellSmart monitors inside mobile van.
                    </div>
                  </div>
                </section>

                {/* B2B Status detail */}
                <section className="bg-blue-700 rounded-xl p-5 text-white flex-1 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-white animate-bounce" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">B2B Agreement State</h3>
                    </div>

                    {isCorporate ? (
                      <div className="space-y-3 font-mono">
                        <div>
                          <p className="text-[9px] text-blue-200">ACTIVE FLEET PARTNER</p>
                          <p className="text-sm font-bold tracking-tight">{companyName || "AMAZON SEATTLE OPERATIONS"}</p>
                        </div>
                        <div className="space-y-2 pt-2 text-[11px] leading-snug">
                          <div className="flex justify-between opacity-90">
                            <span>Diagnostic Sched SLA:</span>
                            <span className="font-bold">2.4Hrs Max</span>
                          </div>
                          <div className="flex justify-between opacity-90">
                            <span>Contract Deposit:</span>
                            <span className="font-bold text-white bg-blue-900 px-1.5 py-0.2 rounded text-[9.5px]">0% DEPOSIT</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <p className="text-blue-100 leading-relaxed text-[11.5px]">
                          Operating under client retail pricing terms. Check in with business domain (e.g., <code>boeing.com</code> or <code>amazon.com</code>) to unlock Net-30 checkin and priority rapid dispatch.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-auto">
                    <div className="flex justify-between font-mono text-[9px] mb-1.5 font-bold tracking-wider opacity-85">
                      <span>SLA DISPATCH DISCIPLINE</span>
                      <span>100% HEALTH</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-white rounded-full"></div>
                    </div>
                  </div>
                </section>

                {/* Handshake Credentials Checkbox */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono shadow-xs">
                  <span className="font-extrabold text-slate-300 uppercase tracking-widest block mb-2 text-[10px]">Square POS Handshake</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-[10.5px] text-slate-400 space-y-1 font-mono leading-relaxed">
                    <div className="flex justify-between">
                      <span>SQUARE_WEB_HOOK:</span>
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CELLSMART_LINK:</span>
                      <span className="text-emerald-400 font-bold">READY</span>
                    </div>
                  </div>
                </div>

                {/* Offline-Capable Diagnostic Ticket Templates */}
                <TicketTemplatesPanel onApplyTemplate={handleApplyTemplate} />
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4 cursor-pointer" onClick={() => setActiveTab("home")}>
                <Wrench className="h-6 w-6 text-blue-500 mr-2" />
                <span className="font-bold text-lg text-white">Display & Cell Pros LLC</span>
              </div>
              <p className="text-sm text-slate-400 mb-4 max-w-sm leading-relaxed">
                Spokane's premier mobile technical service laboratory. Combat-veteran owned, operating in strict compliance with Washington State's Right to Repair laws.
              </p>
              <div className="flex items-center text-sm text-slate-400 gap-2 font-medium">
                <ShieldCheck size={16} className="text-green-500"/> Fully Insured, Bonded & Certified
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4 font-mono">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><Phone size={14}/> 509-903-6139</li>
                <li className="flex items-center gap-2"><MapPin size={14}/> Mobile Service: Spokane & Valley</li>
                <li className="flex items-center gap-2"><Clock size={14}/> Mon-Sat: 8am - 6pm</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4 font-mono">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>WA UBI: 605 985 265</li>
                <li>NAICS: 811210</li>
                <li>
                  <button 
                    onClick={() => {
                      setActiveTab("privacy");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }} 
                    className="hover:text-blue-400 transition-colors text-left font-medium cursor-pointer"
                  >
                    Privacy & Data Policy
                  </button>
                </li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Liability Waiver</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-850 pt-5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <div>
              &copy; {new Date().getFullYear()} Display & Cell Pros LLC. All rights reserved.
            </div>
            
            {/* Live webhook footer telemetry flags */}
            <div className="flex gap-4 items-center select-none font-mono text-[9.5px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                CELLSMART HUB: CONNECTED
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Check className="w-3 h-3 text-emerald-500" />
                SQUARE WEBHOOKS: READY
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Embedded Intelligent Chat Widget Overlay */}
      {isAiOpen && (
        <AIAssistantWidget 
          onClose={() => setIsAiOpen(false)} 
          onNavigateToLab={() => {
            setActiveTab("lab");
            setLabTab("triage");
            setIsAiOpen(false);
          }}
          deviceBrand={deviceBrand}
          deviceModel={deviceModel}
          deviceTier={deviceTier}
          issueType={issueType}
          onUpdateSpecs={(specs) => {
            if (specs.brand) setDeviceBrand(specs.brand);
            if (specs.model) setDeviceModel(specs.model);
            if (specs.tier) setDeviceTier(specs.tier);
            if (specs.issue) setIssueType(specs.issue);
          }}
        />
      )}
      
      {/* Floating Action Button for AI triage launcher */}
      {!isAiOpen && (
        <button 
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 hover:bg-blue-500 hover:scale-105 transition-all z-40 group"
        >
          <MessageSquare className="text-white h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </button>
      )}

      {/* QR Code Label Scanner Component */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={(serial, brand, model) => {
          setDeviceSerial(serial);
          if (brand) {
            setDeviceBrand(brand);
            if (brand === "Apple") {
              setDeviceTier("flagship");
            } else if (brand === "Samsung") {
              setDeviceTier("flagship");
            } else {
              setDeviceTier("midrange");
            }
          }
          if (model) {
            setDeviceModel(model);
          }
          setIsQrScannerOpen(false);
          addToast(
            "Hardware Scan Succeeded",
            `Serial code "${serial}" has been mapped to active diagnostics panel.`,
            "success"
          );
        }}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Global Authentication Transition Overlay */}
      <AuthLoadingOverlay isLoading={isAuthLoading} />
    </div>
  );
}

// --- SUB-VIEWS ---

function HomeView({ onBookClick, onLabClick }) {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-850">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=1920&q=80" 
            alt="Mobile Repair Tech" 
            className="w-full h-full object-cover opacity-25"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Mobile Lab Currently Deploying in Spokane
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              We bring the repair lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">to your driveway.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
              Don't waste your day in a waiting room. Display & Cell Pros delivers military-grade, Right-to-Repair compliant technical restorations directly to your home or office.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onBookClick}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                Get an Instant Quote <ChevronRight size={20} />
              </button>
              <button 
                onClick={onLabClick}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Open Lab Portal <Cpu size={20} className="text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">The D&CP Advantage</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">We combine premium parts with unparalleled convenience, operating entirely out of our mobile diagnostic laboratory.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MapPin className="text-blue-400 w-10 h-10 mb-4" />}
            title="Zero Travel Time"
            desc="You book. We drive. Our technicians perform the surgery securely inside our mobile workshop parked outside your location."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-blue-400 w-10 h-10 mb-4" />}
            title="Data Security Guarantee"
            desc="Your device never leaves your sight. Avoid the massive cybersecurity risks associated with mail-in or drop-off retail repairs."
          />
          <FeatureCard 
            icon={<Cpu className="text-blue-400 w-10 h-10 mb-4" />}
            title="Right-to-Repair Compliant"
            desc="We use only genuine-sourced and premium aftermarket components, backed by strict quality control and a robust warranty."
          />
        </div>
      </div>
    </div>
  );
}

function ServicesView({ onBookClick }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-white mb-4">Our Service Architecture</h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto">Transparent, formula-based pricing. No hidden fees. We calculate costs based on wholesale part prices plus professional mobile labor overhead.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {SERVICES.map((srv, idx) => (
          <div key={idx} className="bg-slate-800/80 rounded-2xl border border-slate-705 p-8 hover:border-blue-500/50 transition-all flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            
            <div className="mb-6">{srv.icon}</div>
            <div className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-2 font-mono">{srv.tier}</div>
            <h3 className="text-2xl font-bold text-white mb-3">{srv.title}</h3>
            <p className="text-slate-300 mb-6 flex-grow">{srv.desc}</p>
            
            <div className="bg-slate-900/80 rounded-lg p-4 mb-8 border border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-mono">Estimated Baseline</div>
              <div className="text-2xl font-bold text-white">{srv.price}</div>
              <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-350">Includes:</span> {srv.examples}
              </div>
            </div>

            <button 
              onClick={onBookClick}
              className="w-full py-3 bg-slate-700 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Start Diagnostic Triage
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function B2BView({ onBookClick }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-705 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-10 lg:p-16 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 w-max font-mono">
              <Briefcase size={14} /> Corporate Fleet Partners
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-6">Corporate IT Fleet Maintenance</h2>
            <p className="text-slate-300 mb-8 leading-relaxed text-base">
              When a device breaks, standard retail repair shops require your employees to leave their deployment area, resulting in significant administrative downtime. D&CP brings the lab to your job site.
            </p>
            
            <ul className="space-y-5 mb-10 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">15% Preferred Corporate Discount</strong>
                  <span className="text-xs text-slate-400">Applied automatically to all Tier 1 and Tier 2 repairs for registered partners (HVAC, Real Estate, Delivery fleets).</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">Prioritized Dispatch</strong>
                  <span className="text-xs text-slate-400">Skip the standard queue. Business critical devices get priority routing.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">Net-30 Invoicing</strong>
                  <span className="text-xs text-slate-400">Eliminate employee out-of-pocket expenses with consolidated monthly billing.</span>
                </div>
              </li>
            </ul>

            <button 
              onClick={onBookClick}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-lg font-bold transition-colors"
            >
              Apply for Fleet Account
            </button>
          </div>
          
          <div className="relative min-h-[300px] lg:min-h-full hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80" 
              alt="Corporate IT" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Logistics & Supply</h1>
          <p className="text-slate-400 mt-2">Premium Gear & Certified Pre-Owned Devices</p>
        </div>
        <div className="hidden sm:flex items-center text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
          <ShoppingCart size={18} className="mr-2 text-blue-400" />
          <span className="text-sm font-semibold">Cart (0)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STORE_PRODUCTS.map(product => (
          <div key={product.id} className="bg-slate-800 rounded-xl border border-slate-705 overflow-hidden group flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-xs font-bold px-2 py-1 rounded text-slate-300">
                {product.category}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{product.name}</h3>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-blue-400">${product.price.toFixed(2)}</span>
                <button className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- EMBEDDED INTEGRATED AI ASSISTANT WIDGET (OPENAI INTERACTIVE AGENT) ---

interface AIAssistantProps {
  onClose: () => void;
  onNavigateToLab: () => void;
  deviceBrand: string;
  deviceModel: string;
  deviceTier: string;
  issueType: string;
  onUpdateSpecs?: (specs: any) => void;
}

function AIAssistantWidget({ 
  onClose, 
  onNavigateToLab, 
  deviceBrand, 
  deviceModel, 
  deviceTier, 
  issueType,
  onUpdateSpecs 
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai" | "system"; text: string }>>([
    { sender: 'ai', text: "Welcome to Display & Cell Pros Mobile Triage Hub! 🚐💨 Seattle and Spokane's top driveway raw hardware lab on wheels. What device issues can we solve for you today?" }
  ]);
  const [input, setInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    
    const userMsgText = input.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMsgText }]);
    setInput("");
    setIsSending(true);

    try {
      // Structure content history from widget messages
      // Translate sender 'user'/'ai' to role user/assistant
      const history = messages
        .filter(m => m.sender !== "system")
        .map(m => ({
          role: m.sender === "ai" ? "assistant" as const : "user" as const,
          text: m.text
        }));
      
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", text: userMsgText }],
          deviceDetails: {
            brand: deviceBrand,
            model: deviceModel,
            tier: deviceTier,
            issue: issueType
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: "ai", text: data.text }]);
        if (data.detectedSpecs && onUpdateSpecs) {
          onUpdateSpecs(data.detectedSpecs);
        }
      } else {
        throw new Error("Triage API error response");
      }
    } catch (err) {
      console.error("Widget API triage error:", err);
      // fallback simulation response
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            sender: "ai", 
            text: "Detected screen, volume click or battery life parameters. Let's head inside the main Lab Portal to simulate full hardware scans and calculate exact local sales tax rate!" 
          }
        ]);
      }, 700);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm sm:items-end sm:justify-end sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-755 shadow-2xl rounded-2xl w-full max-w-md flex flex-col h-[520px] max-h-[85vh] overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Cpu size={20} className="text-white animate-spin-slow" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight">D&CP Intelligent Assistant</h3>
              <p className="text-[10px] text-slate-400 font-mono">OpenAI GPT-4o Triage Core Ready</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Lab Link Banner */}
        <div className="bg-blue-900/30 border-b border-blue-900/40 px-4 py-2 flex items-center justify-between text-xs text-blue-200 select-none">
          <span className="flex items-center gap-1.5 font-medium">
            <Terminal size={14} className="text-blue-400" />
            Check dynamic quotes & maps:
          </span>
          <button 
            type="button"
            onClick={onNavigateToLab}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-2.5 py-1 rounded text-[10px] uppercase tracking-wide transition-colors"
          >
            Enter Lab
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-950/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === "user" 
                  ? "bg-blue-600 text-white rounded-br-sm shadow-sm font-semibold" 
                  : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 text-xs italic animate-pulse">
                Probing options...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSend} className="relative flex items-center">
            <label htmlFor="mainChatInput" className="sr-only">Main Diagnostic Prompt Input</label>
            <input
              id="mainChatInput"
              name="mainChatInput"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              placeholder="State hardware failure behavior..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-xs placeholder-slate-500"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isSending}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
          <div className="text-center mt-2.5 font-mono select-none">
            <span className="text-[9px] text-slate-500">Live destination rates & fleet sync monitors active</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- UTILS ---

interface NavButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function NavButton({ children, active, onClick }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-colors ${
        active 
          ? "text-white bg-slate-800 border border-slate-700 shadow-3xs" 
          : "text-slate-300 hover:text-white hover:bg-slate-800/40"
      }`}
    >
      {children}
    </button>
  );
}

interface MobileNavButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

function MobileNavButton({ children, onClick }: MobileNavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-slate-800/40 p-8 rounded-2xl border border-slate-755 text-center hover:scale-[1.01] hover:bg-slate-805 transition-all">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-xl font-extrabold text-white mb-3">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function AuthLoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-3 max-w-xs text-center shadow-2xl">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <h3 className="text-white font-mono text-sm font-bold uppercase tracking-wider">Synchronizing Session</h3>
        <p className="text-slate-400 text-xs font-mono">Connecting with secure local credential databases...</p>
      </div>
    </div>
  );
}
