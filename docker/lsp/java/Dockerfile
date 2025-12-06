# LSP Server - Java (Eclipse JDT.LS)
FROM eclipse-temurin:17-jdk

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    maven \
    git \
    && rm -rf /var/lib/apt/lists/*

# Download and install JDT.LS
ENV JDTLS_VERSION=1.31.0
RUN mkdir -p /opt/jdtls && \
    wget -q "https://download.eclipse.org/jdtls/milestones/${JDTLS_VERSION}/jdt-language-server-${JDTLS_VERSION}-202312211634.tar.gz" \
        -O /tmp/jdtls.tar.gz && \
    tar -xzf /tmp/jdtls.tar.gz -C /opt/jdtls && \
    rm /tmp/jdtls.tar.gz

# Install Gradle
ENV GRADLE_VERSION=8.5
RUN wget -q "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" \
        -O /tmp/gradle.zip && \
    unzip -q /tmp/gradle.zip -d /opt && \
    rm /tmp/gradle.zip && \
    ln -s /opt/gradle-${GRADLE_VERSION}/bin/gradle /usr/local/bin/gradle

# Create startup script
COPY jdtls-launcher.sh /opt/jdtls/launcher.sh
RUN chmod +x /opt/jdtls/launcher.sh

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Create data directory
RUN mkdir -p /home/lspuser/.jdtls-data

# Default to running JDT.LS
CMD ["/opt/jdtls/launcher.sh"]
