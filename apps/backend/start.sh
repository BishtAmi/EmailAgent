#!/bin/sh

echo "Waiting for postgres..."

sleep 5

echo "Generating Prisma Client..."

npx prisma generate

echo "Running migrations..."

npx prisma migrate deploy

echo "Starting server..."

node dist/index.js