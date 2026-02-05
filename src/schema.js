const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum Role {
    ADMIN
    EMPLOYEE
  }

  type Permission {
    addShipment: Boolean!
    updateShipment: Boolean!
    deleteShipment: Boolean!
    viewAllShipments: Boolean!
    viewDetailedReports: Boolean!
    manageUsers: Boolean!
    flagShipment: Boolean!
  }

  type User {
    id: ID!
    username: String!
    role: Role!
    token: String
    permissions: Permission!
  }

  type Location {
    city: String!
    state: String!
    country: String!
  }

  type TrackingEvent {
    timestamp: String!
    status: String!
    location: Location!
  }

  type Shipment {
    id: ID!
    reference: String!
    shipperName: String!
    carrierName: String!
    pickupLocation: Location!
    deliveryLocation: Location!
    pickupDate: String!
    deliveryDate: String!
    status: String!
    trackingEvents: [TrackingEvent!]!
    rate: Float!
    currency: String!
    serviceLevel: String!
    isFlagged: Boolean!
  }

  input LocationFilterInput {
    city: String
    state: String
    country: String
  }

  input ShipmentFilterInput {
    status: String
    shipperName: String
    carrierName: String
    pickupLocation: LocationFilterInput
    deliveryLocation: LocationFilterInput
    isFlagged: Boolean
  }

  enum ShipmentSortField {
    pickupDate
    deliveryDate
    shipperName
    carrierName
    rate
  }

  enum SortOrder {
    ASC
    DESC
  }

  type ShipmentPage {
    items: [Shipment!]!
    totalCount: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  input LocationInput {
    city: String!
    state: String!
    country: String!
  }

  input TrackingEventInput {
    timestamp: String!
    status: String!
    location: LocationInput!
  }

  input ShipmentInput {
    reference: String!
    shipperName: String!
    carrierName: String!
    pickupLocation: LocationInput!
    deliveryLocation: LocationInput!
    pickupDate: String!
    deliveryDate: String!
    status: String!
    trackingEvents: [TrackingEventInput!]!
    rate: Float!
    currency: String!
    serviceLevel: String!
    isFlagged: Boolean
  }

  input ShipmentUpdateInput {
    reference: String
    shipperName: String
    carrierName: String
    pickupLocation: LocationInput
    deliveryLocation: LocationInput
    pickupDate: String
    deliveryDate: String
    status: String
    trackingEvents: [TrackingEventInput!]
    rate: Float
    currency: String
    serviceLevel: String
    isFlagged: Boolean
  }

  type Query {
    me: User
    shipments(
      filter: ShipmentFilterInput
      sortBy: ShipmentSortField
      sortOrder: SortOrder = ASC
      page: Int = 1
      pageSize: Int = 10
    ): ShipmentPage!

    shipment(id: ID!): Shipment
  }

  type Mutation {
    login(username: String!, password: String!): User!

    addShipment(input: ShipmentInput!): Shipment!
    updateShipment(id: ID!, input: ShipmentUpdateInput!): Shipment!
    deleteShipment(id: ID!): Boolean!
    toggleFlagShipment(id: ID!): Shipment!
  }
`;

module.exports = {
  typeDefs,
};

