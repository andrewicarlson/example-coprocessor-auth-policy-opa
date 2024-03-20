import express from "express";
import fetch from "node-fetch";

const app = express();

/**
 * This currently does not enforce authentication via a JWT or other token for the sake of simplicity.
 * In a real code base, you would likely have a consumer provided token in a header which would be passed down to the "auth service", not the hard coding that this example does
 */
const processSupergraphRequestStage = async (payload) => {
  if (!payload.context.entries["apollo_authorization::policies::required"]) {
    return payload
  }

  // Get the unevaluated policies
  const policyEntries = Object.keys(payload.context.entries["apollo_authorization::policies::required"]);

  // Send the list of policies downstream to the auth service
  const response = await fetch("http://localhost:8181/v1/data", {
    method: "POST",
    body: JSON.stringify({
      input: {
        headers: {
          authorization: payload.headers.authorization ? payload.headers.authorization[0] : null
        },
        policyEntries
      }
    }),
  }).then((res) => res.json());

  const responseKeys = Object.keys(response.result)

  Object.entries(response.result).forEach(([policyKey, policyValue]) => {
    payload.context.entries["apollo_authorization::policies::required"][policyValue.authorization_key] = policyValue.allow
  });

  return payload;
};

app.post("/", express.json(), async (req, res) => {
  const payload = req.body;

  let response = payload;
  switch (payload.stage) {
    case "SupergraphRequest":
      response = await processSupergraphRequestStage(payload);
      break;
  }

  res.send(response);
});

app.listen(3007, () => {
  console.log("🚀 Server running at http://localhost:3007");
});
