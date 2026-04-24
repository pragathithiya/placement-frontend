"use client";

import { CheckCircle, ExternalLink, ChevronRight, FileText } from "lucide-react";

interface BulkSummaryProps {
  results: any[];
  onSelectItem: (item: any) => void;
  sheetUrl: string | null;
}

export default function BulkSummary({ results, onSelectItem, sheetUrl }: BulkSummaryProps) {
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
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
