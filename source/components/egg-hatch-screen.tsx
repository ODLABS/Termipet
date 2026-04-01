import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import type {PetState} from '../types.js';
import {PET_TYPE_NAMES} from '../types.js';
import {hatchingFrames} from '../ascii-art.js';
import {getArtFrames} from '../ascii-art.js';

interface EggHatchScreenProps {
	pet: PetState;
	onDone: () => void;
}

export function EggHatchScreen({pet, onDone}: EggHatchScreenProps) {
	const [frameIndex, setFrameIndex] = useState(0);
	const totalFrames = hatchingFrames.length;

	useEffect(() => {
		if (frameIndex >= totalFrames) {
			const timeout = setTimeout(onDone, 2000);
			return () => {
				clearTimeout(timeout);
			};
		}

		const timer = setTimeout(() => {
			setFrameIndex(prev => prev + 1);
		}, 800);

		return () => {
			clearTimeout(timer);
		};
	}, [frameIndex, totalFrames, onDone]);

	const isHatched = frameIndex >= totalFrames;

	if (isHatched) {
		const babyArt = getArtFrames(pet.type, 'baby', 'happy')[0] ?? '';
		return (
			<Box flexDirection="column" alignItems="center" paddingY={1}>
				<Box borderStyle="double" borderColor="green" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
					<Text bold color="green">
						Your egg hatched!
					</Text>
					<Text> </Text>
					<Text color="green">{babyArt}</Text>
					<Text> </Text>
					<Text bold color="cyan">
						Meet {pet.name} the {PET_TYPE_NAMES[pet.type]}!
					</Text>
					<Text dimColor>Starting your adventure...</Text>
				</Box>
			</Box>
		);
	}

	const currentFrame = hatchingFrames[frameIndex] ?? '';
	const messages = ['Your egg is rocking...', '*crack*', '*crack* *crack*', '*CRACK*', '!!!'];
	const message = messages[frameIndex] ?? '';

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box borderStyle="double" borderColor="yellow" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
				<Text bold color="yellow">
					Hatching...
				</Text>
				<Text> </Text>
				<Text color="yellow">{currentFrame}</Text>
				<Text> </Text>
				<Text color="white" bold>{message}</Text>
			</Box>
		</Box>
	);
}
