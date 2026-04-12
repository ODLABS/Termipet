import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

interface PongProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 40;
const H = 16;
const PADDLE_H = 4;
const WIN_SCORE = 5;

export function PongGame({onComplete, petName}: PongProps) {
	const [playerY, setPlayerY] = useState(Math.floor(H / 2 - PADDLE_H / 2));
	const [cpuY, setCpuY] = useState(Math.floor(H / 2 - PADDLE_H / 2));
	const [ballX, setBallX] = useState(Math.floor(W / 2));
	const [ballY, setBallY] = useState(Math.floor(H / 2));
	const [ballDx, setBallDx] = useState(1);
	const [ballDy, setBallDy] = useState(1);
	const [playerScore, setPlayerScore] = useState(0);
	const [cpuScore, setCpuScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [rally, setRally] = useState(0);
	const [maxRally, setMaxRally] = useState(0);

	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setBallX(prev => {
				let nx = prev + ballDx;
				let ny = ballY + ballDy;
				let ndx = ballDx;
				let ndy = ballDy;

				// Top/bottom walls
				if (ny <= 0 || ny >= H - 1) {
					ndy = -ndy;
					ny = ny <= 0 ? 1 : H - 2;
				}

				// Player paddle (left side, x=1)
				if (nx <= 2 && ndx < 0) {
					if (ny >= playerY && ny < playerY + PADDLE_H) {
						ndx = 1;
						nx = 3;
						setRally(r => {
							const newR = r + 1;
							setMaxRally(m => Math.max(m, newR));
							return newR;
						});
					} else if (nx <= 0) {
						setCpuScore(s => {
							const ns = s + 1;
							if (ns >= WIN_SCORE) setGameOver(true);
							return ns;
						});
						setRally(0);
						nx = Math.floor(W / 2);
						ny = Math.floor(H / 2);
						ndx = 1;
						ndy = Math.random() > 0.5 ? 1 : -1;
					}
				}

				// CPU paddle (right side, x=W-2)
				if (nx >= W - 3 && ndx > 0) {
					if (ny >= cpuY && ny < cpuY + PADDLE_H) {
						ndx = -1;
						nx = W - 4;
						setRally(r => {
							const newR = r + 1;
							setMaxRally(m => Math.max(m, newR));
							return newR;
						});
					} else if (nx >= W - 1) {
						setPlayerScore(s => {
							const ns = s + 1;
							if (ns >= WIN_SCORE) setGameOver(true);
							return ns;
						});
						setRally(0);
						nx = Math.floor(W / 2);
						ny = Math.floor(H / 2);
						ndx = -1;
						ndy = Math.random() > 0.5 ? 1 : -1;
					}
				}

				setBallDx(ndx);
				setBallDy(ndy);
				setBallY(ny);
				return nx;
			});

			// CPU AI - follows ball with some delay
			setCpuY(prev => {
				const target = ballY - Math.floor(PADDLE_H / 2);
				if (prev < target) return Math.min(prev + 1, H - PADDLE_H);
				if (prev > target) return Math.max(prev - 1, 0);
				return prev;
			});
		}, 60);
		return () => clearInterval(timer);
	}, [ballDx, ballDy, ballY, playerY, cpuY, gameOver]);

	useEffect(() => {
		if (gameOver) {
			const finalScore = playerScore * 100 + maxRally * 10;
			const timer = setTimeout(() => onComplete(finalScore), 2000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, playerScore, maxRally, onComplete]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}
		if (key.upArrow) setPlayerY(p => Math.max(0, p - 2));
		if (key.downArrow) setPlayerY(p => Math.min(H - PADDLE_H, p + 2));
	});

	const grid: string[][] = Array.from({length: H}, () => Array(W).fill(' '));
	const gridColors: string[][] = Array.from({length: H}, () => Array(W).fill(''));

	// Draw center line
	for (let y = 0; y < H; y++) {
		grid[y]![Math.floor(W / 2)] = y % 2 === 0 ? ':' : ' ';
		gridColors[y]![Math.floor(W / 2)] = 'gray';
	}

	// Draw paddles
	for (let i = 0; i < PADDLE_H; i++) {
		if (playerY + i < H) {
			grid[playerY + i]![1] = '█';
			gridColors[playerY + i]![1] = 'cyan';
		}
		if (cpuY + i < H) {
			grid[cpuY + i]![W - 2] = '█';
			gridColors[cpuY + i]![W - 2] = 'red';
		}
	}

	// Draw ball
	if (ballY >= 0 && ballY < H && ballX >= 0 && ballX < W) {
		grid[ballY]![ballX] = 'O';
		gridColors[ballY]![ballX] = 'yellow';
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="yellow">PONG</Text>
				<Text> | </Text>
				<Text color="cyan">{petName}: <Text bold>{playerScore}</Text></Text>
				<Text>  vs  </Text>
				<Text color="red">CPU: <Text bold>{cpuScore}</Text></Text>
				<Text> | First to {WIN_SCORE} wins!</Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="yellow">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={gridColors[ri]![ci] || undefined}>
								{cell}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color={playerScore >= WIN_SCORE ? 'green' : 'red'}>
						{playerScore >= WIN_SCORE ? `${petName} WINS!` : 'CPU wins...'} Score: {playerScore * 100 + maxRally * 10}
					</Text>
				) : (
					<Text dimColor>↑↓ Move paddle | Rally: {rally} | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
