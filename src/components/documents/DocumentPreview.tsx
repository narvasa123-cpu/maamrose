import React from 'react';
import { Modal } from '../common/Modal';
import { DocumentAttachment } from '../../types';
import { Download, ExternalLink, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (docId: string) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose,
  onDelete
}) => {
  if (!document) return null;

  const isPdf = document.type.includes('pdf') || document.name.endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.name}
      subtitle={`Uploaded by ${document.uploadedBy} • ${(document.size / 1024 / 1024).toFixed(2)} MB`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Preview Viewport */}
        <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[380px] max-h-[600px] flex items-center justify-center p-2 relative">
          {isPdf ? (
            <iframe
              src={document.url}
              title={document.name}
              className="w-full h-[500px] rounded-lg border-0 bg-white"
            />
          ) : (
            <img
              src={document.url}
              alt={document.name}
              className="max-h-[500px] max-w-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Uploaded At: </span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              {new Date(document.uploadedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(document.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 font-semibold flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Attachment</span>
              </button>
            )}

            <a
              href={document.url}
              download={document.name}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};
