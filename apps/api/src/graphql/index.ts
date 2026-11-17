import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import { config } from "../config.js";
import { buildContext, type GraphqlContext } from "./context.js";
import { formatError } from "./errors.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export function createGraphqlMiddleware() {
  const server = new ApolloServer<GraphqlContext>({
    typeDefs,
    resolvers,
    formatError,
    introspection: config.NODE_ENV !== "production",
    plugins: [
      config.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  return expressMiddleware(server, { context: buildContext });
}
