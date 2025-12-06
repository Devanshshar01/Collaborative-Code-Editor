# LSP Server - TypeScript/JavaScript
FROM node:20-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript language server and tools
RUN npm install -g \
    typescript \
    typescript-language-server \
    prettier \
    eslint \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    ts-node \
    jest \
    @types/node \
    @types/jest

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Default to running TypeScript language server
CMD ["typescript-language-server", "--stdio"]
