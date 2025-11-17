FROM openjdk:17-alpine

# Create non-root user
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner

# Set working directory
WORKDIR /tmp

# Remove unnecessary binaries for security
RUN rm -rf /usr/bin/wget /usr/bin/curl /bin/nc /usr/bin/ssh* || true

# Switch to non-root user
USER coderunner

# Set Java options for memory limits
ENV JAVA_OPTS="-Xmx256m -Xms64m"

# Default command
CMD ["sh"]
