import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface MazeRunnerProps {
	onComplete: (score: number) => void;
	petName: string;
}

const MAZE_W = 15;
const MAZE_H = 9;
const GAME_DURATION = 60_000;

type MazeCell = {
	walls: {top: boolean; right: boolean; bottom: boolean; left: boolean};
	visited: boolean;
};

function generateMaze(): MazeCell[][] {
	const maze: MazeCell[][] = Array.from({length: MAZE_H}, () =>
		Array.from({length: MAZE_W}, () => ({
			walls: {top: true, right: true, bottom: true, left: true},
			visited: false,
		}))
	);

	// Recursive backtracking
	const stack: [number, number][] = [];
	const start: [number, number] = [0, 0];
	maze[0]![0]!.visited = true;
	stack.push(start);

	while (stack.length > 0) {
		const [cx, cy] = stack[stack.length - 1]!;
		const neighbors: [number, number, string, string][] = [];

		if (cy > 0 && !maze[cy - 1]![cx]!.visited) neighbors.push([cx, cy - 1, 'top', 'bottom']);
		if (cx < MAZE_W - 1 && !maze[cy]![cx + 1]!.visited) neighbors.push([cx + 1, cy, 'right', 'left']);
		if (cy < MAZE_H - 1 && !maze[cy + 1]![cx]!.visited) neighbors.push([cx, cy + 1, 'bottom', 'top']);
		if (cx > 0 && !maze[cy]![cx - 1]!.visited) neighbors.push([cx - 1, cy, 'left', 'right']);

		if (neighbors.length === 0) {
			stack.pop();
		} else {
			const [nx, ny, wall1, wall2] = neighbors[Math.floor(Math.random() * neighbors.length)]!;
			(maze[cy]![cx]!.walls as any)[wall1] = false;
			(maze[ny]![nx]!.walls as any)[wall2] = false;
			maze[ny]![nx]!.visited = true;
			stack.push([nx, ny]);
		}
	}

	return maze;
}

export function MazeRunnerGame({onComplete, petName}: MazeRunnerProps) {
	const [maze, setMaze] = useState<MazeCell[][]>(generateMaze);
	const [playerX, setPlayerX] = useState(0);
	const [playerY, setPlayerY] = useState(0);
	const [score, setScore] = useState(0);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);
	const [moves, setMoves] = useState(0);
	const [mazesCleared, setMazesCleared] = useState(0);
	const [trail, setTrail] = useState<Set<string>>(new Set(['0,0']));

	const scoreRef = useRef(score);
	useEffect(() => { scoreRef.current = score; }, [score]);

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
		const cell = maze[playerY]![playerX]!;

		let moved = false;
		let nx = playerX;
		let ny = playerY;

		if (key.upArrow && !cell.walls.top) {
			ny = playerY - 1;
			moved = true;
		}
		if (key.downArrow && !cell.walls.bottom) {
			ny = playerY + 1;
			moved = true;
		}
		if (key.leftArrow && !cell.walls.left) {
			nx = playerX - 1;
			moved = true;
		}
		if (key.rightArrow && !cell.walls.right) {
			nx = playerX + 1;
			moved = true;
		}

		if (moved) {
			setPlayerX(nx);
			setPlayerY(ny);
			setMoves(m => m + 1);
			setTrail(prev => new Set([...prev, `${nx},${ny}`]));

			// Check if reached exit (bottom-right)
			if (nx === MAZE_W - 1 && ny === MAZE_H - 1) {
				const timeBonus = timeLeft * 2;
				const moveBonus = Math.max(0, 200 - moves * 2);
				const pts = 100 + timeBonus + moveBonus;
				setScore(s => s + pts);
				setMazesCleared(c => c + 1);

				// Generate new maze
				setMaze(generateMaze());
				setPlayerX(0);
				setPlayerY(0);
				setMoves(0);
				setTrail(new Set(['0,0']));
			}
		}
	});

	// Render maze as 2D grid
	const displayH = MAZE_H * 2 + 1;
	const displayW = MAZE_W * 2 + 1;
	const display: string[][] = Array.from({length: displayH}, () => Array(displayW).fill(' '));
	const colors: string[][] = Array.from({length: displayH}, () => Array(displayW).fill('gray'));

	// Draw walls
	for (let y = 0; y < MAZE_H; y++) {
		for (let x = 0; x < MAZE_W; x++) {
			const cell = maze[y]![x]!;
			const dy = y * 2 + 1;
			const dx = x * 2 + 1;

			// Corners
			display[dy - 1]![dx - 1] = '+';
			display[dy - 1]![dx + 1] = '+';
			display[dy + 1]![dx - 1] = '+';
			display[dy + 1]![dx + 1] = '+';

			// Walls
			if (cell.walls.top) {
				display[dy - 1]![dx] = '-';
			}
			if (cell.walls.bottom) {
				display[dy + 1]![dx] = '-';
			}
			if (cell.walls.left) {
				display[dy]![dx - 1] = '|';
			}
			if (cell.walls.right) {
				display[dy]![dx + 1] = '|';
			}

			// Trail
			if (trail.has(`${x},${y}`)) {
				display[dy]![dx] = '·';
				colors[dy]![dx] = 'gray';
			}
		}
	}

	// Player
	const pdy = playerY * 2 + 1;
	const pdx = playerX * 2 + 1;
	display[pdy]![pdx] = '@';
	colors[pdy]![pdx] = 'green';

	// Start marker
	display[1]![1] = display[1]![1] === '@' ? '@' : 'S';
	colors[1]![1] = colors[1]![1] === 'green' ? 'green' : 'cyan';

	// Exit marker
	const exitDy = (MAZE_H - 1) * 2 + 1;
	const exitDx = (MAZE_W - 1) * 2 + 1;
	if (display[exitDy]![exitDx] !== '@') {
		display[exitDy]![exitDx] = 'E';
		colors[exitDy]![exitDx] = 'yellow';
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="green">MAZE RUNNER</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Mazes: <Text bold color="cyan">{mazesCleared}</Text></Text>
				<Text> | Moves: <Text bold>{moves}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="green">
				{display.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={colors[ri]![ci] || 'gray'}>
								{cell}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} cleared {mazesCleared} mazes! Score: {score}</Text>
				) : (
					<Text dimColor>Arrow keys to navigate | <Text color="cyan">S</Text>=Start <Text color="yellow">E</Text>=Exit | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
