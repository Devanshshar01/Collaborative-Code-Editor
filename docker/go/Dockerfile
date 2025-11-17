FROM golang:1.21-alpine

# Create non-root user
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner

# Set working directory
WORKDIR /tmp

# Remove unnecessary binaries for security
RUN rm -rf /usr/bin/wget /usr/bin/curl /bin/nc /usr/bin/ssh* || true

# Switch to non-root user
USER coderunner

# Set Go environment
ENV CGO_ENABLED=0
ENV GOCACHE=/tmp/.cache

# Default command
CMD ["sh"]
