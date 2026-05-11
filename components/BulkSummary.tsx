"use client";

import { CheckCircle, ExternalLink, ChevronRight, FileText, Mail } from "lucide-react";
import { useState } from "react";
import EmailModal from "./EmailModal";

interface BulkSummaryProps {
  results: any[];
  onSelectItem: (item: any) => void;
  sheetUrl: string | null;
}

export default function BulkSummary({ results, onSelectItem, sheetUrl }: BulkSummaryProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");

  const openEmailModal = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="hero-section" style={{ padding: '40px', background: 'var(--primary)', color: 'white', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
          <CheckCircle size={200} />
        </div>
        <div className="hero-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
          <CheckCircle size={12} /> PROCESSING COMPLETE
        </div>
        <h2 className="hero-title" style={{ color: 'white', fontSize: '32px', marginBottom: '12px' }}>
          Successfully processed {results.length} posts
        </h2>
        <p style={{ opacity: 0.9, fontSize: '16px', maxWidth: '600px' }}>
          All extracted data has been automatically appended to your Google Sheet. You can review each post below.
        </p>
        
        {sheetUrl && (
          <a 
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ marginTop: '24px', background: 'white', color: 'var(--primary)', width: 'fit-content' }}
          >
            <ExternalLink size={18} />
            <span>Open Google Sheet</span>
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {results.map((item, i) => {
          const name = item.companyName || item.extraction.company_name || item.extraction.name || "Unknown";
          const subtitle = item.extraction.job_role || item.extraction.designation || (item.extraction.card_type ? `${item.extraction.card_type} Card` : "Details Extracted");
          
          return (
            <div 
              key={i} 
              onClick={() => onSelectItem(item)}
              className="glass-panel" 
              style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <div className="logo-icon" style={{ background: '#f0fdf4', color: '#10b981', flexShrink: 0 }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
                {(item.extraction.email || item.extraction.hr_email) && (
                  <div 
                    onClick={(e) => openEmailModal(e, item.extraction.email || item.extraction.hr_email)}
                    style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '11px', fontWeight: '800', background: 'var(--primary-light, #eef2ff)', padding: '4px 8px', borderRadius: '8px', width: 'fit-content' }}
                  >
                    <Mail size={12} />
                    <span>{item.extraction.email || item.extraction.hr_email}</span>
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </div>
          );
        })}
      </div>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        toEmail={selectedEmail}
      />
    </div>
  );
}
