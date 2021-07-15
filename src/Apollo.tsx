import { useEffect, useState, useRef } from "react";
import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink, NormalizedCacheObject, split } from "@apollo/client";
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { config } from "./config";
import { setContext } from "apollo-link-context";

const ApolloComp = ({ children }) => {
    const isInit = useRef(true);
    let initClient: ApolloClient<NormalizedCacheObject> | undefined = undefined;
    const [client, setClient] = useState(initClient);

    const setupApollo = () => {
        const cache = new InMemoryCache();
        const httpLink = new HttpLink({
            uri: config.graphql,
            credentials: "same-origin"
        });
        const wsLink = new WebSocketLink({
            uri: config.wsGraphql,
            options: {
                reconnect: true
            }
        });
        const authLink = setContext((_, { headers }) => {
            let obj = { ...headers };
            return {
                headers: obj
            };
        });
        // const link = authLink.concat(httpLink as any) as any
        const link = split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
              );
            },
            wsLink,
            authLink.concat(httpLink as any) as any,
          );
        setClient(new ApolloClient({ cache, link }) as any)
    }

    const initConfig = async () => {
        // console.log('aaaa')
        setupApollo()
        isInit.current = false;
    };
    useEffect(() => {
        initConfig();
    },[]);
    return !!client ?
        (
            <ApolloProvider client={client as any}>
                {children}
            </ApolloProvider>
        ) : (
            <span>Đang tải ... </span>
        )
};
export default ApolloComp
