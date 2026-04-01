#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {App} from './app.js';

meow(
	`
	Usage
	  $ termipets

	A Tamagotchi-style virtual pet that lives in your terminal.
	Feed it. Grow it. Keep it alive.

	Controls
	  [F]eed    - Feed your pet
	  [P]lay    - Play with your pet
	  [T]rain   - Train your pet
	  [C]lean   - Clean your pet
	  [S]leep   - Put pet to sleep / wake up
	  [B]uy     - Open shop
	  [Q]uit    - Save and quit
`,
	{
		importMeta: import.meta,
	},
);

render(<App />);
