install:
	pnpm install

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
