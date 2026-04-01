import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import type {PetState} from '../types.js';
import {getArtFrames} from '../ascii-art.js';

interface EvolutionScreenProps {
	pet: PetState;
	onDone: () => void;
}

export function EvolutionScreen({pet, onDone}: EvolutionScreenProps) {
	const [phase, setPhase] = useState(0);

	useEffect(() => {
		if (phase >= 3) {
			const timeout = setTimeout(onDone, 1500);
			return () => {
				clearTimeout(timeout);
			};
		}

		const timer = setTimeout(() => {
			setPhase(prev => prev + 1);
		}, 1200);

		return () => {
			clearTimeout(timer);
		};
	}, [phase, onDone]);

	const art = getArtFrames(pet.type, pet.stage, 'happy')[0] ?? '';
	const stageName = pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1);

	const pathMessage = pet.evolutionPath === 'good'
		? 'Excellent care! Strong evolution!'
		: pet.evolutionPath === 'neutral'
			? 'Average care. Normal evolution.'
			: 'Poor care. Weak evolution...';

	const sparkles = ['*', '* *', '* * *', '* * * *'];

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box borderStyle="double" borderColor="magenta" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
				<Text bold color="magenta">
					{sparkles[phase] ?? ''}
				</Text>
				<Text bold color="magenta">
					EVOLUTION!
				</Text>
				<Text bold color="magenta">
					{sparkles[phase] ?? ''}
				</Text>
				<Text> </Text>
				{phase >= 1 && (
					<>
						<Text color="green">{art}</Text>
						<Text> </Text>
					</>
				)}
				{phase >= 2 && (
					<>
						<Text bold color="cyan">
							{pet.name} evolved to {stageName}!
						</Text>
						<Text dimColor>{pathMessage}</Text>
						<Text color="yellow">+{50} coins!</Text>
					</>
				)}
			</Box>
		</Box>
	);
}
