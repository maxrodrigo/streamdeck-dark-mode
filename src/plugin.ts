import streamDeck from "@elgato/streamdeck";

import { ToggleDarkMode } from "./actions/toggle-dark-mode";

streamDeck.actions.registerAction(new ToggleDarkMode());
streamDeck.connect();
