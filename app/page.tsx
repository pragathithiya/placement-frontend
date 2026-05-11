"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUploader from "@/components/FileUploader";
import PlacementCard from "@/components/PlacementCard";
import ChatInterface from "@/components/ChatInterface";
import JobForm from "@/components/JobForm";
import BulkSummary from "@/components/BulkSummary";
import CardDisplay from "@/components/CardDisplay";
import EmailModal from "@/components/EmailModal";
import { api } from "@/lib/api";
import {
  Sparkles,
  History,
  Contact,
  PlusCircle,
  LayoutDashboard,
  Bot,
  Briefcase,
  ChevronRight,
  Clock,
  Search,
  FileText,
  Edit3,
  Camera,
  Trash2,
  Mail
} from "lucide-react";

export default function Home() {
  const [currentPlacement, setCurrentPlacement] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<"upload" | "details" | "history" | "bulk" | "cards">("upload");
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");

  const [userName, setUserName] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Use sessionStorage so user logs in every time they open the app/tab
    const stored = sessionStorage.getItem("userName");
    if (stored) setUserName(stored);

    // Handle bulk email from URL parameter (?to=a@b.com,c@d.com)
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get("to");
    if (toParam) {
      setSelectedEmail(toParam);
      setIsEmailModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      sessionStorage.setItem("userName", loginInput.trim());
      setUserName(loginInput.trim());
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userName");
    setUserName(null);
    setLoginInput("");
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/placements");
      if (!res.ok) {
        console.error(`API Error: ${res.status} ${res.statusText}`);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setHistory(data);
      } else {
        console.error("API returned non-JSON response");
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUploadSuccess = (data: any | any[]) => {
    if (Array.isArray(data)) {
      setBulkResults(data);
      setSheetUrl(data[0].sheetUrl);
      setView("bulk");
    } else {
      setCurrentPlacement(data);
      setSheetUrl(data.sheetUrl);
      setView("details");
    }
    fetchHistory();
  };

  const handleSavePost = async (updatedData: any) => {
    if (!currentPlacement?.id) return;

    try {
      const isManual = currentPlacement.id.startsWith("manual-");
      const url = isManual ? "/api/placements" : `/api/placements/${currentPlacement.id}`;
      const method = isManual ? "POST" : "PATCH";

      const res = await (isManual
        ? api.post("/api/placements", {
          id: currentPlacement.id,
          company_name: updatedData.company_name,
          extraction: updatedData
        })
        : api.patch(`/api/placements/${currentPlacement.id}`, {
          company_name: updatedData.company_name,
          extraction: updatedData
        })
      );

      if (!res.ok) throw new Error("Failed to save to database");

      setCurrentPlacement((prev: any) => ({
        ...prev,
        extraction: updatedData,
        companyName: updatedData.company_name
      }));

      fetchHistory(); // Refresh sidebar history
      console.log("Post saved successfully");
    } catch (err) {
      console.error("Failed to save post:", err);
      alert("Error saving post. please try again.");
    }
  };

  const selectFromHistory = async (id: string) => {
    try {
      const res = await api.get(`/api/placements/${id}`);
      const data = await res.json();

      if (!res.ok || !data.placement) {
        throw new Error(data.error || "Placement not found");
      }

      setCurrentPlacement({
        id: data.placement.id,
        extraction: JSON.parse(data.placement.extracted_data),
        imagePath: api.imageUrl(data.placement.image_path),
        companyName: data.placement.company_name,
        sheetUrl: data.sheetUrl || sheetUrl // Keep existing or use new
      });
      if (data.sheetUrl) setSheetUrl(data.sheetUrl);
      setView("details");
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  };

  const handleCardUploadSuccess = (data: any | any[]) => {
    if (Array.isArray(data)) {
      setBulkResults(data);
      const url = data[0].sheetUrl;
      setSheetUrl(url);
      setView("bulk");
    } else {
      setCurrentCard(data);
      setSheetUrl(data.sheetUrl);
      setView("cards");
    }
    fetchHistory();
  };

  const openEmailModal = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
  };

  if (!isClient) return null;

  if (!userName) {
    return (
      <div className="login-screen-container">
        <div className="login-visual-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <div className="login-card-wrapper fade-in">
          <div className="login-glass-card">
            <div className="login-header">
              <div className="premium-logo">
                <Sparkles size={28} className="sparkle-icon" />
                <div className="logo-box">
                  <Briefcase size={22} />
                </div>
              </div>
              <h1 className="premium-title">Card AI</h1>
              <p className="premium-subtitle">Your Intelligent Business Companion</p>
            </div>

            <div className="login-form-area">
              <div className="welcome-tag">GREETINGS</div>
              <h2 className="login-heading">Welcome Back</h2>
              <p className="login-subheading">Enter your name to access your workspace</p>
              
              <form onSubmit={handleLogin} className="premium-form">
                <div className="premium-input-group">
                  <div className="input-icon-wrapper">
                    <Contact size={18} />
                  </div>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Full Name"
                    className="premium-input"
                    autoFocus
                    required
                  />
                </div>
                
                <button type="submit" className="login-submit-btn">
                  <span>Enter Workspace</span>
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>

            <div className="login-footer">
              <p>© 2026 Manvian Group • Secure Access</p>
            </div>
          </div>
          
          {/* Mobile specific footer info */}
          <div className="mobile-only-info">
            <p>Optimized for Mobile Performance</p>
          </div>
        </div>

        <style jsx>{`
          .login-screen-container {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            overflow: hidden;
            z-index: 9999;
            padding: 20px;
          }

          .login-visual-bg {
            position: absolute;
            inset: 0;
            z-index: 1;
            filter: blur(80px);
            opacity: 0.5;
          }

          .blob {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            animation: float 20s infinite alternate;
          }

          .blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; background: #6366f1; }
          .blob-2 { width: 500px; height: 500px; bottom: -150px; right: -100px; background: #8b5cf6; animation-delay: -5s; }
          .blob-3 { width: 300px; height: 300px; top: 40%; left: 60%; background: #ec4899; animation-delay: -10s; }

          @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(100px, 50px) rotate(30deg); }
          }

          .login-card-wrapper {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 440px;
          }

          .login-glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 32px;
            padding: 48px 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
          }

          .premium-logo {
            position: relative;
            display: inline-flex;
            margin-bottom: 24px;
          }

          .sparkle-icon {
            position: absolute;
            top: -12px;
            right: -12px;
            color: #fbbf24;
            filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
          }

          .logo-box {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
          }

          .premium-title {
            font-size: 32px;
            font-weight: 900;
            color: white;
            letter-spacing: -0.02em;
            margin-bottom: 4px;
          }

          .premium-subtitle {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 40px;
          }

          .login-form-area {
            text-align: left;
          }

          .welcome-tag {
            display: inline-block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
          }

          .login-heading {
            font-size: 24px;
            font-weight: 800;
            color: white;
            margin-bottom: 8px;
          }

          .login-subheading {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 32px;
          }

          .premium-input-group {
            position: relative;
            margin-bottom: 20px;
          }

          .input-icon-wrapper {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
          }

          .premium-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 16px 16px 16px 52px;
            color: white;
            font-size: 16px;
            outline: none;
            transition: all 0.2s;
          }

          .premium-input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: #8b5cf6;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
          }

          .login-submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 18px;
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }

          .login-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 25px rgba(99, 102, 241, 0.4);
            filter: brightness(1.1);
          }

          .login-footer {
            margin-top: 40px;
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .mobile-only-info {
            display: none;
            text-align: center;
            margin-top: 24px;
            color: #475569;
            font-size: 12px;
            font-weight: 600;
          }

          @media (max-width: 480px) {
            .login-glass-card {
              padding: 40px 24px;
              border-radius: 24px;
            }
            .mobile-only-info {
              display: block;
            }
            .premium-title {
              font-size: 28px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="nav-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-icon">
              <Briefcase size={22} />
            </div>
            <h1 className="logo-text">Card AI</h1>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Logged in as <b>{userName}</b>
            <span onClick={handleLogout} style={{ cursor: 'pointer', color: 'var(--primary)', marginLeft: '8px', textDecoration: 'underline' }}>Logout</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            onClick={() => setView("upload")}
            className={`nav-link ${view === "upload" || view === "details" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span>Posting Job</span>
          </button>
          <button
            onClick={() => setView("cards")}
            className={`nav-link ${view === "cards" ? "active" : ""}`}
          >
            <img src="/icons/visiting-card.png" alt="Visiting Card" style={{ width: '20px', height: '20px', objectFit: 'contain', filter: view === 'cards' ? 'none' : 'grayscale(1) opacity(0.7)' }} />
            <span>Visiting Card</span>
          </button>
          <button
            onClick={() => setView("history")}
            className={`nav-link ${view === "history" ? "active" : ""}`}
          >
            <History size={20} />
            <span>History</span>
          </button>
        </nav>

        <div className="sidebar-promo">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">New</span>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Scan a new placement poster or visiting card.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setView("cards")}
              className="btn-primary w-full"
              style={{ padding: '10px', fontSize: '13px' }}
            >
              <img src="/icons/visiting-card.png" alt="Visiting Card" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
              <span>Visiting Card</span>
            </button>
            <button
              onClick={() => {
                setCurrentPlacement({
                  id: "manual-" + Date.now(),
                  extraction: {},
                  imagePath: "",
                  companyName: ""
                });
                setView("details");
              }}
              style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid var(--sidebar-border)', borderRadius: '12px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Edit3 size={16} />
              <span>Manual Input</span>
            </button>
          </div>
        </div>

        <div className="mt-auto" style={{ opacity: 0.3, padding: '20px 0' }}>
          <div className="flex items-center gap-3">
            <div className="logo-icon" style={{ width: '32px', height: '32px', background: '#e2e8f0' }} />
            <div className="flex flex-col gap-1">
              <div style={{ width: '60px', height: '8px', background: '#e2e8f0', borderRadius: '4px' }} />
              <div style={{ width: '40px', height: '6px', background: '#f1f5f9', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden glass m-4 p-4 flex items-center justify-between sticky top-4 z-50">
          <div className="flex items-center gap-2">
            <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <Briefcase size={16} />
            </div>
            <span className="font-bold text-primary">Card AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hero-badge" style={{ margin: 0, padding: '4px 10px', fontSize: '10px' }}>
              {view === 'upload' ? 'Posting Job' : view === 'cards' ? 'Visiting Card' : view === 'history' ? 'History' : 'Details'}
            </div>
          </div>
        </div>

        <div className="workspace-container">
          {view === "upload" && (
            <div className="fade-in">
              <div className="hero-section">
                <div className="hero-badge">
                  <Sparkles size={12} /> INTELLIGENT OCR SYSTEM
                </div>
                <h2 className="hero-title">
                  Turn posters into <br />
                  <span className="text-primary" style={{ fontStyle: 'italic' }}>structured data.</span>
                </h2>
                <p className="hero-subtitle">
                  Stop manually typing details. Upload any placement image and let our AI extract company details, CTC, and eligibility in seconds.
                </p>

                {/* Mobile Quick Actions (Visible only on Mobile) */}
                <div className="md:hidden mt-10">
                  <div className="sidebar-promo" style={{ margin: 0, background: '#eef2ff', border: '1px solid rgba(139, 92, 246, 0.1)', padding: '24px' }}>
                    <div className="flex items-center gap-3 text-primary mb-3">
                      <Sparkles size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Start Scanning</span>
                    </div>
                    <p className="text-xs text-text-muted mb-6">
                      Quickly scan a new poster or card, or enter details manually.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          onClick={() => setView("cards")}
                          style={{ padding: '14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1e1b4b', fontSize: '13px' }}
                        >
                          <img src="/icons/visiting-card.png" alt="Visiting Card" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span>Visiting Card</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentPlacement({
                              id: "manual-" + Date.now(),
                              extraction: {},
                              imagePath: "",
                              companyName: ""
                            });
                            setView("details");
                          }}
                          style={{ padding: '14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <Edit3 size={16} />
                          <span>Manual</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <FileUploader onUploadSuccess={handleUploadSuccess} userName={userName} />

              <div className="feature-cards">
                {[
                  { icon: Clock, color: "#6366f1", title: "Manvin Rules", desc: "Automatic internship logic." }
                ].map((item, i) => (
                  <Link key={i} href="/docs" style={{ textDecoration: 'none' }}>
                    <div className="feature-card" style={{ cursor: 'pointer' }}>
                      <div className="logo-icon" style={{ background: `${item.color}15`, color: item.color, marginBottom: '20px' }}>
                        <item.icon size={22} />
                      </div>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{item.title}</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {view === "cards" && (
            <div className="fade-in">
              <div className="hero-section">
                <div className="hero-badge" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                  <img src="/icons/visiting-card.png" alt="Visiting Card" style={{ width: '12px', height: '12px', objectFit: 'contain' }} /> VISITING CARD
                </div>
                <h2 className="hero-title">
                  Scan Registration & <br />
                  <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Visiting Cards.</span>
                </h2>
                <p className="hero-subtitle">
                  Capture contact details instantly from physical cards. Data is automatically synced to the Registration Google Sheet.
                </p>
              </div>

              {!currentCard ? (
                <FileUploader 
                  onUploadSuccess={handleCardUploadSuccess} 
                  endpoint="/api/analyze-card"
                  userName={userName}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentCard(null)}
                      style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      ← New Visiting Card
                    </button>
                    {sheetUrl && (
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-badge"
                        style={{ margin: 0, textDecoration: 'none', background: '#10b98115', color: '#10b981', border: '1px solid #10b98120' }}
                      >
                        <FileText size={12} /> View Registration Sheet
                      </a>
                    )}
                  </div>
                  
                  <CardDisplay 
                    data={currentCard.extraction} 
                    imagePath={api.imageUrl(currentCard.imagePath)} 
                  />
                </div>
              )}
            </div>
          )}

          {view === "details" && currentPlacement && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="flex items-center justify-between">
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setView("upload")}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ← New Scan
                  </button>
                  {bulkResults.length > 0 && (
                    <button
                      onClick={() => setView("bulk")}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      • Back to Summary
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-badge"
                      style={{ margin: 0, textDecoration: 'none', background: '#10b98115', color: '#10b981', border: '1px solid #10b98120' }}
                    >
                      <FileText size={12} /> View in Google Sheets
                    </a>
                  )}
                  <div className="hero-badge" style={{ margin: 0 }}>
                    <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} /> Verified Extraction
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <JobForm
                    initialData={currentPlacement.extraction}
                    onSave={handleSavePost}
                  />
                  <PlacementCard
                    data={currentPlacement.extraction}
                    imagePath={currentPlacement.imagePath}
                  />
                </div>
                <div>
                  <ChatInterface placementId={currentPlacement.id} />
                </div>
              </div>
            </div>
          )}

          {view === "bulk" && (
            <BulkSummary
              results={bulkResults}
              onSelectItem={(item) => {
                if (item.extraction.card_type) {
                  setCurrentCard(item);
                  setView("cards");
                } else {
                  setCurrentPlacement(item);
                  setView("details");
                }
              }}
              sheetUrl={sheetUrl}
            />
          )}

          {view === "history" && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="hero-title" style={{ fontSize: '40px', margin: 0 }}>History</h2>
                  <p className="hero-subtitle">You have processed {history.length} placement posters</p>
                </div>
                <button
                  onClick={() => setView("upload")}
                  className="btn-primary"
                >
                  <PlusCircle size={18} /> New Analysis
                </button>
              </div>

              {history.length === 0 ? (
                <div className="glass-panel responsive-card" style={{ textAlign: 'center' }}>
                  <div className="logo-icon" style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: '#eef2ff', color: 'var(--primary)' }}>
                    <History size={40} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Your library is empty</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Upload your first placement poster to start your records.</p>
                  <button onClick={() => setView("upload")} className="btn-primary">Scan Now</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectFromHistory(item.id)}
                      className="glass-panel"
                      style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      <div style={{ height: '200px', background: '#f8fafc', borderRadius: '16px', marginBottom: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.image_path ? (
                          <img
                            src={api.imageUrl(item.image_path)}
                            alt={item.company_name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={48} opacity={0.2} style={{ marginBottom: '12px' }} />
                            <p style={{ fontSize: '12px', fontWeight: '700' }}>Text Extraction</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#1e1b4b', marginBottom: '4px' }}>{item.company_name}</h4>
                          <div className="flex items-center gap-2" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <Clock size={12} />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          {JSON.parse(item.extracted_data).email || JSON.parse(item.extracted_data).hr_email ? (
                            <div 
                              onClick={(e) => openEmailModal(e, JSON.parse(item.extracted_data).email || JSON.parse(item.extracted_data).hr_email)}
                              style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '11px', fontWeight: '800', background: 'rgba(99, 102, 241, 0.05)', padding: '4px 8px', borderRadius: '8px', width: 'fit-content' }}
                            >
                              <Mail size={12} />
                              <span>{JSON.parse(item.extracted_data).email || JSON.parse(item.extracted_data).hr_email}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <div className="logo-icon footer-logo">
                <Briefcase size={16} />
              </div>
              <span className="footer-logo-text">Card AI</span>
            </div>

            <p className="footer-credits">
              Intelligence by <span className="font-bold">Gemma & OpenRouter</span>
            </p>

            <div className="footer-links">
              <Link href="/docs" className="footer-link">Docs</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        <button 
          onClick={handleLogout} 
          className="bottom-nav-item"
          style={{ color: 'var(--text-muted)' }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'rgba(139, 92, 246, 0.1)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '900',
            border: '1.5px solid var(--primary)',
            marginBottom: '2px'
          }}>
            {userName?.charAt(0).toUpperCase()}
          </div>
          <span>Logout</span>
        </button>

        <button 
          onClick={() => setView("upload")} 
          className={`bottom-nav-item ${view === "upload" || view === "details" ? "active" : ""}`}
        >
          <LayoutDashboard size={22} />
          <span>Posting Job</span>
        </button>
        
        <button 
          onClick={() => setView("cards")} 
          className={`bottom-nav-item ${view === "cards" ? "active" : ""}`}
        >
          <div className="fab-button">
            <img src="/icons/visiting-card.png" alt="Visiting Card" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          </div>
          <span>Visiting Card</span>
        </button>

        <button 
          onClick={() => setView("history")} 
          className={`bottom-nav-item ${view === "history" ? "active" : ""}`}
        >
          <History size={22} />
          <span>History</span>
        </button>
      </nav>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        toEmail={selectedEmail}
      />
    </div>
  );
}
