import React, { useState, useRef } from 'react';
import { compressImageToBase64, SAMPLE_AADHAAR_CARD } from '../../lib/utils';
import { Modal } from './Modal';
import {
  Upload,
  Camera,
  Eye,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface IdPhotoUploaderProps {
  value?: string;
  onChange: (base64Photo: string) => void;
  documentType?: string;
  className?: string;
}

export const IdPhotoUploader: React.FC<IdPhotoUploaderProps> = ({
  value,
  onChange,
  documentType = 'Aadhaar Card',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    try {
      setIsProcessing(true);
      const compressed = await compressImageToBase64(file, 900, 600, 0.78);
      onChange(compressed);
    } catch (err: any) {
      alert(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const loadSampleCard = () => {
    onChange(SAMPLE_AADHAAR_CARD);
  };

  const removePhoto = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* If Photo is present */}
      {value ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-teal-100 text-teal-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {documentType} Attached
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Stored locally in demo session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition"
                title="View full-size photo"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                View Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                title="Replace photo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Card Thumbnail Preview */}
          <div
            onClick={() => setPreviewOpen(true)}
            className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xs flex items-center justify-center max-h-48"
          >
            <img
              src={value}
              alt="Uploaded Government ID"
              className="w-full h-44 object-contain transition group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-2xs">
              <span className="bg-white/95 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-600" /> Click to Inspect Full ID
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 transition text-center ${
            dragActive
              ? 'border-teal-500 bg-teal-50/50'
              : 'border-slate-300 bg-slate-50/70 hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-2xs">
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                Upload {documentType} Photo / Scan
              </p>
              <p className="text-[11px] text-slate-500">
                Drag and drop image here, or browse from computer / camera (JPG, PNG, WebP)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs shadow-2xs transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                Select Photo
              </button>

              <button
                type="button"
                onClick={loadSampleCard}
                disabled={isProcessing}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3 py-1.5 rounded-xl text-xs shadow-2xs transition active:scale-95"
                title="Instant 1-click test with official format Aadhaar card mockup"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Use Sample Aadhaar Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal to View Card in Large View */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Inspecting Document: ${documentType}`}
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-teal-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span className="font-semibold">
                Government Identity Document Verified for Hotel Form C Register
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              Session Stored
            </span>
          </div>

          <div className="bg-slate-900/5 p-4 rounded-2xl flex items-center justify-center border border-slate-200 max-h-[500px] overflow-auto">
            {value && (
              <img
                src={value}
                alt="Document Full Preview"
                className="max-w-full max-h-[460px] object-contain rounded-lg shadow-md"
              />
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">
              Uploaded photo preview • Ready for guest registration folio
            </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
            >
              Done Viewing
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
