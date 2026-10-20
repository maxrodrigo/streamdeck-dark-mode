import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
// Without windowsHide, every poll would flash a console window on Windows.
const run = (file: string, args: string[]) => exec(file, args, { windowsHide: true });

type Appearance = {
	isDark(): Promise<boolean>;
	setDark(dark: boolean): Promise<void>;
};

const macos: Appearance = {
	async isDark() {
		try {
			const { stdout } = await run("defaults", ["read", "-g", "AppleInterfaceStyle"]);
			return stdout.trim() === "Dark";
		} catch (err) {
			// The key is absent in light mode.
			if (String((err as { stderr?: string }).stderr).includes("does not exist")) return false;
			throw err;
		}
	},
	async setDark(dark) {
		// First use triggers the macOS Automation permission prompt.
		await run("osascript", ["-e", `tell application "System Events" to tell appearance preferences to set dark mode to ${dark}`]);
	},
};

// Same values the Windows Settings app writes.
const PERSONALIZE = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

export function parseRegDword(stdout: string): number {
	const match = /REG_DWORD\s+0x([0-9a-f]+)/i.exec(stdout);
	if (!match) throw new Error(`Unexpected reg output: ${stdout}`);
	return parseInt(match[1], 16);
}

const windows: Appearance = {
	async isDark() {
		const { stdout } = await run("reg", ["query", PERSONALIZE, "/v", "AppsUseLightTheme"]);
		return parseRegDword(stdout) === 0;
	},
	async setDark(dark) {
		const light = dark ? "0" : "1";
		for (const name of ["AppsUseLightTheme", "SystemUsesLightTheme"]) {
			await run("reg", ["add", PERSONALIZE, "/v", name, "/t", "REG_DWORD", "/d", light, "/f"]);
		}
	},
};

function forPlatform(): Appearance {
	switch (process.platform) {
		case "darwin":
			return macos;
		case "win32":
			return windows;
		default:
			throw new Error(`Unsupported platform: ${process.platform}`);
	}
}

export const isDark = () => forPlatform().isDark();
export const setDark = (dark: boolean) => forPlatform().setDark(dark);
