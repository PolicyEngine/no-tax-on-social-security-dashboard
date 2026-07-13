.PHONY: dev dev-frontend data
.PHONY: build test lint clean

# Port selection helper — finds the first available port in 4000-4100
define find_port
$$(python3 -c '\
import socket, sys;\
for p in range(4000, 4101):\
    try:\
        s = socket.socket(); s.bind(("", p)); s.close(); print(p); sys.exit(0)\
    except OSError:\
        continue\
print("ERROR: no free port in 4000-4100", file=sys.stderr); sys.exit(1)\
')
endef

# Start development server
dev: dev-frontend

# Frontend only (no backend for this data pattern — data is precomputed static JSON)
dev-frontend:
	@PORT=$(find_port); \
	echo "Frontend: http://localhost:$$PORT"; \
	PORT=$$PORT bun run dev

# Regenerate the precomputed results by fetching from the hosted PolicyEngine API.
# NEVER runs a local policyengine-us Microsimulation (CI 16GB OOM guard).
data:
	python3 scripts/precompute.py

build:
	bun run build

test:
	bunx vitest run

lint:
	bun run lint

clean:
	rm -rf .next out node_modules
