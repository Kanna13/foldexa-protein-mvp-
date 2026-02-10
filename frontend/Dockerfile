FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start in dev mode for this environment
CMD ["npm", "run", "dev"]
