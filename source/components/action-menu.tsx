import React from 'react';
import {Box, Text, useInput} from 'ink';
import type {ActionType} from '../types.js';

interface ActionMenuProps {
	onAction: (action: ActionType) => void;
	onShop: () => void;
	onQuit: () => void;
	isSleeping: boolean;
}

export function ActionMenu({onAction, onShop, onQuit, isSleeping}: ActionMenuProps) {
	useInput((input, key) => {
		if (key.escape) {
			onQuit();
			return;
		}

		switch (input.toLowerCase()) {
			case 'f': {
				onAction('feed');
				break;
			}

			case 'p': {
				onAction('play');
				break;
			}

			case 't': {
				onAction('train');
				break;
			}

			case 'c': {
				onAction('clean');
				break;
			}

			case 's': {
				onAction('sleep');
				break;
			}

			case 'b': {
				onShop();
				break;
			}

			case 'q': {
				onQuit();
				break;
			}

			default:
				break;
		}
	});

	if (isSleeping) {
		return (
			<Box borderStyle="single" borderColor="blue" paddingX={1}>
				<Text color="blue">
					Your pet is sleeping... Press [S] to wake up | [Q]uit
				</Text>
			</Box>
		);
	}

	return (
		<Box borderStyle="single" borderColor="white" paddingX={1} justifyContent="center" gap={1}>
			<Text>[<Text color="green" bold>F</Text>]eed</Text>
			<Text>[<Text color="yellow" bold>P</Text>]lay</Text>
			<Text>[<Text color="magenta" bold>T</Text>]rain</Text>
			<Text>[<Text color="cyan" bold>C</Text>]lean</Text>
			<Text>[<Text color="blue" bold>S</Text>]leep</Text>
			<Text>[<Text color="white" bold>B</Text>]uy</Text>
			<Text>[<Text color="red" bold>Q</Text>]uit</Text>
		</Box>
	);
}
