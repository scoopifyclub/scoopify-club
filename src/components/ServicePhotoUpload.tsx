'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ServicePhotoUploadProps {
  serviceId: string;
  type: 'BEFORE' | 'AFTER';
  onUploadComplete: () => void;
}

export function ServicePhotoUpload({ serviceId, type, onUploadComplete }: ServicePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length !== 4) {
        toast.error('Please select exactly 4 photos');
        return;
      }
      setPhotos(files);
    }
  };

  const handleUpload = async () => {
    if (photos.length !== 4) {
      toast.error('Please select exactly 4 photos');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = photos.map((file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', `${type}_CORNER${index + 1}`);
        formData.append('serviceId', serviceId);

        return fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });
      });

      await Promise.all(uploadPromises);
      toast.success('Photos uploaded successfully');
      onUploadComplete();
      setPhotos([]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((corner) => (
          <div
            key={corner}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center"
          >
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Corner {corner}</span>
            {photos[corner - 1] && (
              <span className="text-xs text-green-600 mt-1">
                {photos[corner - 1].name}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id={`photo-upload-${type}`}
        />
        <label
          htmlFor={`photo-upload-${type}`}
          className="flex-1"
        >
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Photos
          </Button>
        </label>

        <Button
          onClick={handleUpload}
          disabled={photos.length !== 4 || uploading}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </Button>
      </div>
    </div>
  );
} 