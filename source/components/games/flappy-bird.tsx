import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

interface FlappyBirdProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 40;
const H = 16;
const GRAVITY = 0.6;
const FLAP_POWER = -2.5;
const PIPE_GAP = 5;
const PIPE_SPACING = 15;

interface Pipe {
	x: number;
	gapY: number;
	scored: boolean;
}

export function FlappyBirdGame({onComplete, petName}: FlappyBirdProps) {
	const [birdY, setBirdY] = useState(H / 2);
	const [velocity, setVelocity] = useState(0);
	const [pipes, setPipes] = useState<Pipe[]>([
		{x: W, gapY: Math.floor(Math.random() * (H - PIPE_GAP - 4)) + 2, scored: false},
	]);
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [started, setStarted] = useState(false);
	const [frame, setFrame] = useState(0);

	// Game loop
	useEffect(() => {
		if (gameOver || !started) return undefined;
		const timer = setInterval(() => {
			setFrame(f => f + 1);

			// Update bird
			setVelocity(v => v + GRAVITY);
			setBirdY(y => {
				const newY = y + velocity;
				if (newY <= 0 || newY >= H - 1) {
					setGameOver(true);
					return Math.max(0, Math.min(H - 1, newY));
				}
				return newY;
			});

			// Update pipes
			setPipes(prev => {
				let updated = prev.map(p => ({...p, x: p.x - 1}));

				// Check collision
				const birdX = 5;
				const birdRow = Math.round(birdY);
				for (const pipe of updated) {
					if (pipe.x >= birdX - 1 && pipe.x <= birdX + 1) {
						if (birdRow <= pipe.gapY || birdRow >= pipe.gapY + PIPE_GAP) {
							setGameOver(true);
						}
					}
					// Score
					if (pipe.x === birdX - 2 && !pipe.scored) {
						pipe.scored = true;
						setScore(s => s + 10);
					}
				}

				// Remove off-screen pipes
				updated = updated.filter(p => p.x > -3);

				// Add new pipes
				const rightmost = updated.reduce((max, p) => Math.max(max, p.x), 0);
				if (rightmost < W - PIPE_SPACING) {
					updated.push({
						x: W,
						gapY: Math.floor(Math.random() * (H - PIPE_GAP - 4)) + 2,
						scored: false,
					});
				}

				return updated;
			});
		}, 80);
		return () => clearInterval(timer);
	}, [started, gameOver, velocity, birdY]);

	useEffect(() => {
		if (gameOver) {
			const timer = setTimeout(() => onComplete(score), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, onComplete]);

	useInput((input) => {
		if (gameOver) return;
		if (input === ' ' || input === 'w') {
			if (!started) setStarted(true);
			setVelocity(FLAP_POWER);
		}
	});

	// Render
	const grid: string[][] = Array.from({length: H}, () => Array(W).fill(' '));
	const gridColors: string[][] = Array.from({length: H}, () => Array(W).fill(''));

	// Draw pipes
	for (const pipe of pipes) {
		for (let y = 0; y < H; y++) {
			if (pipe.x >= 0 && pipe.x < W) {
				if (y <= pipe.gapY || y >= pipe.gapY + PIPE_GAP) {
					grid[y]![pipe.x] = '█';
					gridColors[y]![pipe.x] = 'green';
					// Pipe edges
					if (pipe.x - 1 >= 0) {
						if (y === pipe.gapY || y === pipe.gapY + PIPE_GAP) {
							grid[y]![pipe.x - 1] = '▐';
							gridColors[y]![pipe.x - 1] = 'green';
						}
					}
					if (pipe.x + 1 < W) {
						if (y === pipe.gapY || y === pipe.gapY + PIPE_GAP) {
							grid[y]![pipe.x + 1] = '▌';
							gridColors[y]![pipe.x + 1] = 'green';
						}
					}
				}
			}
		}
	}

	// Draw bird
	const birdRow = Math.round(birdY);
	const birdX = 5;
	if (birdRow >= 0 && birdRow < H) {
		const birdChars = velocity < 0 ? ['^', '>'] : ['>', 'v'];
		grid[birdRow]![birdX] = birdChars[0]!;
		gridColors[birdRow]![birdX] = 'yellow';
		if (birdX + 1 < W) {
			grid[birdRow]![birdX + 1] = birdChars[1]!;
			gridColors[birdRow]![birdX + 1] = 'yellow';
		}
	}

	// Draw ground
	for (let x = 0; x < W; x++) {
		grid[H - 1]![x] = '▓';
		gridColors[H - 1]![x] = 'yellowBright';
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="yellow">FLAPPY BIRD</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Pipes: <Text bold color="cyan">{Math.floor(score / 10)}</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="blue">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={gridColors[ri]![ci] || 'blueBright'}>
								{cell === ' ' ? (ri < H - 1 ? ' ' : '▓') : cell}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="red">{petName} flew past {Math.floor(score / 10)} pipes! Score: {score}</Text>
				) : !started ? (
					<Text bold color="yellow">Press SPACE to flap!</Text>
				) : (
					<Text dimColor>SPACE to flap | Don't hit the pipes!</Text>
				)}
			</Box>
		</Box>
	);
}
