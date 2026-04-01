import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {PetType} from '../types.js';
import {PET_TYPE_NAMES} from '../types.js';
import {getArtFrames} from '../ascii-art.js';

interface NameInputScreenProps {
	petType: PetType;
	onSubmit: (name: string) => void;
}

export function NameInputScreen({petType, onSubmit}: NameInputScreenProps) {
	const [name, setName] = useState('');

	useInput((input, key) => {
		if (key.return && name.length > 0) {
			onSubmit(name);
			return;
		}

		if (key.backspace || key.delete) {
			setName(prev => prev.slice(0, -1));
			return;
		}

		// Only allow printable characters
		if (input && !key.ctrl && !key.meta && name.length < 20) {
			setName(prev => prev + input);
		}
	});

	const art = getArtFrames(petType, 'egg', 'idle')[0] ?? '';

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box borderStyle="double" borderColor="cyan" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
				<Text bold color="cyan">
					Your {PET_TYPE_NAMES[petType]} egg is ready!
				</Text>
				<Text> </Text>
				<Text color="yellow">{art}</Text>
				<Text> </Text>
				<Text>Name your pet:</Text>
				<Text> </Text>
				<Box>
					<Text color="green" bold>{'> '}</Text>
					<Text color="green" bold>{name}</Text>
					<Text color="green">_</Text>
				</Box>
				<Text> </Text>
				<Text dimColor>Type a name and press Enter</Text>
			</Box>
		</Box>
	);
}
