FROM node:19

RUN npm i -g pnpm

WORKDIR /usr/src/bot

ADD ./package.json .
ADD ./pnpm-lock.yaml .

RUN pnpm i

ADD src/ ./src/

ADD tsconfig.json .
RUN pnpm run build

CMD pnpm run start