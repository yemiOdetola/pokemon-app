#!/bin/sh

# Wait for the database to be ready
until nc -z -v -w30 db 5432
do
  echo "Waiting for database connection..."
  sleep 1
done

# Run migrations
npx prisma migrate deploy

# Generate data
npx ts-node prisma/generateData.ts

# Import Pokemon
npx ts-node prisma/importPokemon.ts
