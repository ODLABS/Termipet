import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';

interface WhackAMoleProps {
	onComplete: (score: number) => void;
	petName: string;
}

const GRID_SIZE = 3;
const GAME_DURATION = 45_000;
const MOLE_KEYS = [
	['Q', 'W', 'E'],
	['A', 'S', 'D'],
	['Z', 'X', 'C'],
];

const MOLE_ART = {
	hidden: [
		'  ___  ',
		' /   \\ ',
		'|_____|',
	],
	visible: [
		' (o_o) ',
		' /| |\\ ',
		'|_____|',
	],
	whacked: [
		' (x_x) ',
		'  /|\\  ',
		'|_____|',
	],
};

export function WhackAMoleGame({onComplete, petName}: WhackAMoleProps) {
	const [moles, setMoles] = useState<boolean[]>(Array(9).fill(false));
	const [whacked, setWhacked] = useState<boolean[]>(Array(9).fill(false));
	const [score, setScore] = useState(0);
	const [misses, setMisses] = useState(0);
	const [combo, setCombo] = useState(0);
	const [maxCombo, setMaxCombo] = useState(0);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);

	// Timer
	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					setGameOver(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [gameOver]);

	// Spawn moles
	useEffect(() => {
		if (gameOver) return undefined;
		const spawnRate = Math.max(400, 1200 - score * 15);
		const timer = setInterval(() => {
			const idx = Math.floor(Math.random() * 9);
			setMoles(prev => {
				const next = [...prev];
				next[idx] = true;
				return next;
			});
			// Auto-hide after a while
			setTimeout(() => {
				setMoles(prev => {
					const next = [...prev];
					next[idx] = false;
					return next;
				});
				setWhacked(prev => {
					const next = [...prev];
					next[idx] = false;
					return next;
				});
			}, Math.max(500, 1500 - score * 20));
		}, spawnRate);
		return () => clearInterval(timer);
	}, [gameOver, score]);

	useEffect(() => {
		if (gameOver) {
			const finalScore = score * 10 + maxCombo * 5;
			const timer = setTimeout(() => onComplete(finalScore), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, maxCombo, onComplete]);

	const whackMole = useCallback((idx: number) => {
		if (gameOver) return;
		if (moles[idx]) {
			setScore(s => s + 1);
			setCombo(c => {
				const nc = c + 1;
				setMaxCombo(m => Math.max(m, nc));
				return nc;
			});
			setWhacked(prev => {
				const next = [...prev];
				next[idx] = true;
				return next;
			});
			setTimeout(() => {
				setMoles(prev => {
					const next = [...prev];
					next[idx] = false;
					return next;
				});
				setWhacked(prev => {
					const next = [...prev];
					next[idx] = false;
					return next;
				});
			}, 200);
		} else {
			setMisses(m => m + 1);
			setCombo(0);
		}
	}, [moles, gameOver]);

	useInput((input) => {
		if (gameOver) return;
		const keyMap: Record<string, number> = {
			q: 0, w: 1, e: 2,
			a: 3, s: 4, d: 5,
			z: 6, x: 7, c: 8,
		};
		const idx = keyMap[input.toLowerCase()];
		if (idx !== undefined) {
			whackMole(idx);
		}
	});

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="magenta">WHACK-A-MOLE</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Combo: <Text bold color="cyan">{combo}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="magenta">
				{[0, 1, 2].map(row => (
					<Box key={row} justifyContent="center" gap={1}>
						{[0, 1, 2].map(col => {
							const idx = row * 3 + col;
							const isVisible = moles[idx];
							const isWhacked = whacked[idx];
							const art = isWhacked ? MOLE_ART.whacked : isVisible ? MOLE_ART.visible : MOLE_ART.hidden;
							const color = isWhacked ? 'red' : isVisible ? 'yellow' : 'gray';
							return (
								<Box key={col} flexDirection="column" alignItems="center" paddingX={1}>
									{art.map((line, li) => (
										<Text key={li} color={color}>{line}</Text>
									))}
									<Text bold color={isVisible ? 'green' : 'gray'}>[{MOLE_KEYS[row]![col]}]</Text>
								</Box>
							);
						})}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} whacked {score} moles! Score: {score * 10 + maxCombo * 5}</Text>
				) : (
					<Text dimColor>Press Q/W/E A/S/D Z/X/C to whack! Misses: {misses}</Text>
				)}
			</Box>
		</Box>
	);
}
