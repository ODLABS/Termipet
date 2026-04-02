import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';

interface SnakeProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 24;
const H = 14;
const GAME_DURATION = 60_000;

type Point = {x: number; y: number};
type Dir = 'up' | 'down' | 'left' | 'right';

function randomFood(snake: Point[]): Point {
	let food: Point;
	do {
		food = {x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H)};
	} while (snake.some(s => s.x === food.x && s.y === food.y));
	return food;
}

export function SnakeGame({onComplete, petName}: SnakeProps) {
	const [snake, setSnake] = useState<Point[]>([{x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7}]);
	const [dir, setDir] = useState<Dir>('right');
	const [food, setFood] = useState<Point>(() => randomFood([{x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7}]));
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

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

	useEffect(() => {
		if (gameOver) return undefined;
		const speed = Math.max(80, 150 - score * 2);
		const timer = setInterval(() => {
			setSnake(prev => {
				const head = prev[0]!;
				const deltas: Record<Dir, Point> = {
					up: {x: 0, y: -1},
					down: {x: 0, y: 1},
					left: {x: -1, y: 0},
					right: {x: 1, y: 0},
				};
				const d = deltas[dir];
				const newHead = {x: head.x + d.x, y: head.y + d.y};

				// Check walls
				if (newHead.x < 0 || newHead.x >= W || newHead.y < 0 || newHead.y >= H) {
					setGameOver(true);
					return prev;
				}

				// Check self collision
				if (prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
					setGameOver(true);
					return prev;
				}

				const newSnake = [newHead, ...prev];

				// Check food
				if (newHead.x === food.x && newHead.y === food.y) {
					setScore(s => s + 10);
					setFood(randomFood(newSnake));
				} else {
					newSnake.pop();
				}

				return newSnake;
			});
		}, speed);
		return () => clearInterval(timer);
	}, [dir, food, gameOver, score]);

	useEffect(() => {
		if (gameOver) {
			const timer = setTimeout(() => onComplete(score), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, onComplete]);

	useInput((_input, key) => {
		if (gameOver) return;
		if (key.upArrow && dir !== 'down') setDir('up');
		else if (key.downArrow && dir !== 'up') setDir('down');
		else if (key.leftArrow && dir !== 'right') setDir('left');
		else if (key.rightArrow && dir !== 'left') setDir('right');
	});

	const grid: string[][] = Array.from({length: H}, () => Array(W).fill(' '));
	const colors: string[][] = Array.from({length: H}, () => Array(W).fill('gray'));

	// Draw food
	grid[food.y]![food.x] = '*';
	colors[food.y]![food.x] = 'red';

	// Draw snake
	for (let i = 0; i < snake.length; i++) {
		const s = snake[i]!;
		if (s.x >= 0 && s.x < W && s.y >= 0 && s.y < H) {
			grid[s.y]![s.x] = i === 0 ? '@' : 'o';
			colors[s.y]![s.x] = i === 0 ? 'green' : 'greenBright';
		}
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="green">SNAKE</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Length: <Text bold color="cyan">{snake.length}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="green">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={colors[ri]![ci]}>
								{cell === ' ' ? '· ' : cell + ' '}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="red">GAME OVER! {petName} scored {score}!</Text>
				) : (
					<Text dimColor>Arrow keys to move | Eat <Text color="red">*</Text> to grow!</Text>
				)}
			</Box>
		</Box>
	);
}
