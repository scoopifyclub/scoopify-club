// Photo Upload and Sharing Component
// For service completion photos and customer sharing
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, Download, Share2, Camera, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const PhotoUpload = ({
  serviceId,
  customerId,
  onUploadComplete,
  onCancel,
  maxPhotos = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  ...props
}) => {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [shareData, setShareData] = useState({
    title: '',
    description: '',
    privacy: 'private'
  });
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    if (photos.length + validFiles.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    try {
      const newPhotos = await Promise.all(
        validFiles.map(async (file) => {
          const photoData = {
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file),
            uploaded: false,
            category: 'after', // Default to after photo
            description: '',
            tags: []
          };

          // Upload to server
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('serviceId', serviceId);
          formData.append('customerId', customerId);
          formData.append('category', photoData.category);

          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            return {
              ...photoData,
              uploaded: true,
              url: result.url,
              publicUrl: result.publicUrl
            };
          } else {
            throw new Error('Upload failed');
          }
        })
      );

      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const updatePhotoData = (photoId, updates) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, ...updates } : photo
    ));
  };

  const handleShare = async (photo) => {
    setSelectedPhoto(photo);
    setShareData({
      title: `Service completed on ${new Date().toLocaleDateString()}`,
      description: 'Check out the results of our weekly yard cleanup service!',
      privacy: 'public'
    });
    setShareModal(true);
  };

  const sharePhoto = async () => {
    if (!selectedPhoto) return;

    setUploading(true);
    try {
      const response = await fetch('/api/photos/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          ...shareData
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Photo shared successfully! Share URL: ${result.shareUrl}`);
        setShareModal(false);
      } else {
        throw new Error('Share failed');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadPhoto = async (photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download photo');
    }
  };

  const renderPhotoGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <Card key={photo.id} className="relative group">
          <CardContent className="p-2">
            <div className="relative aspect-square">
              <img
                src={photo.preview}
                alt={photo.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadPhoto(photo)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleShare(photo)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {photo.uploaded && (
                <Badge className="absolute top-2 right-2 bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Uploaded
                </Badge>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <Select
                value={photo.category}
                onValueChange={(value) => updatePhotoData(photo.id, { category: value })}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                  <SelectItem value="during">During</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Add description..."
                value={photo.description}
                onChange={(e) => updatePhotoData(photo.id, { description: e.target.value })}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderUploadArea = () => (
    <div
      ref={dropRef}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
        photos.length >= maxPhotos && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Upload Service Photos
      </h3>
      <p className="text-gray-600 mb-4">
        Drag and drop photos here, or click to select files
      </p>
      <div className="text-sm text-gray-500 mb-4">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Maximum file size: 5MB per photo</p>
        <p>Maximum photos: {maxPhotos}</p>
      </div>
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={photos.length >= maxPhotos}
      >
        <Camera className="w-4 h-4 mr-2" />
        Select Photos
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );

  const renderPhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Photo Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedPhoto.preview}
                  alt={selectedPhoto.name}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedPhoto.category}
                    onValueChange={(value) => updatePhotoData(selectedPhoto.id, { category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                      <SelectItem value="during">During</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedPhoto.description}
                    onChange={(e) => updatePhotoData(selectedPhoto.id, { description: e.target.value })}
                    placeholder="Describe what this photo shows..."
                  />
                </div>
                <div>
                  <Label>File Information</Label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Name: {selectedPhoto.name}</p>
                    <p>Size: {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Type: {selectedPhoto.type}</p>
                    <p>Status: {selectedPhoto.uploaded ? 'Uploaded' : 'Pending'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => downloadPhoto(selectedPhoto)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={() => handleShare(selectedPhoto)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderShareModal = () => {
    if (!shareModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Share Photo</CardTitle>
            <CardDescription>
              Share this photo with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={shareData.title}
                onChange={(e) => setShareData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for your shared photo"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={shareData.description}
                onChange={(e) => setShareData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
              />
            </div>
            <div>
              <Label>Privacy</Label>
              <Select
                value={shareData.privacy}
                onValueChange={(value) => setShareData(prev => ({ ...prev, privacy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Password Protected)</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={sharePhoto} disabled={uploading}>
                {uploading ? <LoadingSpinner size="sm" /> : <Share2 className="w-4 h-4 mr-2" />}
                Share Photo
              </Button>
              <Button variant="outline" onClick={() => setShareModal(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <LoadingOverlay isLoading={uploading} message="Uploading photos...">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Service Photos</h2>
              <p className="text-gray-600">
                Upload and manage photos from your service
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => onUploadComplete?.(photos)}
                disabled={photos.length === 0 || uploading}
              >
                Complete Upload ({photos.length} photos)
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          {photos.length < maxPhotos && renderUploadArea()}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Uploaded Photos ({photos.length}/{maxPhotos})
                </h3>
                <Badge variant={photos.every(p => p.uploaded) ? 'default' : 'secondary'}>
                  {photos.filter(p => p.uploaded).length} of {photos.length} uploaded
                </Badge>
              </div>
              {renderPhotoGrid()}
            </div>
          )}

          {/* Modals */}
          {renderPhotoModal()}
          {renderShareModal()}
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default PhotoUpload;
