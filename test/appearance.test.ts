import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRegDword } from "../src/appearance.ts";

test("parseRegDword reads the value reg query prints", () => {
	const output = (value: string) =>
		`\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\r\n    AppsUseLightTheme    REG_DWORD    ${value}\r\n\r\n`;
	assert.equal(parseRegDword(output("0x0")), 0);
	assert.equal(parseRegDword(output("0x1")), 1);
	assert.throws(() => parseRegDword("ERROR: The system was unable to find the specified registry key or value."));
});
