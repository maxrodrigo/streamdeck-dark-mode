import streamDeck, { action, type KeyDownEvent, SingletonAction, type WillAppearEvent } from "@elgato/streamdeck";

import { isDark, setDark } from "../appearance";

// Manifest state indices.
const LIGHT = 0;
const DARK = 1;
const toState = (dark: boolean) => (dark ? DARK : LIGHT);

// Stop-motion played on the key whenever the mode changes. setImage can't play GIFs and
// Stream Deck allows at most 10 image updates per second, so it's a 10fps flipbook of PNGs.
const FRAME_MS = 100;
const frames = (dir: string, count: number) =>
	Array.from({ length: count }, (_, i) => `imgs/actions/toggle/${dir}/${String(i).padStart(2, "0")}.png`);
const TO_DARK = frames("to-dark", 14);
const TO_LIGHT = frames("to-light", 13);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const logger = streamDeck.logger.createScope("ToggleDarkMode");

@action({ UUID: "com.maxrodrigo.dark-mode.toggle" })
export class ToggleDarkMode extends SingletonAction {
	// Polls so the key also follows changes made in system settings or by an automatic schedule.
	private timer: NodeJS.Timeout | undefined;
	private dark: boolean | undefined;
	private animating = false;
	private resyncAfterAnimation = false;

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
		// A change during the flipbook is picked up as soon as it finishes.
		if (this.animating) {
			this.resyncAfterAnimation = true;
			return;
		}
		try {
			const dark = await isDark();
			// Only on change: setting the state restarts the key's animation.
			if (dark === this.dark) return;
			const firstRead = this.dark === undefined;
			this.dark = dark;
			if (!firstRead) await this.play(dark ? TO_DARK : TO_LIGHT);
			await Promise.all(this.actions.map((a) => (a.isKey() ? a.setState(toState(dark)) : undefined)));
			// Clear the last flipbook frame so the state's own animated image shows again.
			if (!firstRead) await Promise.all(this.actions.map((a) => (a.isKey() ? a.setImage() : undefined)));
		} catch (err) {
			logger.error("Failed to read appearance", err);
		}
		if (this.resyncAfterAnimation) {
			this.resyncAfterAnimation = false;
			await this.sync();
		}
	}

	private async play(images: string[]): Promise<void> {
		this.animating = true;
		try {
			for (const image of images) {
				const started = Date.now();
				await Promise.all(this.actions.map((a) => (a.isKey() ? a.setImage(image) : undefined)));
				await sleep(Math.max(0, FRAME_MS - (Date.now() - started)));
			}
		} catch (err) {
			logger.error("Failed to play transition", err);
		} finally {
			this.animating = false;
		}
	}
}
