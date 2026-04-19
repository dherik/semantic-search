FROM node:18-alpine

WORKDIR /app

ARG BACKEND_URL=http://localhost:3001
ENV BACKEND_URL=$BACKEND_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
