#!/bin/bash
# Script to generate gRPC Python code from proto files
# Usage: bash modules/infrastructure/generate_proto.sh

set -e
PROTO_DIR="modules/infrastructure/proto"
PY_OUT="$PROTO_DIR"
GRPC_OUT="$PROTO_DIR"

for proto in $PROTO_DIR/*.proto; do
    python -m grpc_tools.protoc -I$PROTO_DIR --python_out=$PY_OUT --grpc_python_out=$GRPC_OUT $proto
done
