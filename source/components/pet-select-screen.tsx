import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {PetType} from '../types.js';
import {PET_TYPES, PET_TYPE_NAMES, PET_TYPE_DESCRIPTIONS} from '../types.js';
import {getArtFrames} from '../ascii-art.js';

interface PetSelectScreenProps {
	onSelect: (type: PetType) => void;
}

export function PetSelectScreen({onSelect}: PetSelectScreenProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useInput((_input, key) => {
		if (key.leftArrow) {
			setSelectedIndex(prev => (prev - 1 + PET_TYPES.length) % PET_TYPES.length);
		} else if (key.rightArrow) {
			setSelectedIndex(prev => (prev + 1) % PET_TYPES.length);
		} else if (key.return) {
			const selected = PET_TYPES[selectedIndex];
			if (selected) {
				onSelect(selected);
			}
		}
	});

	const selectedType = PET_TYPES[selectedIndex]!;
	const art = getArtFrames(selectedType, 'baby', 'happy')[0] ?? '';

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box borderStyle="double" borderColor="cyan" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
				<Text bold color="cyan">
					Choose Your Pet!
				</Text>
				<Text> </Text>
				<Box gap={2}>
					{PET_TYPES.map((type, i) => (
						<Text
							key={type}
							bold={i === selectedIndex}
							color={i === selectedIndex ? 'green' : 'white'}
							inverse={i === selectedIndex}
						>
							{' '}{PET_TYPE_NAMES[type]}{' '}
						</Text>
					))}
				</Box>
				<Text> </Text>
				<Text color="green">{art}</Text>
				<Text> </Text>
				<Text color="yellow" bold>{PET_TYPE_NAMES[selectedType]}</Text>
				<Text dimColor>{PET_TYPE_DESCRIPTIONS[selectedType]}</Text>
				<Text> </Text>
				<Text dimColor>Use arrow keys to browse, Enter to select</Text>
			</Box>
		</Box>
	);
}
