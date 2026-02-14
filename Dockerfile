FROM node:20-alpine

# Accept build arguments for ports
ARG SERVER_PORT
ARG CLIENT_PORT

# Set them as environment variables for runtime
ENV SERVER_PORT=${SERVER_PORT}
ENV CLIENT_PORT=${CLIENT_PORT}

WORKDIR /app/inscript

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
