import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Camera, 
  Upload, 
  HelpCircle, 
  Barcode, 
  QrCode, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Sparkles,
  Info
} from "lucide-react";
import jsQR from "jsqr";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (serial: string, brand?: string, model?: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "demo">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanResult, setScanResult] = useState<{ serial: string; details?: string } | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Play satisfying hardware diagnostic beep using Web Audio API
  const playBeep = (type: "success" | "error" = "success") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "success") {
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.setValueAtTime(2000, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Web Audio API not supported or user gesture required:", e);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    try {
      // Release any old stream
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support webcam streaming in this context.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        
        // Start loop to scan canvas frames
        startScanLoop();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission was denied. If inside an iframe, try opening in a New Tab.");
      } else {
        setCameraError(err.message || "Could not spin up device video sensors.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Stop Camera & Clean Loops
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Scan frame by frame using jsQR
  const startScanLoop = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || activeTab !== "camera") return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.readyState === video.HAVE_CURRENT_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          playBeep("success");
          handleDecodedData(code.data);
          return; // Stop scanning
        }
      }
      animationFrameRef.current = requestAnimationFrame(scan);
    };
    animationFrameRef.current = requestAnimationFrame(scan);
  };

  // Handle successful decoding from any source
  const handleDecodedData = (data: string) => {
    stopCamera();
    
    // Parse serial - if JSON trace from our own app, extract details
    let serial = data.trim();
    let brand = "";
    let model = "";

    if (data.includes("--- TELEMETRY TRACE ---") || data.includes("Serial:")) {
      // Attempt line-by-line parsing
      const lines = data.split("\n");
      const serialLine = lines.find(l => l.startsWith("Serial:") || l.includes("Serial:"));
      const brandLine = lines.find(l => l.startsWith("Manufacturer:") || l.includes("Brand:"));
      const modelLine = lines.find(l => l.startsWith("Model:") || l.includes("Model:"));

      if (serialLine) {
        serial = serialLine.split(":")[1].trim();
      }
      if (brandLine) {
        brand = brandLine.split(":")[1].trim();
      }
      if (modelLine) {
        model = modelLine.split(":")[1].trim();
      }
    } else if (data.includes("ID:") && data.includes("Vault:")) {
      // Format parser
    }

    setScanResult({
      serial,
      details: brand || model ? `${brand} ${model}` : "Standard Hardware Label"
    });

    // Notify parent immediately
    onScanSuccess(serial, brand, model);
  };

  // Handle uploaded image files
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          playBeep("success");
          handleDecodedData(code.data);
        } else {
          playBeep("error");
          alert("Could not detect any valid QR code in this image. Please ensure the QR code is centered and clear.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Demo Labels Deck
  const demoLabels = [
    {
      title: "iPhone 15 Pro Max Spec Tag",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      serial: "DSC-IPH15PM-872A",
      tag: "QC Flagship OK",
      color: "border-slate-700 hover:border-slate-500"
    },
    {
      title: "Galaxy S24 Ultra Laser Label",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      serial: "DSC-SAMS24U-109X",
      tag: "QC Verified Hub",
      color: "border-slate-700 hover:border-blue-500"
    },
    {
      title: "Google Pixel 8 Pro Label",
      brand: "Google",
      model: "Pixel 8 Pro",
      serial: "DSC-PIX8PRO-554Y",
      tag: "Midrange Beta",
      color: "border-slate-700 hover:border-emerald-500"
    },
    {
      title: "iPad Pro M4 Workbench Sticker",
      brand: "Apple",
      model: "iPad Pro M4",
      serial: "DSC-IPADM4-921C",
      tag: "Calibrator Master",
      color: "border-slate-700 hover:border-purple-500"
    }
  ];

  // Lifecycle monitoring
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      if (activeTab === "camera") {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                Hardware Label QR Code Scanner
              </h3>
              <p className="text-[10px] text-slate-400">
                Identify serial configurations automatically from barcodes or screen captures.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-1">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === "camera" 
                ? "bg-slate-800 text-blue-400 shadow" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === "upload" 
                ? "bg-slate-800 text-blue-400 shadow" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            Import File
          </button>
          <button
            onClick={() => setActiveTab("demo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === "demo" 
                ? "bg-slate-800 text-blue-400 shadow" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Barcode className="w-4 h-4" />
            Demo Labels
          </button>
        </div>

        {/* Modal Main Body Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          
          {scanResult ? (
            /* Successful scan display state */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Device Decoded Successfully
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  The barcode registry recognized your device fingerprint and mapped it to the calibration desk.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl w-full max-w-sm text-left font-mono space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-[10px] text-slate-500 font-bold">DECODED SERIAL</span>
                  <span className="text-xs text-emerald-400 font-black tracking-widest">{scanResult.serial}</span>
                </div>
                {scanResult.details && (
                  <div className="flex justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">DEVICE SPEC</span>
                    <span className="text-xs text-slate-300 font-bold">{scanResult.details}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-[8.5px] text-slate-550">
                  <span>TELEMETRY SYNC STATUS</span>
                  <span className="text-blue-400 font-bold uppercase">STABLE ONLINE</span>
                </div>
              </div>

              <div className="flex gap-2.5 w-full max-w-sm">
                <button
                  onClick={() => {
                    setScanResult(null);
                    if (activeTab === "camera") startCamera();
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-mono font-bold uppercase rounded-lg text-slate-300 transition-colors"
                >
                  Scan Another Label
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold uppercase rounded-lg text-white transition-colors"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Content 1: Live Webcam Stream */}
              {activeTab === "camera" && (
                <div className="flex flex-col space-y-4">
                  
                  {cameraError ? (
                    <div className="bg-amber-950/20 border border-amber-900/60 p-4 rounded-lg flex gap-3 text-amber-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <div className="text-xs space-y-1.5">
                        <p className="font-bold">Hardware Permissions Notice</p>
                        <p className="leading-relaxed">
                          {cameraError}
                        </p>
                        <p className="leading-normal text-slate-400">
                          To simulate scanning without a physical camera feed, toggle over to the <strong className="text-blue-400 hover:underline cursor-pointer" onClick={() => setActiveTab("demo")}>Demo Labels</strong> tab to instantly trigger simulated hardware code-scans!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                      {isCameraLoading && (
                        <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center space-y-2 font-mono text-xs text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                          <span>Warming up digital CMOS lens...</span>
                        </div>
                      )}
                      
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-cover"
                      />
                      
                      <canvas 
                        ref={canvasRef}
                        className="hidden"
                      />

                      {/* Cool Neon Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-48 h-48 border-2 border-dashed border-blue-500/20 rounded-lg flex items-center justify-center">
                          {/* Corner bracket accents */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                          
                          {/* Pulsing Scan Laser Line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-bounce top-[20%]"></div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[8px] font-mono text-slate-400 border border-slate-800 flex items-center gap-1.5 uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Device sensor active: 60FPS
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 flex gap-2.5 text-[10px] text-slate-400 leading-normal font-sans">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      Aim your camera directly at the device QR tag or any display screen to instantly capture telemetry arrays. Hold steady in standard workshop lighting.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Drop File Upload */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all ${
                      dragActive 
                        ? "border-blue-500 bg-blue-950/10" 
                        : "border-slate-800 bg-slate-950/20 hover:border-slate-750"
                    }`}
                  >
                    <div className="p-3 bg-slate-900 rounded-full text-slate-400 border border-slate-800">
                      <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Drag and drop QR tag photo here</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Supports PNG, JPG, JPEG up to 5MB</span>
                    </div>
                    <label className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10.5px] font-mono font-bold uppercase rounded-lg text-slate-300 transition-all cursor-pointer">
                      Browse Files
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileSelect} 
                      />
                    </label>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-400 leading-normal flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      Take a photo of a smartphone sticker with your workbench iPad, drag and drop the file, and our hardware engine will parse the raw bytes instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Demo Labels Deck */}
              {activeTab === "demo" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-2.5 border border-slate-850 rounded-lg text-[9.5px] text-slate-400 font-mono leading-relaxed">
                    <Barcode className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Select any of these sample phone tags to simulate real-time laser alignment scan trigger.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demoLabels.map((lbl, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleDecodedData(lbl.serial)}
                        className={`p-3.5 bg-slate-950 border rounded-lg cursor-pointer flex flex-col justify-between hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-98 relative group ${lbl.color}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-blue-400 font-mono uppercase tracking-wider">{lbl.brand}</span>
                            <span className="text-[7.5px] font-bold px-1 py-0.2 bg-slate-800 text-slate-400 font-mono rounded">{lbl.tag}</span>
                          </div>
                          <h5 className="text-xs font-bold text-white font-sans">{lbl.title}</h5>
                          <p className="text-[9px] text-slate-500 font-mono">Model: <b className="text-slate-400">{lbl.model}</b></p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-900/60 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9.5px] font-mono font-bold text-slate-300">{lbl.serial}</span>
                          </div>
                          <span className="text-[8px] font-mono font-black text-emerald-400 group-hover:underline">SCAN TAG →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer info disclaimer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/30 flex justify-between items-center text-[9px] font-mono text-slate-500">
          <span>VAN INTEGRATED TELEMETRY</span>
          <span>DCP-DECODER v1.40</span>
        </div>

      </div>
    </div>
  );
}
