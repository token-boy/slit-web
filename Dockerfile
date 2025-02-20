FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .
RUN pnpm i

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
