import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Image as ImageIcon, File, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'text';
  extractedText?: string;
}

interface PromptFileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  text: ['text/plain', 'text/markdown', 'text/csv', 'application/json']
};

const ALL_ACCEPTED = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.document, ...ACCEPTED_TYPES.text];

const getFileType = (mimeType: string): 'image' | 'document' | 'text' => {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return 'image';
  if (ACCEPTED_TYPES.document.includes(mimeType)) return 'document';
  return 'text';
};

const getFileIcon = (type: 'image' | 'document' | 'text') => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'document': return FileText;
    default: return File;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const PromptFileUpload: React.FC<PromptFileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds ${maxSizeMB}MB limit`,
        variant: "destructive"
      });
      return null;
    }

    // Validate type
    if (!ALL_ACCEPTED.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: `${file.name} is not a supported format`,
        variant: "destructive"
      });
      return null;
    }

    const fileType = getFileType(file.type);
    const uploadedFile: UploadedFile = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: fileType
    };

    // Create preview for images
    if (fileType === 'image') {
      uploadedFile.preview = URL.createObjectURL(file);
    }

    // Extract text from text files
    if (fileType === 'text') {
      try {
        const text = await file.text();
        uploadedFile.extractedText = text.slice(0, 5000); // Limit to 5000 chars
      } catch (e) {
        console.error('Error reading text file:', e);
      }
    }

    return uploadedFile;
  }, [maxSizeMB, toast]);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const availableSlots = maxFiles - files.length;
    
    if (availableSlots <= 0) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload up to ${maxFiles} files`,
        variant: "destructive"
      });
      return;
    }

    const filesToProcess = filesArray.slice(0, availableSlots);
    const processed: UploadedFile[] = [];

    for (const file of filesToProcess) {
      const result = await processFile(file);
      if (result) {
        processed.push(result);
      }
    }

    if (processed.length > 0) {
      onFilesChange([...files, ...processed]);
      toast({
        title: "Files uploaded",
        description: `${processed.length} file(s) added successfully`
      });
    }
  }, [files, maxFiles, onFilesChange, processFile, toast]);

  const removeFile = useCallback((id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALL_ACCEPTED.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={files.length >= maxFiles}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`p-2 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
            <Upload className={`h-5 w-5 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Add files to enhance your prompt'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images, PDFs, or text files • Max {maxSizeMB}MB each • {files.length}/{maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  layout
                >
                  <Card className="p-3 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {/* Preview/Icon */}
                      <div className="flex-shrink-0">
                        {file.type === 'image' && file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.file.name}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {file.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.file.size)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Text Preview */}
                    {file.extractedText && (
                      <div className="mt-2 p-2 bg-background/50 rounded text-xs text-muted-foreground max-h-20 overflow-y-auto">
                        {file.extractedText.slice(0, 200)}
                        {file.extractedText.length > 200 && '...'}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {files.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Attach images or documents to provide visual context for optimization
        </p>
      )}
    </div>
  );
};
