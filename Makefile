setup: install build

install:
	pnpm install

build:
	pnpm run build

start:
	pnpm run start

test:
	pnpm run test

lint:
	pnpm run lint
	pnpm --silent run format:check

lint-fix:
	pnpm run lint:fix

watch:
	pnpm run start:watch

update-deps:
	pnpm exec ncu -u
