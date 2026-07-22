export interface RepairTicket {
  id: string;
  customerName: string;
  companyName?: string;
  device: string;
  issueType: "screen" | "battery" | "button" | "other" | string;
  status: "open" | "parts_assigned" | "technician_working" | "quality_check" | "completed";
  quotedPrice: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  userId?: string;
}

export interface POSLog {
  timestamp: string;
  level: string;
  message: string;
  source: "Square" | "CellSmart" | "WebHook-Receiver";
}

export interface QuoteBreakdown {
  partsCost: number;
  laborCost: number;
  overhead: number;
  subtotal: number;
}

export interface TaxResponse {
  valid: boolean;
  zipCode: string;
  city: string;
  rate: number;
  message: string;
}

export interface QuoteResponse {
  baseQuote: QuoteBreakdown;
  taxInfo: {
    zipCode: string;
    city: string;
    rate: number;
    calculatedTax: number;
  };
  discountInfo: {
    applied: boolean;
    percentage: number;
    amount: number;
    company: string;
  };
  subtotal: number;
  grandTotal: number;
}

export interface TicketTemplate {
  id: string;
  name: string;
  brand: string;
  issueType: string;
  description: string;
  estimatedTime: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | string;
  defaultPrice: number;
}

