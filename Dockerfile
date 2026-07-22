# Use the official lightweight Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including devDependencies required for the build)
RUN npm install

# Copy all application files
COPY . .

# Run the production build command (compiles Vite client & bundles the Express server.ts via esbuild)
RUN npm run build

# Cloud Run defaults of 8080 can be mapped, or the container can run on port 3000
EXPOSE 3000

# Start the application using the production script configured in package.json
CMD [ "npm", "run", "start" ]
