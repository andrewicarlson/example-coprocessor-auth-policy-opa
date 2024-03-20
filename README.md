# Authorization using `@policy` and a Coprocessor

This repository demonstrates how to setup a coprocessor with the Router to evaluate policy-based authorization with the `@policy` directive. Note that this repo currently does not enforce authentication via a JWT or other token for the sake of simplicity. In a real code base, you would likely have a consumer provided token in a header which would be passed down to the "auth service", not the hard coding that this example does.

## Running the Example

### Running OPA

1. [Download and install OPA](https://www.openpolicyagent.org/docs/latest/#1-download-opa)
1. From the project directory, run OPA as a server using `~/opa run --addr localhost:8181 -w -s policies`

### Apollo Enterprise Trial

1. Start an [Enterprise Trial](https://studio.apollographql.com/signup?type=enterprise-trial_) for the authorization directives
1. In [Apollo Studio](https://studio.apollographql.com/) create a new graph and ensure that 'Supergraph' is selected for 'Graph Architecture'.
1. In the next overlay screen, copy the `APOLLO_KEY` and the Graph reference. It should look something like `My-Graph-5-2jlmak@current`
1. Create `/router/.env` based on `/router/.env.example` which exports the `APOLLO_KEY` and `APOLLO_GRAPH_REF` previously copied.

### Create subgraphs

1. Publish the schema using the following command
```
APOLLO_KEY={{YOUR APOLLO_KEY HERE}} \
  rover subgraph publish {{YOUR GRAPH_REF HERE}} \
  --schema ./subgraph/src/schema/Query.graphql \
  --name subgraph \
  --routing-url http://localhost:4001/graphql
```
1. Run the subgraph from the `/subgraph` directory with `npm i && run dev`

### Run the router

1. Run the coprocessor from the `/coprocessor` directory with `npm i && npm run dev`
1. In the `/router` directory, download the router by running `./download_router.sh`
1. In the `/router` directory, compose the schema by running `./create_local_schema.sh`
1. In the `/router` directory, run the router by running `./start_router.sh`

### Test the requests

 Now if you run this code in the browser (http://127.0.0.1:4000/), you will be able to query the router. For example, issue a query without a authorization header and note the failure, then test with a query that uses a bearer token in the Authorization header using this JWT which contains a "user" role.

 ```
 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoidXNlciJ9.04wRHoeP0SL7-IWcxX-KFt6fgXT8urkjy8vyEwB0Gbc
 ```

## Code Highlights

### Router Configuration

In `router/router-config.yaml`, the coprocessor is configured with the Router to be called on the `supergraph` `request` stage.

Additionally, `authorization` directives are enabled.

### Coprocessor

In `coprocessor/src/index.js`, the coprocessor is setup with `express` to listen to the `/` POST endpoint and respond to the `SupergraphRequest` stage.

In the `processSupergraphRequestStage` function, the unevaluated policies are pulled from the context, sent to the auth service to be evaluated, and the resulting evaluated policies are mapped back into the payload for the Router.
