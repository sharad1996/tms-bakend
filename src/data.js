// In-memory demo data for shipments and users.

const shipments = [];

function createLocation(city, state, country) {
  return { city, state, country };
}

function createTrackingEvents(pickupLocation, deliveryLocation) {
  return [
    {
      timestamp: '2026-01-01T09:00:00Z',
      status: 'Picked up',
      location: pickupLocation,
    },
    {
      timestamp: '2026-01-02T14:30:00Z',
      status: 'In transit',
      location: createLocation('Transit Hub', pickupLocation.state, pickupLocation.country),
    },
    {
      timestamp: '2026-01-03T18:45:00Z',
      status: 'Out for delivery',
      location: deliveryLocation,
    },
  ];
}

for (let i = 1; i <= 30; i++) {
  const pickupLocation = createLocation('Dallas', 'TX', 'USA');
  const deliveryLocation = createLocation('Atlanta', 'GA', 'USA');

  shipments.push({
    id: String(i),
    reference: `REF-${1000 + i}`,
    shipperName: i % 2 === 0 ? 'Acme Corp' : 'Globex Logistics',
    carrierName: i % 3 === 0 ? 'FastTrack' : 'BlueSky Freight',
    pickupLocation,
    deliveryLocation,
    pickupDate: `2026-01-${(i % 28) + 1}`.padEnd(10, '0'),
    deliveryDate: `2026-02-${(i % 28) + 1}`.padEnd(10, '0'),
    status: i % 4 === 0 ? 'Delivered' : 'In Transit',
    trackingEvents: createTrackingEvents(pickupLocation, deliveryLocation),
    rate: 1200 + i * 15,
    currency: 'USD',
    serviceLevel: i % 2 === 0 ? 'Express' : 'Standard',
    isFlagged: i % 5 === 0,
  });
}

// Simple users for auth demo.
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // demo only
    role: 'ADMIN',
  },
  {
    id: '2',
    username: 'employee',
    password: 'employee123', // demo only
    role: 'EMPLOYEE',
  },
];

const shipmentsById = new Map(shipments.map((s) => [s.id, s]));

module.exports = {
  shipments,
  shipmentsById,
  users,
};

