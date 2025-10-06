# The Customize Terminal
*I suck at naming things, so this is not a final name.*

![Made with Electron](https://img.shields.io/badge/Made_with-Electron-blue?style=flat&logo=electron)
![Uses pnpm](https://img.shields.io/badge/Uses-pnpm-orange?style=flat&logo=pnpm)
![GitHub last commit](https://img.shields.io/github/last-commit/ElliNet13/customize-terminal)

Work in progress!

The customize terminal is a terminal that allows you to customize the look and feel of your terminal.

## Starting from source

### Requirements
- [Node.js](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/)

### Running the application for the first time
1. Install the dependencies
```bash
pnpm install
```
2. You might need to rebuild node-pty (I had to)
```bash
pnpx electron-rebuild -f -w node-pty
```
If you get an error, run the following command
```bash
pnpm exec electron-rebuild -v <version> -f -w node-pty
```
Get the version from `package.json` under `electron`.
For example 
```json
"electron": "^38.2.1"
```
We would run
```bash
pnpm exec electron-rebuild -v 38.2.1 -f -w node-pty
```

3. Run the application
```bash
pnpm start
```

### Running the application
```bash
pnpm start
```