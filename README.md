# Dark Mode for Stream Deck

Toggle dark mode on macOS and Windows with a single Stream Deck key. Free and open source.

![Light and dark key states](preview.gif)

## Features

- One key switches between light and dark mode.
- The key always shows the current mode, even when it changes from system settings or an automatic schedule.
- Works in Multi Actions: choose Light or Dark for a step to set that mode instead of toggling.

## Requirements

- Stream Deck 7.1 or later
- macOS 12 or later, or Windows 10 or later

## Installation

Download `com.maxrodrigo.dark-mode.streamDeckPlugin` from the [latest release](https://github.com/maxrodrigo/streamdeck-dark-mode/releases/latest) and double-click it. Stream Deck installs the plugin.

## Usage

Find **Dark Mode** in the Stream Deck actions list and drag **Toggle Dark Mode** onto a key.

On macOS, the first press asks for permission to control System Events. Click **OK**. If you denied it, enable Stream Deck under System Settings → Privacy & Security → Automation.

## Troubleshooting

A yellow warning triangle on the key means the switch failed. The reason is in the plugin log:

- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.maxrodrigo.dark-mode.sdPlugin/logs/`
- Windows: `%appdata%\Elgato\StreamDeck\Plugins\com.maxrodrigo.dark-mode.sdPlugin\logs\`

On Windows, if the key never shows the current mode, change the mode once in Settings → Personalization → Colors.

Still stuck? [Open an issue](https://github.com/maxrodrigo/streamdeck-dark-mode/issues) and attach the log.

## Development

Requires Node.js 24 and the [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli/intro).

```sh
npm ci
npx streamdeck dev
npx streamdeck link com.maxrodrigo.dark-mode.sdPlugin
npm run watch
```

`npm run pack` builds the installer. To attach a debugger, add `"Debug": "enabled"` to `Nodejs` in `manifest.json`.

## License

[MIT](LICENSE) © [Max Rodrigo](https://www.maxrodrigo.com)
