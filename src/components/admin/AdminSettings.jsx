import React from 'react';

export default function AdminSettings() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">General Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Site Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                defaultValue="Scoopify Club"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                defaultValue="services@scoopify.club"
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Notification Settings</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                defaultChecked
              />
              <label className="ml-2 block text-sm text-gray-900">Email Notifications</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                defaultChecked
              />
              <label className="ml-2 block text-sm text-gray-900">SMS Notifications</label>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 