import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface FroggerProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 30;
const H = 13;
const GAME_DURATION = 60_000;

interface Lane {
	type: 'safe' | 'road' | 'water';
	obstacles: number[]; // x positions of obstacles
	speed: number; // positive = right, negative = left
	char: string;
}

function createLanes(): Lane[] {
	const lanes: Lane[] = [];
	// Bottom safe zone
	lanes.push({type: 'safe', obstacles: [], speed: 0, char: ' '});
	// Road lanes
	for (let i = 0; i < 4; i++) {
		const speed = (i % 2 === 0 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
		const count = 2 + Math.floor(Math.random() * 3);
		const obs: number[] = [];
		for (let j = 0; j < count; j++) {
			obs.push(Math.floor(Math.random() * W));
		}
		lanes.push({type: 'road', obstacles: obs, speed, char: i % 2 === 0 ? '>' : '<'});
	}
	// Middle safe zone
	lanes.push({type: 'safe', obstacles: [], speed: 0, char: ' '});
	// Water lanes with logs
	for (let i = 0; i < 4; i++) {
		const speed = (i % 2 === 0 ? 1 : -1);
		const count = 3 + Math.floor(Math.random() * 2);
		const obs: number[] = [];
		for (let j = 0; j < count; j++) {
			obs.push(Math.floor(Math.random() * W));
		}
		lanes.push({type: 'water', obstacles: obs, speed, char: '='});
	}
	// Safe zones
	lanes.push({type: 'safe', obstacles: [], speed: 0, char: ' '});
	lanes.push({type: 'safe', obstacles: [], speed: 0, char: ' '});
	// Goal
	lanes.push({type: 'safe', obstacles: [], speed: 0, char: ' '});
	return lanes;
}

export function FroggerGame({onComplete, petName}: FroggerProps) {
	const [lanes, setLanes] = useState<Lane[]>(createLanes);
	const [frogX, setFrogX] = useState(Math.floor(W / 2));
	const [frogY, setFrogY] = useState(0);
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);
	const [gameOver, setGameOver] = useState(false);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [maxRow, setMaxRow] = useState(0);
	const [crossings, setCrossings] = useState(0);

	const scoreRef = useRef(score);
	const crossingsRef = useRef(crossings);
	useEffect(() => { scoreRef.current = score; }, [score]);
	useEffect(() => { crossingsRef.current = crossings; }, [crossings]);

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

	// Move obstacles
	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setLanes(prev => prev.map(lane => {
				if (lane.speed === 0) return lane;
				return {
					...lane,
					obstacles: lane.obstacles.map(x => {
						let nx = x + lane.speed;
						if (nx >= W) nx -= W;
						if (nx < 0) nx += W;
						return nx;
					}),
				};
			}));
		}, 200);
		return () => clearInterval(timer);
	}, [gameOver]);

	// Collision detection
	useEffect(() => {
		if (gameOver) return;
		const lane = lanes[frogY];
		if (!lane) return;

		if (lane.type === 'road') {
			// Check car collision (cars are 2-wide)
			for (const ox of lane.obstacles) {
				if (Math.abs(frogX - ox) <= 1) {
					setLives(l => {
						const nl = l - 1;
						if (nl <= 0) setGameOver(true);
						return nl;
					});
					setFrogX(Math.floor(W / 2));
					setFrogY(0);
					return;
				}
			}
		}

		if (lane.type === 'water') {
			// Must be on a log
			let onLog = false;
			for (const ox of lane.obstacles) {
				if (Math.abs(frogX - ox) <= 1) {
					onLog = true;
					// Move with log
					setFrogX(x => {
						let nx = x + lane.speed;
						if (nx < 0 || nx >= W) {
							setLives(l => {
								const nl = l - 1;
								if (nl <= 0) setGameOver(true);
								return nl;
							});
							setFrogY(0);
							return Math.floor(W / 2);
						}
						return nx;
					});
					break;
				}
			}
			if (!onLog) {
				setLives(l => {
					const nl = l - 1;
					if (nl <= 0) setGameOver(true);
					return nl;
				});
				setFrogX(Math.floor(W / 2));
				setFrogY(0);
			}
		}
	}, [lanes, frogX, frogY, gameOver]);

	useEffect(() => {
		if (!gameOver) return undefined;
		const t = setTimeout(() => onComplete(scoreRef.current + crossingsRef.current * 50), 2000);
		return () => clearTimeout(t);
	}, [gameOver]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}
		if (key.upArrow) {
			const newY = Math.min(lanes.length - 1, frogY + 1);
			setFrogY(newY);
			if (newY > maxRow) {
				setMaxRow(newY);
				setScore(s => s + 10);
			}
			// Check if reached goal
			if (newY >= lanes.length - 1) {
				setCrossings(c => c + 1);
				setScore(s => s + 100);
				setFrogX(Math.floor(W / 2));
				setFrogY(0);
				setMaxRow(0);
			}
		}
		if (key.downArrow) setFrogY(y => Math.max(0, y - 1));
		if (key.leftArrow) setFrogX(x => Math.max(0, x - 1));
		if (key.rightArrow) setFrogX(x => Math.min(W - 1, x + 1));
	});

	// Build display (lanes are bottom-to-top in data, top-to-bottom on screen)
	const displayLanes = [...lanes].reverse();
	const displayFrogY = lanes.length - 1 - frogY;

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="green">FROGGER</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Lives: <Text bold color={lives <= 1 ? 'red' : 'green'}>{'♥'.repeat(lives)}</Text></Text>
				<Text> | Crosses: <Text bold color="cyan">{crossings}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="green">
				{displayLanes.map((lane, ri) => {
					const row = Array(W).fill(' ');
					const rowColors = Array(W).fill('');

					if (lane.type === 'safe') {
						for (let x = 0; x < W; x++) {
							row[x] = ri === 0 ? '★' : '·';
							rowColors[x] = ri === 0 ? 'yellow' : 'green';
						}
					} else if (lane.type === 'road') {
						for (let x = 0; x < W; x++) {
							row[x] = '-';
							rowColors[x] = 'gray';
						}
						for (const ox of lane.obstacles) {
							for (let dx = -1; dx <= 1; dx++) {
								const px = (ox + dx + W) % W;
								row[px] = lane.char;
								rowColors[px] = 'red';
							}
						}
					} else {
						for (let x = 0; x < W; x++) {
							row[x] = '~';
							rowColors[x] = 'blue';
						}
						for (const ox of lane.obstacles) {
							for (let dx = -1; dx <= 1; dx++) {
								const px = (ox + dx + W) % W;
								row[px] = '=';
								rowColors[px] = 'yellowBright';
							}
						}
					}

					// Draw frog
					if (ri === displayFrogY) {
						row[frogX] = '@';
						rowColors[frogX] = 'greenBright';
					}

					return (
						<Box key={ri}>
							{row.map((cell, ci) => (
								<Text key={ci} color={rowColors[ci] || undefined}>{cell}</Text>
							))}
						</Box>
					);
				})}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} crossed {crossings} times! Score: {score + crossings * 50}</Text>
				) : (
					<Text dimColor>Arrow keys to hop | Cross the road and river! | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
