'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoType } from '@prisma/client';
import { Button } from './ui/button';
import { Camera, MapPin, Clock } from 'lucide-react';

/**
 * @typedef {Object} Photo
 * @property {File} file
 * @property {string} preview
 * @property {import('@prisma/client').PhotoType} type
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [timestamp]
 */

/**
 * @typedef {Object} PhotoUploadProps
 * @property {string} serviceId - The ID of the service
 * @property {Function} onUploadComplete - Callback function when upload is complete
 * @property {number} [maxPhotos=16] - Maximum number of photos allowed
 * @property {number} [currentPhotoCount=0] - Current number of photos
 */

/**
 * PhotoUpload component for handling photo uploads with geolocation and metadata
 * @param {PhotoUploadProps} props - Component props
 */
export function PhotoUpload({
  serviceId,
  onUploadComplete,
  maxPhotos = 16,
  currentPhotoCount = 0
}) {
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Request geolocation permission when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // Success callback - we'll get position when taking photos
        (error) => {
          console.warn('Geolocation permission denied:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = await Promise.all(
      Array.from(files).map(async (file) => {
        // Get current position
        let position = null;
        try {
          position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
        } catch (error) {
          console.warn('Failed to get location:', error);
        }

        return {
          file,
          preview: URL.createObjectURL(file),
          type: 'PRE_CLEAN', // Default to PRE_CLEAN
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
          timestamp: new Date().toISOString()
        };
      })
    );

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTypeChange = (index, type) => {
    setPhotos((prev) =>
      prev.map((photo, i) =>
        i === index ? { ...photo, type } : photo
      )
    );
  };

  const handleRemove = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const photoData = await Promise.all(
        photos.map(async (photo) => {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(photo.file);
          });

          return {
            base64,
            type: photo.type,
            latitude: photo.latitude,
            longitude: photo.longitude,
            timestamp: photo.timestamp
          };
        })
      );

      const response = await fetch(`/api/employee/services/${id}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ photos: photoData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload photos');
      }

      const result = await response.json();
      onUploadComplete(result.photos);
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const remainingSlots = maxPhotos - (currentPhotoCount + photos.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Upload Photos</h3>
          <p className="text-sm text-gray-500">
            {remainingSlots} slots remaining
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={remainingSlots <= 0}
        >
          <Camera className="w-4 h-4 mr-2" />
          Add Photos
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square overflow-hidden rounded-lg border">
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col h-full p-2">
                <div className="flex-1" />
                <div className="space-y-2">
                  <select
                    value={photo.type}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    className="w-full p-1 text-sm bg-white rounded"
                  >
                    <option value="PRE_CLEAN">Before</option>
                    <option value="POST_CLEAN">After</option>
                  </select>
                  <div className="flex items-center space-x-2 text-white text-sm">
                    {photo.latitude && photo.longitude ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4 text-gray-400" />
                    )}
                    {photo.timestamp && <Clock className="w-4 h-4" />}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photos.length > 0 && (
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
  );
}
