export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum Currency {
    USD
    UAH
  }

  enum ProductStatus {
    FREE
    IN_REPAIR
    IN_USE
  }

  type Money {
    symbol: Currency!
    value: Float!
    isDefault: Boolean!
  }

  type Guarantee {
    start: DateTime!
    end: DateTime!
  }

  type OrderRef {
    id: ID!
    title: String!
  }

  type GroupRef {
    id: ID!
    title: String!
  }

  type UserRef {
    id: ID!
    name: String!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    avatarUrl: String
  }

  type Product {
    id: ID!
    serialNumber: String!
    isNew: Boolean!
    photo: String
    title: String!
    type: String!
    specification: String!
    status: ProductStatus!
    guarantee: Guarantee!
    date: DateTime!
    prices: [Money!]!
    order: OrderRef!
    group: GroupRef
    user: UserRef
  }

  type Order {
    id: ID!
    title: String!
    description: String
    date: DateTime!
    createdAt: DateTime!
    productsCount: Int!
    totals: [Money!]!
    products: [Product!]!
  }

  input PriceInput {
    symbol: Currency!
    value: Float!
    isDefault: Boolean
  }

  input CreateOrderInput {
    title: String!
    description: String
    date: DateTime
  }

  input CreateProductInput {
    orderId: ID!
    serialNumber: String!
    title: String!
    type: String!
    specification: String!
    isNew: Boolean
    status: ProductStatus
    photo: String
    guaranteeStart: DateTime!
    guaranteeEnd: DateTime!
    date: DateTime
    prices: [PriceInput!]!
  }

  type Query {
    me: User!
    orders(search: String): [Order!]!
    order(id: ID!): Order
    products(type: String, search: String, orderId: ID): [Product!]!
    productTypes: [String!]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    deleteOrder(id: ID!): Boolean!
    createProduct(input: CreateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
