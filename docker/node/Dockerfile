FROM node:20-alpine

# Install TypeScript globally
RUN npm install -g typescript@5.3.3 && npm cache clean --force

# Create non-root user
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner

# Set working directory
WORKDIR /tmp

# Remove unnecessary binaries for security
RUN rm -rf /usr/bin/wget /usr/bin/curl /bin/nc /usr/bin/ssh* || true

# Switch to non-root user
USER coderunner

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Default command
CMD ["sh"]
