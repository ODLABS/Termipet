import React from 'react';
import {Box, Text, useInput} from 'ink';
import type {PetState} from '../types.js';
import {graveArt} from '../ascii-art.js';
import {formatAge} from '../game-engine.js';

interface DeathScreenProps {
	pet: PetState;
	onRestart: () => void;
	onRevive: () => void;
	onQuit: () => void;
	canRevive: boolean;
}

export function DeathScreen({pet, onRestart, onRevive, onQuit, canRevive}: DeathScreenProps) {
	useInput((input) => {
		switch (input.toLowerCase()) {
			case 'r': {
				onRestart();
				break;
			}

			case 'v': {
				if (canRevive) {
					onRevive();
				}

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

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box borderStyle="double" borderColor="gray" paddingX={3} paddingY={1} flexDirection="column" alignItems="center">
				<Text bold color="red">
					Your pet has died...
				</Text>
				<Text> </Text>
				<Text color="gray">{graveArt}</Text>
				<Text> </Text>
				<Text bold color="cyan">{pet.name}</Text>
				<Text dimColor>
					Lived for {formatAge(pet.age)} | Level {pet.level} | {pet.xp} XP
				</Text>
				<Text dimColor>
					Deaths: {pet.deathCount + 1}
				</Text>
				<Text> </Text>
				<Text>[<Text color="green" bold>R</Text>]estart with new pet</Text>
				{canRevive && (
					<Text>[<Text color="yellow" bold>V</Text>]revive (100 coins - you have {pet.currency})</Text>
				)}
				<Text>[<Text color="red" bold>Q</Text>]uit</Text>
			</Box>
		</Box>
	);
}
