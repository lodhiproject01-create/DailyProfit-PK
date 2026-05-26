'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  RefreshCw, 
  Image as ImageIcon, 
  FileText,
  DollarSign
} from 'lucide-react';

// ==========================================
// 1. UPLOAD PROGRESS BAR COMPONENT
// ==========================================
export function UploadProgressBar({ progress, status = 'uploading' }) {
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between items-center mb-1 text-xs font-semibold">
        <span className={
          isSuccess ? "text-emerald-400" : isError ? "text-rose-400" : "text-cyan-400 animate-pulse"
        }>
          {isSuccess ? "Upload Successful!" : isError ? "Upload Failed" : "Uploading Proof..."}
        </span>
        <span className="text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div 
          className={`h-full rounded-full bg-gradient-to-r ${
            isSuccess 
              ? "from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              : isError 
              ? "from-rose-500 to-red-600" 
              : "from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ==========================================
// 2. DRAG & DROP UPLOADER COMPONENT
// ==========================================
export function DragDropUploader({ 
  onFileSelect, 
  acceptTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeMB = 5,
  multiple = false,
  disabled = false
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptTypes.includes(file.type)) {
      return "Invalid file format. Please upload a JPG, PNG, or WEBP image.";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size is too large. Maximum size allowed is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const selectedFiles = multiple ? files : [files[0]];
      
      const validationErrors = selectedFiles
        .map(validateFile)
        .filter(err => err !== null);

      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return;
      }

      setError(null);
      onFileSelect(multiple ? selectedFiles : selectedFiles[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      const selectedFiles = multiple ? files : [files[0]];
      
      const validationErrors = selectedFiles
        .map(validateFile)
        .filter(err => err !== null);

      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return;
      }

      setError(null);
      onFileSelect(multiple ? selectedFiles : selectedFiles[0]);
    }
  };

  const onButtonClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full py-8 px-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
        disabled 
          ? "border-gray-800 bg-gray-950/20 cursor-not-allowed opacity-55"
          : isDragActive
          ? "border-cyan-500 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          : "border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50 cursor-pointer"
      }`}
      onClick={onButtonClick}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        multiple={multiple} 
        onChange={handleChange}
        accept={acceptTypes.join(',')}
        disabled={disabled}
      />
      
      <motion.div 
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className="p-4 bg-gray-900/80 rounded-full border border-gray-800 text-cyan-400 mb-3 shadow-lg"
      >
        <UploadCloud className="w-8 h-8" />
      </motion.div>

      <span className="text-gray-200 font-semibold text-sm mb-1 text-center">
        {isDragActive ? "Drop your proof here!" : "Drag & drop file or tap to browse"}
      </span>
      <span className="text-gray-500 text-xs mb-3 text-center">
        Supports JPG, PNG, and WEBP (Max {maxSizeMB}MB)
      </span>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 border border-rose-900/50 rounded-lg text-rose-400 text-xs font-medium text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}

// ==========================================
// 3. IMAGE PREVIEW MODULE
// ==========================================
export function CloudinaryImagePreview({ url, onRemove, label = "Payment Proof Preview" }) {
  return (
    <div className="relative w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          {label}
        </span>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition shadow"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border border-gray-800 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt="Cloudinary Upload Preview" 
          className="w-full h-full object-contain max-h-[220px]"
        />
      </div>
      
      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mt-3 bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-900/30">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>Stored securely in Cloudinary CDN!</span>
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN IMAGE UPLOADER COMPONENT
// ==========================================
export function ImageUploader({ 
  onUploadSuccess, 
  imageType = 'general', 
  userId = 'anonymous',
  label = "Upload Screenshot"
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setProgress(0);
    setStatus('idle');
    setErrorMsg(null);
    
    // Auto-trigger secure upload
    uploadToCloudinary(selectedFile);
  };

  const uploadToCloudinary = async (selectedFile) => {
    setStatus('uploading');
    setProgress(15);
    
    const interval = setInterval(() => {
      setProgress(p => (p < 85 ? p + 8 : p));
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('imageType', imageType);
      formData.append('userId', userId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success) {
        setProgress(100);
        setStatus('success');
        if (onUploadSuccess) {
          onUploadSuccess({
            image_url: data.image_url,
            public_id: data.public_id,
            upload_time: data.upload_time,
            uploaded_by: data.uploaded_by,
            image_type: data.image_type
          });
        }
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      clearInterval(interval);
      setStatus('error');
      setErrorMsg(err.message || 'Network error occurred');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setStatus('idle');
    setErrorMsg(null);
    if (onUploadSuccess) onUploadSuccess(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {status === 'success' ? (
              <CloudinaryImagePreview 
                url={preview} 
                onRemove={handleReset} 
                label={label}
              />
            ) : (
              <div className="w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 flex flex-col items-center">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border border-gray-800 flex items-center justify-center mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Uploading..." className="w-full h-full object-contain max-h-[160px] opacity-45" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'error' ? (
                      <div className="flex flex-col items-center gap-1.5 text-rose-400">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs font-semibold">Upload failed</span>
                      </div>
                    ) : (
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    )}
                  </div>
                </div>

                {status === 'error' && (
                  <div className="w-full flex flex-col gap-2">
                    <p className="text-xs text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 text-center font-medium">
                      {errorMsg}
                    </p>
                    <button 
                      onClick={() => uploadToCloudinary(file)}
                      className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Upload
                    </button>
                  </div>
                )}

                {status === 'uploading' && (
                  <UploadProgressBar progress={progress} status={status} />
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DragDropUploader onFileSelect={handleFileSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 5. PAYMENT SCREENSHOT SYSTEM CARD
// ==========================================
export function ScreenshotUploadCard({ onUploadSuccess, userId, defaultMethod = "EasyPaisa" }) {
  return (
    <div className="w-full bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-md font-bold text-white">Payment Screenshot</h4>
          <p className="text-gray-400 text-xs">Upload deposit proof snapshot via {defaultMethod}</p>
        </div>
      </div>

      <ImageUploader 
        imageType="deposits" 
        userId={userId} 
        onUploadSuccess={onUploadSuccess}
        label={`${defaultMethod} Receipt`}
      />
    </div>
  );
}

// ==========================================
// 6. PROFILE IMAGE UPLOADER COMPONENT
// ==========================================
export function ProfileImageUploader({ currentUrl, onUploadSuccess, userId }) {
  const [preview, setPreview] = useState(currentUrl || '/avatar-placeholder.png');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', 'profile');
        formData.append('userId', userId);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        
        if (data.success) {
          setPreview(data.image_url);
          if (onUploadSuccess) {
            onUploadSuccess({
              image_url: data.image_url,
              public_id: data.public_id,
              upload_time: data.upload_time,
              uploaded_by: data.uploaded_by,
              image_type: 'profile'
            });
          }
        } else {
          alert(data.error || 'Failed to upload profile picture');
        }
      } catch (err) {
        console.error(err);
        alert('Error uploading profile picture');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div 
        onClick={() => !isUploading && fileInputRef.current.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/60 hover:border-cyan-400 bg-gray-900 flex items-center justify-center cursor-pointer group shadow-2xl transition-all duration-300"
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp" 
          onChange={handleSelect}
          disabled={isUploading}
        />
        
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={preview} 
          alt="Avatar" 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
        />

        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {isUploading ? (
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-xs font-semibold text-gray-400 tracking-wide block mb-0.5">
          {isUploading ? "Uploading Avatar..." : "Tap avatar to change picture"}
        </span>
        <span className="text-[10px] text-gray-500">Supports JPG, PNG, WEBP (Max 2MB)</span>
      </div>
    </div>
  );
}
