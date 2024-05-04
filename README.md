# Self-Modifying Card: Redux

Card creator For Null-Signal-era Netrunner, ported from [yonbergman/self-modifying-card](https://github.com/yonbergman/self-modifying-card) to SolidJS and TypeScript, and using [Mnemic's high-quality templates](https://www.reddit.com/r/Netrunner/comments/yuapf2/mnemics_custom_netrunner_cards_1024_custom_cards/).

Fully Operational &trade;, but WIP/YMMV.

### TODO

- Autosized text
- Customizable text size
- Icon reference tooltip
- Interrupt icon
- Persistence
- Improve template and font integration
- Improve image resizing perf
- Customizable render quality (currently 750x1050)

## Install

```bash
$ pnpm install
```

## Run

```bash
$ pnpm install
```

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

## Build

```bash
$ pnpm build
```

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)