# LSP Server - Go (gopls)
FROM golang:1.21-bookworm

# Install gopls and Go tools
RUN go install golang.org/x/tools/gopls@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install golang.org/x/tools/cmd/goimports@latest && \
    go install github.com/fatih/gomodifytags@latest && \
    go install github.com/josharian/impl@latest && \
    go install github.com/cweill/gotests/gotests@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest && \
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

# Add Go binaries to PATH
ENV PATH="/go/bin:${PATH}"

WORKDIR /workspace

# Default to running gopls
CMD ["gopls", "serve"]
