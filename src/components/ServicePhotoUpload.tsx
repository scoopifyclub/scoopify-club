'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface ServicePhotoUploadProps {
  serviceId: string;
  onUploadComplete: () => void;
}

interface PhotoPreview {
  id: string;
  url: string;
  type: 'BEFORE' | 'AFTER';
}

export default function ServicePhotoUpload({ serviceId, onUploadComplete }: ServicePhotoUploadProps) {
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: PhotoPreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push({
            id: `preview-${Date.now()}-${i}`,
            url: e.target.result as string,
            type: 'AFTER'
          });
          
          if (newPreviews.length === files.length) {
            setPreviews(prev => [...prev, ...newPreviews]);
          }
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (previews.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      previews.forEach((preview, index) => {
        // Convert base64 to blob
        const base64Data = preview.url.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        formData.append(`photos`, blob, `photo-${index}.jpg`);
      });

      const response = await fetch(`/api/employee/services/${serviceId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }

      toast.success('Photos uploaded successfully');
      setPreviews([]);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const removePreview = (id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upload Service Photos</h3>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Photos
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview) => (
                <div key={preview.id} className="relative group">
                  <img
                    src={preview.url}
                    alt="Service photo preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePreview(preview.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {previews.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 