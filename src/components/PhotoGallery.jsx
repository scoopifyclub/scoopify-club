import { MapPin, Clock } from 'lucide-react';

export function PhotoGallery({ photos, onDelete, canDelete = false }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    return (<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (<div key={photo.id} className="relative group">
          <div className="aspect-square overflow-hidden rounded-lg border">
            <img src={photo.url} alt={`${photo.type} photo`} className="object-cover w-full h-full"/>
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col h-full p-2">
              <div className="flex-1"/>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-white text-sm">
                  {photo.latitude && photo.longitude ? (<MapPin className="w-4 h-4"/>) : (<MapPin className="w-4 h-4 text-gray-400"/>)}
                  {photo.timestamp && (<>
                      <Clock className="w-4 h-4"/>
                      <span>{formatDate(photo.timestamp)}</span>
                    </>)}
                </div>
                {canDelete && onDelete && (<button onClick={() => onDelete(photo.id)} className="w-full px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">
                    Delete
                  </button>)}
              </div>
            </div>
          </div>
        </div>))}
    </div>);
}
