"use client";

import { useState } from "react";
import { X, Mail, Send, ExternalLink, Sparkles } from "lucide-react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  toEmail: string;
  defaultSubject?: string;
}

export default function EmailModal({ isOpen, onClose, toEmail, defaultSubject }: EmailModalProps) {
  const [subject, setSubject] = useState(defaultSubject || "");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    // Support multiple emails by splitting and joining
    const emails = toEmail.split(',').map(e => e.trim()).filter(e => e !== "");
    const mailtoUrl = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="email-modal glass-panel shadow-2xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="logo-icon" style={{ background: 'var(--primary)', color: 'white' }}>
              <Mail size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Compose Email</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="space-y-6">
            <div className="hero-badge" style={{ margin: '0 0 16px 0', background: '#eef2ff', color: 'var(--primary)', border: '1px solid #e0e7ff' }}>
              <Sparkles size={12} /> ZERO-CONFIG SENDING
            </div>

            <div className="form-group">
              <label className="input-label">To ({toEmail.split(',').length} recipients)</label>
              <div className="input-container disabled">
                <Mail size={16} className="input-icon" />
                <textarea 
                  value={toEmail} 
                  disabled 
                  className="form-input" 
                  style={{ minHeight: '60px', paddingLeft: '44px', paddingTop: '14px', resize: 'none' }} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Subject</label>
              <input 
                type="text" 
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input" 
                style={{ paddingLeft: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Message</label>
              <textarea 
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input min-h-[180px] py-4"
                style={{ paddingLeft: '16px' }}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleSend} 
                className="btn-primary w-full justify-center py-4 text-lg"
              >
                <ExternalLink size={20} />
                <span>Open in Mail App</span>
              </button>
              <p className="text-center text-xs text-slate-400 font-medium">
                This will open your default email application (Gmail, Outlook, etc.) 
                with the details pre-filled. No setup required!
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .email-modal {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 32px;
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .close-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .modal-content {
          padding: 32px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
        }
        .form-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          border-radius: 16px;
          border: 2px solid #f1f5f9;
          background: #f8fafc;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s;
          outline: none;
          color: #1e293b;
        }
        .form-input:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05);
        }
        .disabled .form-input {
          background: #f1f5f9;
          border-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        textarea.form-input {
          resize: none;
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
