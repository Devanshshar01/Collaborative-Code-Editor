FROM python:3.11-alpine

# Install minimal dependencies
RUN apk add --no-cache \
    libstdc++ \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner

# Set working directory
WORKDIR /tmp

# Remove unnecessary binaries for security
RUN rm -rf /usr/bin/wget /usr/bin/curl /bin/nc /usr/bin/ssh* || true

# Switch to non-root user
USER coderunner

# Set resource limits
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Default command
CMD ["sh"]
