import React from 'react';
import {Box, Text} from 'ink';
import type {PetState} from '../types.js';
import {formatAge, getTimeUntilEvolution} from '../game-engine.js';

interface HeaderProps {
	pet: PetState;
}

export function Header({pet}: HeaderProps) {
	const stageName = pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1);
	const pathIcon = pet.evolutionPath === 'good' ? '*' : pet.evolutionPath === 'neutral' ? '-' : '!';

	return (
		<Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
			<Box justifyContent="space-between">
				<Text bold color="cyan">
					{pet.name} (Lv.{pet.level} {stageName})
				</Text>
				<Text color="yellow">
					$ {pet.currency} coins
				</Text>
			</Box>
			<Box justifyContent="space-between">
				<Text dimColor>
					Age: {formatAge(pet.age)} | XP: {pet.xp} | Path: {pathIcon}
				</Text>
				<Text dimColor>
					{pet.streak > 0 ? `Streak: ${pet.streak}d` : ''} | Next: {getTimeUntilEvolution(pet)}
				</Text>
			</Box>
		</Box>
	);
}
