import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface Game2048Props {
	onComplete: (score: number) => void;
	petName: string;
}

const SIZE = 4;
type Grid = number[][];

function createGrid(): Grid {
	const grid: Grid = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
	addRandom(grid);
	addRandom(grid);
	return grid;
}

function addRandom(grid: Grid): void {
	const empty: [number, number][] = [];
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r]![c] === 0) empty.push([r, c]);
		}
	}
	if (empty.length === 0) return;
	const [r, c] = empty[Math.floor(Math.random() * empty.length)]!;
	grid[r]![c] = Math.random() < 0.9 ? 2 : 4;
}

function slideRow(row: number[]): {row: number[]; score: number} {
	const filtered = row.filter(x => x !== 0);
	let score = 0;
	const merged: number[] = [];
	let i = 0;
	while (i < filtered.length) {
		if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
			const val = filtered[i]! * 2;
			merged.push(val);
			score += val;
			i += 2;
		} else {
			merged.push(filtered[i]!);
			i++;
		}
	}
	while (merged.length < SIZE) merged.push(0);
	return {row: merged, score};
}

function moveGrid(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): {grid: Grid; score: number; moved: boolean} {
	const newGrid = grid.map(r => [...r]);
	let totalScore = 0;
	let moved = false;

	if (direction === 'left' || direction === 'right') {
		for (let r = 0; r < SIZE; r++) {
			let row = [...newGrid[r]!];
			if (direction === 'right') row.reverse();
			const result = slideRow(row);
			if (direction === 'right') result.row.reverse();
			totalScore += result.score;
			if (JSON.stringify(result.row) !== JSON.stringify(newGrid[r])) moved = true;
			newGrid[r] = result.row;
		}
	} else {
		for (let c = 0; c < SIZE; c++) {
			let col = Array.from({length: SIZE}, (_, r) => newGrid[r]![c]!);
			if (direction === 'down') col.reverse();
			const result = slideRow(col);
			if (direction === 'down') result.row.reverse();
			totalScore += result.score;
			for (let r = 0; r < SIZE; r++) {
				if (newGrid[r]![c] !== result.row[r]) moved = true;
				newGrid[r]![c] = result.row[r]!;
			}
		}
	}

	return {grid: newGrid, score: totalScore, moved};
}

function canMove(grid: Grid): boolean {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r]![c] === 0) return true;
			if (c + 1 < SIZE && grid[r]![c] === grid[r]![c + 1]) return true;
			if (r + 1 < SIZE && grid[r]![c] === grid[r + 1]![c]) return true;
		}
	}
	return false;
}

function hasWon(grid: Grid): boolean {
	return grid.some(row => row.some(v => v >= 2048));
}

const TILE_COLORS: Record<number, string> = {
	0: 'gray',
	2: 'white',
	4: 'cyan',
	8: 'yellow',
	16: 'yellowBright',
	32: 'red',
	64: 'redBright',
	128: 'green',
	256: 'greenBright',
	512: 'blue',
	1024: 'magenta',
	2048: 'yellow',
	4096: 'red',
};

export function Game2048({onComplete, petName}: Game2048Props) {
	const [grid, setGrid] = useState<Grid>(createGrid);
	const [score, setScore] = useState(0);
	const [bestTile, setBestTile] = useState(2);
	const [gameOver, setGameOver] = useState(false);
	const [won, setWon] = useState(false);
	const [moves, setMoves] = useState(0);
	const [timeLeft, setTimeLeft] = useState(60);

	const scoreRef = useRef(score);
	useEffect(() => { scoreRef.current = score; }, [score]);

	const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
		if (gameOver) return;
		const result = moveGrid(grid, direction);
		if (!result.moved) return;

		addRandom(result.grid);
		setGrid(result.grid);
		setScore(s => s + result.score);
		setMoves(m => m + 1);

		const maxTile = Math.max(...result.grid.flat());
		setBestTile(maxTile);

		if (hasWon(result.grid) && !won) {
			setWon(true);
		}

		if (!canMove(result.grid)) {
			setGameOver(true);
		}
	}, [grid, gameOver, won]);

	// Timer countdown
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

	// End game callback
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
		if (key.upArrow) handleMove('up');
		if (key.downArrow) handleMove('down');
		if (key.leftArrow) handleMove('left');
		if (key.rightArrow) handleMove('right');
	});

	const padTile = (val: number): string => {
		const s = val === 0 ? '·' : String(val);
		return s.padStart(4).padEnd(5);
	};

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="yellow">2048</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Best: <Text bold color="cyan">{bestTile}</Text></Text>
				<Text> | Moves: <Text bold>{moves}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((val, ci) => (
							<Text key={ci} color={TILE_COLORS[val] ?? 'white'} bold={val >= 8}>
								{padTile(val)}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color={won ? 'green' : 'red'}>
						GAME OVER! {won ? `${petName} reached 2048!` : 'No more moves!'} Score: {score}
					</Text>
				) : (
					<Text dimColor>Arrow keys to slide tiles | Merge to reach 2048! | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
