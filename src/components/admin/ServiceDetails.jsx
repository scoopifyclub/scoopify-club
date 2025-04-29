import React from 'react';

const ServiceDetails = ({ service }) => {
  if (!service) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Service Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Service Information</h3>
          <p>ID: {service.id}</p>
          <p>Status: {service.status}</p>
          <p>Created: {new Date(service.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <h3 className="font-semibold">Customer Information</h3>
          <p>Name: {service.customer?.name}</p>
          <p>Email: {service.customer?.email}</p>
          <p>Phone: {service.customer?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails; 