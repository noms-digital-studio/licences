FROM node:14.16-buster-slim as common

RUN apt-get update && \
    apt-get upgrade -y

FROM common as builder
ARG BUILD_NUMBER
ARG GIT_REF

WORKDIR /app

RUN apt-get install -y curl

RUN curl https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem > /app/root.cert

COPY . .

RUN npm ci --no-audit && \
    npm run build && \
    export BUILD_NUMBER=${BUILD_NUMBER:-1_0_0} && \
    export GIT_REF=${GIT_REF:-dummy} && \
    npm run record-build-info

RUN npm prune --production

FROM common as release
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

# Create app directory
RUN mkdir /app && chown appuser:appgroup /app
USER 2000
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        /app/dist \
        /app/root.cert \
        /app/build-info.json \
        ./

COPY --from=builder --chown=appuser:appgroup \
        /app/assets ./assets

COPY --from=builder --chown=appuser:appgroup \
        /app/node_modules ./node_modules

COPY --from=builder --chown=appuser:appgroup \
        /app/server/views ./server/views

ENV PORT=3000

EXPOSE 3000

ENV NODE_ENV='production'

USER 2000

CMD [ "node", "server.js" ]
