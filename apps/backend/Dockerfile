FROM node:20-alpine

WORKDIR /apps/backend

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate prisma client
RUN npx prisma generate


# Build TypeScript
RUN npm run build

# Add startup script permissions
RUN chmod +x start.sh

# Expose the port
EXPOSE 5000

# Start the application
CMD ["sh", "start.sh"]