#!/bin/bash

# This script ensures Kafka shell scripts have correct permissions

# Make Kafka scripts executable
chmod +x kafka-init/create-topics.sh
chmod +x init-scripts/create-multiple-postgres-dbs.sh

echo "Fixed permissions for Kafka scripts" 