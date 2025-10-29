# SonoPatch

# Spuštění

```
docker compose run --rm web sh -lc "npm create vite@latest . -- --template vanilla-ts"
docker compose run --rm web sh -lc "npm install"
```

Vypnout build a buildnout znovu:

```
docker compose up
```

Projekt by měl běžet na `http://localhost:5173`
 