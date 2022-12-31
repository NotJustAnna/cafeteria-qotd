FROM node:16-alpine AS build

RUN apk update && apk add python3 make g++ curl bash && rm -rf /var/cache/apk/*

WORKDIR /app

COPY . ./

# Part 1. Install & Build
RUN yarn install --non-interactive --frozen-lockfile && yarn build && \
# Part 2. Reinstall with --production flag
    rm -rf src node_modules && yarn install --non-interactive --frozen-lockfile --prod --ignore-optional
# Part 3. Cleanup as much as possible
    # yarn cache clean && yarn cache clean --mirror && rm -rf /root/.cache node_modules/@types

FROM node:16-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

ENTRYPOINT ["node", "dist/index.js"]
