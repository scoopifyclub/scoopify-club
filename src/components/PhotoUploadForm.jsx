'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    Camera, 
    Upload, 
    X, 
    CheckCircle, 
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';

export default function PhotoUploadForm({ serviceId, onPhotosUploaded }) {
    const [photos, setPhotos] = useState({
        BEFORE: [],
        AFTER: [],
        GATE: []
    });
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const requiredPhotos = {
        BEFORE: 4,
        AFTER: 4,
        GATE: 1
    };

    const getPhotoCount = (type) => photos[type].length;
    const getPhotoStatus = (type) => {
        const count = getPhotoCount(type);
        const required = requiredPhotos[type];
        
        if (count === 0) return 'missing';
        if (count < required) return 'incomplete';
        if (count === required) return 'complete';
        return 'excess';
    };

    const getStatusColor = (type) => {
        const status = getPhotoStatus(type);
        switch (status) {
            case 'missing': return 'bg-red-100 text-red-800';
            case 'incomplete': return 'bg-yellow-100 text-yellow-800';
            case 'complete': return 'bg-green-100 text-green-800';
            case 'excess': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (type) => {
        const status = getPhotoStatus(type);
        switch (status) {
            case 'missing': return <AlertCircle className="w-4 h-4" />;
            case 'incomplete': return <AlertCircle className="w-4 h-4" />;
            case 'complete': return <CheckCircle className="w-4 h-4" />;
            case 'excess': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFiles = (files) => {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // For demo purposes, we'll create mock photo objects
        // In production, you'd upload to S3 or similar and get URLs back
        const newPhotos = validFiles.map(file => ({
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: 'BEFORE' // Default type, user can change
        }));

        // Add to BEFORE photos by default
        setPhotos(prev => ({
            ...prev,
            BEFORE: [...prev.BEFORE, ...newPhotos]
        }));

        toast.success(`Added ${validFiles.length} photo(s)`);
    };

    const removePhoto = (type, photoId) => {
        setPhotos(prev => ({
            ...prev,
            [type]: prev[type].filter(p => p.id !== photoId)
        }));
    };

    const changePhotoType = (photoId, oldType, newType) => {
        setPhotos(prev => ({
            ...prev,
            [oldType]: prev[oldType].filter(p => p.id !== photoId),
            [newType]: [...prev[newType], prev[oldType].find(p => p.id === photoId)]
        }));
    };

    const canSubmit = () => {
        return Object.entries(requiredPhotos).every(([type, required]) => 
            getPhotoCount(type) >= required
        );
    };

    const handleSubmit = async () => {
        if (!canSubmit()) {
            toast.error('Please upload all required photos');
            return;
        }

        setUploading(true);
        try {
            // Prepare photo data for API
            const photoData = Object.entries(photos).flatMap(([type, photoList]) =>
                photoList.map(photo => ({
                    url: photo.url, // In production, this would be the uploaded URL
                    type: type,
                    description: photo.name
                }))
            );

            const response = await fetch(`/api/employee/services/${serviceId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photos: photoData,
                    serviceId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload photos');
            }

            const result = await response.json();
            toast.success('Photos uploaded successfully!');
            
            if (onPhotosUploaded) {
                onPhotosUploaded(result.photos);
            }

            // Clear photos after successful upload
            setPhotos({ BEFORE: [], AFTER: [], GATE: [] });

        } catch (error) {
            toast.error(error.message || 'Failed to upload photos');
            console.error('Photo upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Photo Requirements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(requiredPhotos).map(([type, required]) => (
                            <div key={type} className="text-center p-4 border rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {getStatusIcon(type)}
                                    <span className="font-medium">{type}</span>
                                </div>
                                <Badge className={getStatusColor(type)}>
                                    {getPhotoCount(type)} / {required}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Photo Upload Area */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Photos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                            Drag and drop photos here
                        </p>
                        <p className="text-gray-600 mb-4">
                            or click to browse files
                        </p>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Choose Files
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Photo Management */}
            {Object.entries(photos).some(([type, photoList]) => photoList.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(photos).map(([type, photoList]) => (
                                photoList.length > 0 && (
                                    <div key={type}>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            {type} Photos ({photoList.length})
                                            <Badge className={getStatusColor(type)}>
                                                {getPhotoStatus(type)}
                                            </Badge>
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {photoList.map((photo) => (
                                                <div key={photo.id} className="relative group">
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.name}
                                                        className="w-full h-24 object-cover rounded-lg border"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => removePhoto(type, photo.id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="mt-2">
                                                        <select
                                                            value={type}
                                                            onChange={(e) => changePhotoType(photo.id, type, e.target.value)}
                                                            className="w-full text-xs p-1 border rounded"
                                                        >
                                                            <option value="BEFORE">Before</option>
                                                            <option value="AFTER">After</option>
                                                            <option value="GATE">Gate</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit() || uploading}
                    className="flex items-center gap-2"
                    size="lg"
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Upload Photos
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
