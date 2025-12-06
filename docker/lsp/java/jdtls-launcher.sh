#!/bin/bash

# JDT.LS Launcher Script

JDTLS_HOME=/opt/jdtls
DATA_DIR=/home/lspuser/.jdtls-data

# Find the launcher jar
LAUNCHER=$(find $JDTLS_HOME/plugins -name "org.eclipse.equinox.launcher_*.jar" | head -1)

# Determine config based on OS
if [ "$(uname)" = "Linux" ]; then
    CONFIG=$JDTLS_HOME/config_linux
else
    CONFIG=$JDTLS_HOME/config_mac
fi

java \
    -Declipse.application=org.eclipse.jdt.ls.core.id1 \
    -Dosgi.bundles.defaultStartLevel=4 \
    -Declipse.product=org.eclipse.jdt.ls.core.product \
    -Dlog.level=ALL \
    -Xmx1G \
    --add-modules=ALL-SYSTEM \
    --add-opens java.base/java.util=ALL-UNNAMED \
    --add-opens java.base/java.lang=ALL-UNNAMED \
    -jar $LAUNCHER \
    -configuration $CONFIG \
    -data $DATA_DIR \
    "$@"
