FROM denoland/deno:alpine
WORKDIR /app
COPY . .
RUN deno cache main.ts
CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--unstable-kv", "main.ts"]