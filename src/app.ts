import express, { Request, Response } from "express";
import apicache from "apicache-plus";
import { rateLimit } from "express-rate-limit";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const app = express();

const disallowedRoutes = ["/demo-a/route-c", "/demo-b/route-c"];

const services = [
  {
    route: "/demo-a",
    target: "http://localhost:1001",
  },
  {
    route: "/demo-b",
    target: "http://localhost:1002",
  },
];

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: false,
  legacyHeaders: false,
  requestWasSuccessful: (req, res) => res.statusCode < 400,
  skip: (req, res) => disallowedRoutes.includes(req.path),
  handler: (req, res, next, options) =>
    res.status(options.statusCode).send({ message: options.message }),
});

app.use(limiter);

apicache.options({ debug: true });

const cache = apicache(
  "1 minutes",
  (req: Request, res: Response) => req.method === "GET"
);

app.use(cache);

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
