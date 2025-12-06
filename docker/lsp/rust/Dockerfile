# LSP Server - Rust (rust-analyzer)
FROM rust:1.74-slim

# Install rust-analyzer and tools
RUN rustup component add \
    rust-analyzer \
    clippy \
    rustfmt \
    rust-src

# Install additional tools
RUN cargo install \
    cargo-edit \
    cargo-watch \
    cargo-expand

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Default to running rust-analyzer
CMD ["rust-analyzer"]
