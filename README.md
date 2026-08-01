# problemSolv

Personal workspace for solving algorithm/coding problems (HackerRank-style),
written in TypeScript by default with a JavaScript fallback.

## Structure

- `prblms/` — solved problems, one folder per problem
- `templ/` — starter templates (`prblm-templ-ts`, `prblm-templ-js`)
- `scripts/` — tooling (problem scaffolding, etc.)

## Usage

Create a new problem:
`npm run new -- problem-name [--js]`

Run all tests:
`npm run test:all`

Run tests for one problem:
`npm test -- prblms/problem-name/`
