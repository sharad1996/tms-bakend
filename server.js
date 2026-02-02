const path = require('path');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs } = require('./src/schema');
const { resolvers } = require('./src/resolvers');
const { getUserFromToken } = require('./src/auth');

require('dotenv').config();

async function startServer() {
  const app = express();

  app.use(
    cors({
      origin: '*',
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());

  // Serve frontend as static assets
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      const user = getUserFromToken(token.replace('Bearer ', ''));
      return { user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚚 TMS backend running at http://localhost:${PORT}`);
    console.log(`🚀 GraphQL endpoint available at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🖥️  Frontend available at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

