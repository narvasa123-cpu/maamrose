import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Paperclip } from 'lucide-react';

interface DocumentUploadProps {
  onUploadSuccess: (fileData: { name: string; size: number; type: string; url: string }) => void;
  allowedTypes?: string[];
  maxSizeMb?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  maxSizeMb = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMsg(`File size exceeds maximum allowed limit of ${maxSizeMb}MB.`);
      return;
    }

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload PDF, JPG, PNG, or JPEG documents.');
      return;
    }

    setUploading(true);
    setProgress(15);

    // Simulate progress upload
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setProgress(0);

            // Generate blob preview URL
            const previewUrl = URL.createObjectURL(file);
            onUploadSuccess({
              name: file.name,
              size: file.size,
              type: file.type,
              url: previewUrl
            });
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Drag & Drop supporting documents or <span className="text-blue-600 underline">Browse Files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports PDF, JPG, PNG, JPEG (Up to {maxSizeMb}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Uploading progress bar */}
      {uploading && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span>Uploading Attachment to Storage...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="flex-1 font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
