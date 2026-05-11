"use client";

import { User, Building2, Mail, Phone, Globe, MapPin, BadgeCheck, FileText } from "lucide-react";
import { useState } from "react";
import EmailModal from "./EmailModal";

interface CardDisplayProps {
  data: {
    name?: string;
    designation?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    scanned_by?: string;
    others?: string;
  };
  imagePath?: string;
}

export default function CardDisplay({ data, imagePath }: CardDisplayProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");

  const handleEmailClick = (email: string) => {
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="card-display-container fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Card Data Panel */}
        <div className="glass-panel responsive-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="logo-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
              <BadgeCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e1b4b' }}>Extracted Details</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verified by Gemini Vision</p>
            </div>
            <div style={{ marginLeft: 'auto', background: '#3b82f615', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', border: '1px solid currentColor' }}>
              SCANNED BY: {data.scanned_by?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <DetailItem icon={User} label="Name" value={data.name} />
            <DetailItem icon={BadgeCheck} label="Designation" value={data.designation} />
            <DetailItem icon={Building2} label="Company" value={data.company_name} />
            <DetailItem 
              icon={Mail} 
              label="Email" 
              value={data.email} 
              onClick={data.email ? () => handleEmailClick(data.email!) : undefined}
              isClickable={!!data.email}
            />
            <DetailItem icon={Phone} label="Phone" value={data.phone} />
            <DetailItem icon={Globe} label="Website" value={data.website} />
            <DetailItem icon={MapPin} label="Address" value={data.address} />
            {data.others && <DetailItem icon={FileText} label="Others" value={data.others} />}
          </div>
        </div>

        {/* Card Image Panel */}
        {imagePath && (
          <div className="glass-panel responsive-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex justify-between items-center">
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)' }}>ORIGINAL IMAGE</h4>
              <a href={imagePath} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>View Full Size</a>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
              <img src={imagePath} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        )}
      </div>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        toEmail={selectedEmail}
        defaultSubject={`FOLLOWUP: Regarding ${data.company_name || 'Opportunity'}`}
      />

      <style jsx>{`
        .card-display-container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, onClick, isClickable }: { icon: any, label: string, value?: string, onClick?: () => void, isClickable?: boolean }) {
  if (!value) return null;
  return (
    <div 
      style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', cursor: isClickable ? 'pointer' : 'default' }}
      onClick={onClick}
      className={isClickable ? "hover-clickable" : ""}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isClickable ? 'var(--primary-light, #eef2ff)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isClickable ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0, transition: 'all 0.2s' }}>
        <Icon size={18} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: isClickable ? 'var(--primary)' : '#1e1b4b', textDecoration: isClickable ? 'underline' : 'none' }}>{value}</span>
      </div>
    </div>
  );
}
