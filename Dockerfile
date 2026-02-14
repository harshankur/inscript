FROM node:20-alpine

# Accept build arguments for ports
ARG SERVER_PORT
ARG CLIENT_PORT

# Set them as environment variables for runtime
ENV SERVER_PORT=${SERVER_PORT}
ENV CLIENT_PORT=${CLIENT_PORT}
# Set working directory
WORKDIR /app/inscript

# Install system dependencies
RUN apk add --no-cache git openssh-client

# Configure Git to trust the /app directory (needed for Docker mounts)
RUN git config --global --add safe.directory /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose ports (documented)
EXPOSE ${SERVER_PORT}
EXPOSE ${CLIENT_PORT}

# Run the development server
CMD ["npm", "run", "dev"]
