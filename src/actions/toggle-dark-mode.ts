import streamDeck, { action, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { isDark, setDark } from "../appearance";

// Manifest state indices.
const LIGHT = 0;
const DARK = 1;
const toState = (dark: boolean) => (dark ? DARK : LIGHT);

const logger = streamDeck.logger.createScope("ToggleDarkMode");

@action({ UUID: "com.maxrodrigo.dark-mode.toggle" })
export class ToggleDarkMode extends SingletonAction {
	// Polls so the key also follows changes made in system settings or by an automatic schedule.
	private timer: NodeJS.Timeout | undefined;
	private dark: boolean | undefined;

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		this.timer ??= setInterval(() => void this.sync(), 2000);
		await this.sync();
		if (this.dark !== undefined && ev.action.isKey() && ev.payload.state !== toState(this.dark)) {
			await ev.action.setState(toState(this.dark));
		}
	}

	override onWillDisappear(): void {
		// The SDK has already removed the disappearing action from this.actions.
		if (this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		try {
			const dark = ev.payload.isInMultiAction ? ev.payload.userDesiredState === DARK : !(await isDark());
			await setDark(dark);
			await this.sync();
		} catch (err) {
			logger.error("Failed to switch appearance", err);
			await ev.action.showAlert();
		}
	}

	private async sync(): Promise<void> {
		try {
			const dark = await isDark();
			// Only on change: setting the state restarts the key's animation.
			if (dark === this.dark) return;
			this.dark = dark;
			await Promise.all(this.actions.map((a) => (a.isKey() ? a.setState(toState(dark)) : undefined)));
		} catch (err) {
			logger.error("Failed to read appearance", err);
		}
	}
}
