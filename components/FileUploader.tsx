"use client";

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, FileText, Sparkles, Camera } from "lucide-react";
import { api } from "@/lib/api";

interface FileUploaderProps {
  onUploadSuccess: (data: any | any[]) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [mode, setMode] = useState<"upload" | "paste" | "camera">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setPreview(URL.createObjectURL(selectedFiles[0]));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (mode === "upload" && files.length === 0) return;
    if (mode === "camera" && files.length === 0) return;
    if (mode === "paste" && !text.trim()) return;

    setLoading(true);
    setError(null);

    if (mode === "paste") {
      try {
        const formData = new FormData();
        formData.append("text", text);
        const res = await api.upload("/api/analyze", formData);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        onUploadSuccess(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle Bulk/Single Image Upload
    let allResults = [];
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const formData = new FormData();
      formData.append("file", files[i]);

      try {
        const res = await api.upload("/api/analyze", formData);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        allResults.push(data);
      } catch (err: any) {
        console.error(`Error uploading file ${i}:`, err);
        setError(`Failed on file ${i + 1}: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    if (allResults.length > 0) {
      onUploadSuccess(files.length > 1 ? allResults : allResults[0]);
    }
    setLoading(false);
    setCurrentFileIndex(-1);
  };

  const clear = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setFiles([]);
    setPreview(null);
    setText("");
    setError(null);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setError(null);
    } catch (err: any) {
      setError("Camera access denied or not available");
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById("camera-video") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "captured-card.jpg", { type: "image/jpeg" });
          setFiles([capturedFile]);
          setPreview(URL.createObjectURL(capturedFile));

          // Stop stream
          stream?.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }, "image/jpeg");
    }
  };

  return (
    <div className="glass-panel uploader-root">
      <div className="uploader-tabs">
        <button
          onClick={() => { setMode("camera"); clear(); startCamera(); }}
          className={`uploader-tab ${mode === "camera" ? "active" : ""}`}
        >
          <Camera size={16} />
          <span>Camera</span>
        </button>
        <button
          onClick={() => { setMode("upload"); clear(); }}
          className={`uploader-tab ${mode === "upload" ? "active" : ""}`}
        >
          <ImageIcon size={16} />
          <span>Upload Image</span>
        </button>
        <button
          onClick={() => { setMode("paste"); clear(); }}
          className={`uploader-tab ${mode === "paste" ? "active" : ""}`}
        >
          <FileText size={16} />
          <span>Content</span>
        </button>
      </div>

      <div style={{ padding: '32px' }}>
        {mode === "camera" && files.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stream ? (
                <video
                  id="camera-video"
                  autoPlay
                  playsInline
                  ref={(el) => { if (el) el.srcObject = stream; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
                  <p>Starting Camera...</p>
                </div>
              )}
            </div>
            <button
              onClick={capturePhoto}
              className="btn-primary w-full"
              style={{ padding: '16px' }}
            >
              Capture Photo
            </button>
          </div>
        )}

        {(mode === "upload" || (mode === "camera" && files.length > 0)) && (
          mode === "upload" && files.length === 0 ? (
            <label className="uploader-dropzone">
              <div className="logo-icon" style={{ width: '80px', height: '80px', marginBottom: '24px' }}>
                <Upload size={32} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>Click to upload posters</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Select multiple images (Max 10MB each)</p>
              </div>
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="preview-box">
                <div className="preview-img-container" style={{ position: 'relative' }}>
                  <img
                    src={preview!}
                    alt="Preview"
                    className="preview-img"
                  />
                  {files.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                      +{files.length - 1} more
                    </div>
                  )}
                </div>
                <button
                  onClick={clear}
                  className="logo-icon"
                  style={{ position: 'absolute', top: '24px', right: '24px', background: 'white', color: '#ef4444', width: '40px', height: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none' }}
                >
                  <X size={20} />
                </button>

                <div className="preview-info-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <ImageIcon size={16} className="text-primary" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {files.length === 1 ? files[0].name : `${files.length} images selected`}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                  </span>
                </div>
              </div>

              {loading && currentFileIndex !== -1 && (
                <div className="fade-in" style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--sidebar-border)' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)' }}>BULK PROCESSING</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)' }}>{currentFileIndex + 1} / {files.length}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${((currentFileIndex + 1) / files.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'all 0.3s ease' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Processing: {files[currentFileIndex].name}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="btn-primary w-full"
                  style={{ padding: '16px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>
                        {files.length > 1 
                          ? `PROCESSING ${currentFileIndex + 1}/${files.length}...` 
                          : 'ANALYZING DATA...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      <span style={{ letterSpacing: '0.05em' }}>
                        {files.length > 1 ? 'START BULK EXTRACTION' : 'START EXTRACTION'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={clear}
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  {mode === 'camera' ? 'Retake Photo' : 'Discard Files'}
                </button>
              </div>
            </div>
          )
        )}

        {mode === "paste" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="space-y-2">
              <label className="data-label">Paste Copy/Text here</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the job description details, company info, eligibility, etc..."
                className="input-field"
                style={{ height: '250px', resize: 'none', padding: '20px', lineHeight: '1.6' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleUpload}
                disabled={loading || !text.trim()}
                className="btn-primary w-full"
                style={{ padding: '16px' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>PARSING TEXT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span style={{ letterSpacing: '0.05em' }}>EXTRACT FROM TEXT</span>
                  </>
                )}
              </button>

              <button
                onClick={clear}
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                Clear Text
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="fade-in" style={{ padding: '16px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6', color: '#e11d48', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <X size={18} />
                <p style={{ fontSize: '14px', fontWeight: '700' }}>An error occurred</p>
              </div>
              <p style={{ fontSize: '12px', marginLeft: '30px', opacity: 0.8 }}>{error}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingLeft: '30px' }}>
              <button
                onClick={handleUpload}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px', height: 'auto', flex: 1 }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .uploader-tabs {
          display: flex;
          border-bottom: 1px solid var(--sidebar-border);
          background: rgba(248, 250, 252, 0.5);
        }
        .uploader-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .uploader-tab.active {
          color: var(--primary);
          background: white;
          box-shadow: inset 0 -2px 0 var(--primary);
        }
        .uploader-tab:hover:not(.active) {
          background: rgba(248, 250, 252, 0.8);
        }
      `}</style>
    </div>
  );
}
