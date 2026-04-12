import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface CatchProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 30;
const H = 14;
const GAME_DURATION = 45_000;
const BASKET_W = 5;

interface FallingItem {
	x: number;
	y: number;
	type: 'food' | 'rock' | 'bonus';
	char: string;
}

const FOOD_CHARS = ['🍎', '*', '+', 'o', '@'];
const ROCK_CHARS = ['#', 'X', '%'];

function randomItem(): FallingItem {
	const r = Math.random();
	let type: 'food' | 'rock' | 'bonus';
	let char: string;
	if (r < 0.15) {
		type = 'bonus';
		char = '$';
	} else if (r < 0.35) {
		type = 'rock';
		char = ROCK_CHARS[Math.floor(Math.random() * ROCK_CHARS.length)]!;
	} else {
		type = 'food';
		char = FOOD_CHARS[Math.floor(Math.random() * FOOD_CHARS.length)]!;
	}
	return {
		x: Math.floor(Math.random() * (W - 2)) + 1,
		y: 0,
		type,
		char,
	};
}

export function CatchGame({onComplete, petName}: CatchProps) {
	const [basketX, setBasketX] = useState(Math.floor(W / 2 - BASKET_W / 2));
	const [items, setItems] = useState<FallingItem[]>([]);
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);
	const [caught, setCaught] = useState(0);
	const [message, setMessage] = useState('');

	const scoreRef = useRef(score);
	useEffect(() => { scoreRef.current = score; }, [score]);

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

	// Spawn items
	useEffect(() => {
		if (gameOver) return undefined;
		const rate = Math.max(300, 800 - caught * 10);
		const timer = setInterval(() => {
			setItems(prev => [...prev, randomItem()]);
		}, rate);
		return () => clearInterval(timer);
	}, [gameOver, caught]);

	// Gravity
	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setItems(prev => {
				const next: FallingItem[] = [];
				for (const item of prev) {
					const ny = item.y + 1;
					if (ny >= H - 1) {
						// Check if caught
						if (item.x >= basketX && item.x < basketX + BASKET_W) {
							if (item.type === 'food') {
								setScore(s => s + 10);
								setCaught(c => c + 1);
							} else if (item.type === 'bonus') {
								setScore(s => s + 50);
								setCaught(c => c + 1);
								setMessage('+50 BONUS!');
								setTimeout(() => setMessage(''), 800);
							} else {
								setLives(l => {
									const nl = l - 1;
									if (nl <= 0) setGameOver(true);
									return nl;
								});
								setMessage('OUCH! Rock!');
								setTimeout(() => setMessage(''), 800);
							}
						} else if (item.type === 'food') {
							// Missed food
						}
					} else {
						next.push({...item, y: ny});
					}
				}
				return next;
			});
		}, 150);
		return () => clearInterval(timer);
	}, [basketX, gameOver]);

	useEffect(() => {
		if (!gameOver) return undefined;
		const t = setTimeout(() => onComplete(scoreRef.current), 2000);
		return () => clearTimeout(t);
	}, [gameOver]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}
		if (key.leftArrow) setBasketX(x => Math.max(0, x - 2));
		if (key.rightArrow) setBasketX(x => Math.min(W - BASKET_W, x + 2));
	});

	// Render grid
	const grid: string[][] = Array.from({length: H}, () => Array(W).fill(' '));
	const gridColors: string[][] = Array.from({length: H}, () => Array(W).fill(''));

	// Draw items
	for (const item of items) {
		if (item.y >= 0 && item.y < H && item.x >= 0 && item.x < W) {
			grid[item.y]![item.x] = item.char;
			gridColors[item.y]![item.x] = item.type === 'food' ? 'green' : item.type === 'bonus' ? 'yellow' : 'red';
		}
	}

	// Draw basket
	const basketY = H - 1;
	const basketStr = '\\___/';
	for (let i = 0; i < BASKET_W; i++) {
		if (basketX + i < W) {
			grid[basketY]![basketX + i] = basketStr[i] || '_';
			gridColors[basketY]![basketX + i] = 'cyan';
		}
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="cyan">CATCH!</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Lives: <Text bold color={lives <= 1 ? 'red' : 'green'}>{'♥'.repeat(lives)}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			{message && (
				<Box>
					<Text bold color={message.includes('BONUS') ? 'yellow' : 'red'}>{message}</Text>
				</Box>
			)}
			<Box flexDirection="column" borderStyle="round" borderColor="cyan">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={gridColors[ri]![ci] || undefined}>
								{cell === ' ' ? '  ' : cell + ' '}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} caught {caught} items! Score: {score}</Text>
				) : (
					<Text dimColor>←→ Move basket | Catch <Text color="green">food</Text>, avoid <Text color="red">rocks</Text> | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
