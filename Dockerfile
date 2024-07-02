FROM node:alpine AS build

WORKDIR /usr/src/app

COPY package.json .

COPY yarn.lock .

RUN yarn install

COPY . .

RUN yarn build

FROM node:alpine AS production

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .

COPY yarn.lock .

RUN yarn install --production=true --frozen-lockfile --non-interactive

COPY --from=build /usr/src/app/dist ./dist

CMD ["node", "dist/app.js"]
