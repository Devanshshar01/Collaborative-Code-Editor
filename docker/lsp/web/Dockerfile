# LSP Server - HTML/CSS/JSON (vscode-langservers)
FROM node:20-slim

# Install vscode language servers
RUN npm install -g \
    vscode-langservers-extracted \
    typescript \
    prettier \
    emmet-ls

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Default to HTML language server (can be overridden)
CMD ["vscode-html-language-server", "--stdio"]
