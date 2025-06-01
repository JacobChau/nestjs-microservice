#!/bin/bash

set -e
set -u

# Function to create users and databases
function create_user_and_database() {
    local database=$1
    echo "Creating user and database '$database'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

# Create a default database if POSTGRES_MULTIPLE_DATABASES is not set
if [ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "POSTGRES_MULTIPLE_DATABASES is not set, nothing to create"
    exit 0
fi

# Create each database from the list
echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
    create_user_and_database $db
done

echo "Multiple databases created" 