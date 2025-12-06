# LSP Server - Python (Pyright)
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python LSP and tools
RUN pip install --no-cache-dir \
    pyright \
    python-lsp-server[all] \
    pylsp-mypy \
    python-lsp-black \
    pyls-isort \
    pylsp-rope \
    black \
    isort \
    mypy \
    flake8 \
    autopep8 \
    debugpy \
    pytest \
    pytest-json-report

# Install Node.js based pyright
RUN npm install -g pyright

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Default to running pyright language server
CMD ["pyright-langserver", "--stdio"]
