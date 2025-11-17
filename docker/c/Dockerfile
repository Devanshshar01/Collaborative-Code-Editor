FROM gcc:13-alpine

# Install required dependencies
RUN apk add --no-cache \
    libc-dev \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner

# Set working directory
WORKDIR /tmp

# Remove unnecessary binaries for security
RUN rm -rf /usr/bin/wget /usr/bin/curl /bin/nc /usr/bin/ssh* || true

# Switch to non-root user
USER coderunner

# Default command
CMD ["sh"]
