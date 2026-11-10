'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadJobPhoto, JobApiError } from '@/lib/job-api-client';

/**
 * Before/after photo picker for an in-progress job. Photos up to 4 MB go
 * through the API; larger ones (up to 10 MB) go straight to S3.
 */
export function ServicePhotoUpload({ serviceId, type = 'AFTER', onUploadComplete, existingCount = 0, required = 4 }) {
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const label = type === 'BEFORE' ? 'Before' : type === 'AFTER' ? 'After' : 'Service';

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setPreviews((prev) => [
      ...prev,
      ...files.map((file, i) => ({
        id: `preview-${Date.now()}-${i}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
        type,
      })),
    ]);
  };

  const removePreview = (id) => {
    setPreviews((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }
    setIsUploading(true);
    try {
      for (const preview of previews) {
        await uploadJobPhoto(serviceId, preview.file, type);
      }
      toast.success(`${label} photos uploaded`);
      previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      setPreviews([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error(error instanceof JobApiError ? error.message : 'Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Upload {label} Photos</h3>
              <p className="text-sm text-gray-500">
                {existingCount} of {required} uploaded
                {previews.length > 0 ? ` · ${previews.length} ready` : ''}
              </p>
            </div>
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
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
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
                    alt={`${label} photo preview`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
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
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
