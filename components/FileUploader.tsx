"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, FileText, Sparkles, Camera, Crop, RotateCw } from "lucide-react";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { api } from "@/lib/api";
import getCroppedImg from "@/utils/cropImage";

interface FileUploaderProps {
  onUploadSuccess: (data: any | any[]) => void;
  endpoint?: string;
  userName?: string;
}

export default function FileUploader({ onUploadSuccess, endpoint = "/api/analyze", userName = "Admin" }: FileUploaderProps) {
  const [mode, setMode] = useState<"upload" | "paste" | "camera">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let selectedFiles: File[] = [];
    if ('target' in e && (e.target as HTMLInputElement).files) {
      selectedFiles = Array.from((e.target as HTMLInputElement).files || []);
    } else if ('dataTransfer' in e) {
      selectedFiles = Array.from(e.dataTransfer.files);
    }

    if (selectedFiles.length > 0) {
      if (selectedFiles.length === 1) {
        setFiles(selectedFiles);
        setPreview(URL.createObjectURL(selectedFiles[0]));
        // Removed auto setIsCropping(true) as per user request
      } else {
        setFiles(prev => [...prev, ...selectedFiles]);
        if (!preview) {
          setPreview(URL.createObjectURL(selectedFiles[0]));
        }
      }
      setError(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e);
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
        formData.append("scanned_by", userName);
        const res = await api.upload(endpoint, formData);
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
      formData.append("scanned_by", userName);

      try {
        const res = await api.upload(endpoint, formData);
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
          // Removed auto setIsCropping(true) as per user request

          // Stop stream
          stream?.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }, "image/jpeg");
    }
  };


  const saveCroppedImage = async () => {
    try {
      if (!preview || !completedCrop || !imgRef) return;
      
      const scaleX = imgRef.naturalWidth / imgRef.width;
      const scaleY = imgRef.naturalHeight / imgRef.height;
      
      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY
      };

      const croppedImageBlob = await getCroppedImg(preview, pixelCrop, rotation);
      if (croppedImageBlob) {
        const croppedFile = new File([croppedImageBlob], files[0].name, { type: "image/jpeg" });
        setFiles([croppedFile]);
        setPreview(URL.createObjectURL(croppedFile));
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to crop image");
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
  };


  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImgRef(e.currentTarget);
    
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 80 },
        endpoint === "/api/analyze-card" ? 1.58 : undefined as any,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop({
      unit: 'px',
      x: (width - (width * 0.8)) / 2,
      y: (height - (height * 0.8)) / 2,
      width: width * 0.8,
      height: height * 0.8
    });
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
            <label 
              className={`uploader-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="logo-icon" style={{ width: '80px', height: '80px', marginBottom: '24px', transform: isDragging ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease' }}>
                <Upload size={32} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>
                  {isDragging ? "Drop your files here" : "Click or drag to upload posters"}
                </p>
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
            <div 
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className={`preview-box ${isDragging ? "dragging" : ""}`}>
                <div className="preview-img-container" style={{ position: 'relative' }}>
                  <img
                    src={preview!}
                    alt="Preview"
                    className="preview-img"
                  />
                  
                  {/* Crop Image Overlay Button */}
                  {!loading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsCropping(true); }}
                      style={{ 
                        position: 'absolute', 
                        bottom: '24px', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#1e1b4b',
                        fontWeight: '700',
                        fontSize: '14px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        zIndex: 5,
                        transition: 'all 0.2s'
                      }}
                      className="crop-overlay-btn"
                    >
                      <Crop size={18} />
                      Crop Image
                    </button>
                  )}

                  {files.length > 1 && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#8b5cf6', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', zIndex: 6 }}>
                      +{files.length - 1} MORE IMAGES
                    </div>
                  )}

                  {isDragging && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderRadius: '24px', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} />
                        <span className="font-bold">Add more files</span>
                      </div>
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

        {isCropping && preview && (
          <div className="fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>Adjust Crop</h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Drag corners to resize selection</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <RotateCw size={18} />
                  <span>Rotate</span>
                </button>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                <button
                  onClick={cancelCrop}
                  style={{ padding: '10px 20px', background: 'transparent', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCroppedImage}
                  style={{ padding: '12px 32px', background: '#7c3aed', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)' }}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Cropper Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  src={preview}
                  alt="Crop"
                  onLoad={onImageLoad}
                  style={{ 
                    display: 'block',
                    maxWidth: '100%', 
                    maxHeight: '75vh', 
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
              </ReactCrop>
            </div>
          </div>
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
        .uploader-dropzone.dragging {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.05);
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
        }
        .uploader-dropzone {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Premium Handle-based Cropper Styles */
        :global(.ReactCrop) {
          border-radius: 8px;
          overflow: hidden;
        }
        :global(.ReactCrop__crop-selection) {
          border: 2px solid #7c3aed !important;
          box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.7) !important;
        }
        :global(.ReactCrop__drag-handle) {
          background-color: #7c3aed !important;
          width: 14px !important;
          height: 14px !important;
          border: 2px solid white !important;
          border-radius: 50% !important;
        }
        :global(.ReactCrop__drag-handle::after) {
          display: none !important;
        }
      `}</style>



    </div>
  );
}
