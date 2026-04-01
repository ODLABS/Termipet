import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import type {PetState} from '../types.js';
import {getPetMood} from '../game-engine.js';
import {getArtFrames} from '../ascii-art.js';
import {ANIMATION_INTERVAL_MS} from '../constants.js';

interface PetDisplayProps {
	pet: PetState;
}

export function PetDisplay({pet}: PetDisplayProps) {
	const [frameIndex, setFrameIndex] = useState(0);
	const mood = getPetMood(pet);
	const frames = getArtFrames(pet.type, pet.stage, mood);

	useEffect(() => {
		if (frames.length <= 1) return;

		const timer = setInterval(() => {
			setFrameIndex(prev => (prev + 1) % frames.length);
		}, ANIMATION_INTERVAL_MS);

		return () => {
			clearInterval(timer);
		};
	}, [frames.length]);

	const currentFrame = frames[frameIndex % frames.length] ?? '???';

	let borderColor: string = 'white';
	switch (mood) {
		case 'happy': {
			borderColor = 'green';
			break;
		}

		case 'hungry': {
			borderColor = 'yellow';
			break;
		}

		case 'sick': {
			borderColor = 'red';
			break;
		}

		case 'sleeping': {
			borderColor = 'blue';
			break;
		}

		case 'dead': {
			borderColor = 'gray';
			break;
		}

		default:
			break;
	}

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Text color={borderColor}>{currentFrame}</Text>
			<Text dimColor>
				{pet.isDirty ? '[Dirty!] ' : ''}
				{pet.isSick ? '[Sick!] ' : ''}
				{pet.isSleeping ? '[Sleeping...] ' : ''}
				{mood === 'hungry' ? '[Hungry!] ' : ''}
			</Text>
		</Box>
	);
}
