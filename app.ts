import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const services = [
  {
    route: "/demo-a",
    target: "http://localhost:1001/",
  },
  {
    route: "/demo-b",
    target: "http://localhost:1002/",
  },
];

services.forEach(({ route, target }) => {
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: "",
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
