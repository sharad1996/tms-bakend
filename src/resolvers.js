const { shipments, shipmentsById, users } = require('./data');
const { generateToken, requireRole } = require('./auth');

function applyFilters(list, filter) {
  if (!filter) return list;
  return list.filter((s) => {
    if (filter.status && s.status !== filter.status) return false;
    if (filter.shipperName && !s.shipperName.toLowerCase().includes(filter.shipperName.toLowerCase()))
      return false;
    if (filter.carrierName && !s.carrierName.toLowerCase().includes(filter.carrierName.toLowerCase()))
      return false;
    if (typeof filter.isFlagged === 'boolean' && s.isFlagged !== filter.isFlagged) return false;

    const matchLocation = (locFilter, loc) => {
      if (!locFilter) return true;
      if (locFilter.city && loc.city !== locFilter.city) return false;
      if (locFilter.state && loc.state !== locFilter.state) return false;
      if (locFilter.country && loc.country !== locFilter.country) return false;
      return true;
    };

    if (!matchLocation(filter.pickupLocation, s.pickupLocation)) return false;
    if (!matchLocation(filter.deliveryLocation, s.deliveryLocation)) return false;

    return true;
  });
}

function applySorting(list, sortBy, sortOrder) {
  if (!sortBy) return list;
  const dir = sortOrder === 'DESC' ? -1 : 1;
  const sorted = [...list];

  sorted.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (sortBy === 'pickupDate' || sortBy === 'deliveryDate') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  return sorted;
}

function applyPagination(list, page = 1, pageSize = 10) {
  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return {
    items,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
  };
}

const resolvers = {
  Query: {
    me: (_, __, { user }) => user || null,

    shipments: (_, args) => {
      const { filter, sortBy, sortOrder, page, pageSize } = args;

      let list = shipments;
      list = applyFilters(list, filter);
      list = applySorting(list, sortBy, sortOrder);

      // Basic performance consideration: paginate on the server
      // to avoid sending too much data to the client.
      return applyPagination(list, page, pageSize);
    },

    shipment: (_, { id }) => {
      return shipmentsById.get(id) || null;
    },
  },

  Mutation: {
    login: (_, { username, password }) => {
      const user = users.find((u) => u.username === username && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      const token = generateToken(user);
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        token,
      };
    },

    addShipment: (_, { input }, context) => {
      requireRole(context, ['ADMIN']);

      const id = String(shipments.length + 1);
      const newShipment = {
        id,
        isFlagged: false,
        ...input,
      };
      shipments.push(newShipment);
      shipmentsById.set(id, newShipment);
      return newShipment;
    },

    updateShipment: (_, { id, input }, context) => {
      requireRole(context, ['ADMIN', 'EMPLOYEE']);

      const existing = shipmentsById.get(id);
      if (!existing) {
        throw new Error('Shipment not found');
      }
      Object.assign(existing, input);
      return existing;
    },

    deleteShipment: (_, { id }, context) => {
      requireRole(context, ['ADMIN']);
      const existing = shipmentsById.get(id);
      if (!existing) {
        return false;
      }
      const idx = shipments.findIndex((s) => s.id === id);
      if (idx !== -1) {
        shipments.splice(idx, 1);
      }
      shipmentsById.delete(id);
      return true;
    },

    toggleFlagShipment: (_, { id }, context) => {
      requireRole(context, ['ADMIN', 'EMPLOYEE']);
      const existing = shipmentsById.get(id);
      if (!existing) {
        throw new Error('Shipment not found');
      }
      existing.isFlagged = !existing.isFlagged;
      return existing;
    },
  },
};

module.exports = {
  resolvers,
};

