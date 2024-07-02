import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const app = express();

const services = [
  {
    route: "/demo-a",
    target: "http://host.docker.internal:1001",
  },
  {
    route: "/demo-b",
    target: "http://host.docker.internal:1002",
  },
];

services.forEach(({ route, target }) => {
  const proxyOptions: Options = {
    target,
    changeOrigin: false,
    headers: {
      Connection: "keep-alive",
    },
    pathRewrite: {
      [`^${route}`]: "",
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        const token = req.headers.authorization;

        if (!token) {
          return;
        }

        // This should be a GRPC call to auth service to validate the token
        const isValid = token?.includes("bananas");

        if (!isValid) {
          res.writeHead(403, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "A valid access token is required...",
            })
          );

          return;
        }

        proxyReq.setHeader("x-user-id", "shabalaba");
      },
    },
  };

  app.use(route, createProxyMiddleware(proxyOptions));
});

app.listen(1003).on("error", (e) => {
  console.error(
    "An error occured while starting the server, please check the logs for more details.",
    e
  );
  process.exit(1);
});
