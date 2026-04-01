import React from 'react';
import {Box, Text} from 'ink';
import type {PetStats} from '../types.js';

interface StatBarProps {
	label: string;
	icon: string;
	value: number;
	width?: number;
}

function StatBar({label, icon, value, width = 20}: StatBarProps) {
	const filled = Math.round((value / 100) * width);
	const empty = width - filled;
	const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);

	let color: 'green' | 'yellow' | 'red' = 'green';
	if (value < 30) color = 'red';
	else if (value < 60) color = 'yellow';

	return (
		<Box>
			<Text>{icon}  </Text>
			<Text>{label.padEnd(12)}</Text>
			<Text color={color}>{bar}</Text>
			<Text> {Math.round(value).toString().padStart(3)}%</Text>
		</Box>
	);
}

interface StatBarsProps {
	stats: PetStats;
}

export function StatBars({stats}: StatBarsProps) {
	return (
		<Box flexDirection="column">
			<StatBar label="Health" icon="+" value={stats.health} />
			<StatBar label="Hunger" icon="*" value={stats.hunger} />
			<StatBar label="Happiness" icon="~" value={stats.happiness} />
			<StatBar label="Energy" icon="!" value={stats.energy} />
			<StatBar label="Clean" icon="o" value={stats.cleanliness} />
		</Box>
	);
}
