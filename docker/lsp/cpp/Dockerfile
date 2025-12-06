# LSP Server - C/C++ (clangd)
FROM ubuntu:22.04

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install clangd and C/C++ toolchain
RUN apt-get update && apt-get install -y \
    clangd \
    clang \
    clang-format \
    clang-tidy \
    lldb \
    cmake \
    ninja-build \
    gdb \
    gcc \
    g++ \
    make \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash lspuser
USER lspuser

WORKDIR /workspace

# Default to running clangd
CMD ["clangd", "--background-index", "--clang-tidy", "--completion-style=detailed"]
