import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface MinesweeperProps {
	onComplete: (score: number) => void;
	petName: string;
}

const GRID_W = 10;
const GRID_H = 8;
const MINE_COUNT = 10;
const GAME_DURATION = 60_000;

type CellState = 'hidden' | 'revealed' | 'flagged';

interface Cell {
	mine: boolean;
	adjacent: number;
	state: CellState;
}

function createGrid(): Cell[][] {
	const grid: Cell[][] = Array.from({length: GRID_H}, () =>
		Array.from({length: GRID_W}, () => ({mine: false, adjacent: 0, state: 'hidden' as CellState}))
	);

	// Place mines
	let placed = 0;
	while (placed < MINE_COUNT) {
		const x = Math.floor(Math.random() * GRID_W);
		const y = Math.floor(Math.random() * GRID_H);
		if (!grid[y]![x]!.mine) {
			grid[y]![x]!.mine = true;
			placed++;
		}
	}

	// Calculate adjacents
	for (let y = 0; y < GRID_H; y++) {
		for (let x = 0; x < GRID_W; x++) {
			if (grid[y]![x]!.mine) continue;
			let count = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ny = y + dy;
					const nx = x + dx;
					if (ny >= 0 && ny < GRID_H && nx >= 0 && nx < GRID_W && grid[ny]![nx]!.mine) {
						count++;
					}
				}
			}
			grid[y]![x]!.adjacent = count;
		}
	}

	return grid;
}

const NUM_COLORS: Record<number, string> = {
	1: 'blue',
	2: 'green',
	3: 'red',
	4: 'magenta',
	5: 'yellow',
	6: 'cyan',
	7: 'white',
	8: 'gray',
};

export function MinesweeperGame({onComplete, petName}: MinesweeperProps) {
	const [grid, setGrid] = useState<Cell[][]>(createGrid);
	const [cursorX, setCursorX] = useState(0);
	const [cursorY, setCursorY] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [won, setWon] = useState(false);
	const [revealedCount, setRevealedCount] = useState(0);
	const [flagCount, setFlagCount] = useState(0);
	const [startTime] = useState(Date.now());
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

	const wonRef = useRef(won);
	const revealedCountRef = useRef(revealedCount);
	const startTimeRef = useRef(startTime);
	useEffect(() => { wonRef.current = won; }, [won]);
	useEffect(() => { revealedCountRef.current = revealedCount; }, [revealedCount]);
	useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

	const totalSafe = GRID_W * GRID_H - MINE_COUNT;

	const revealCell = useCallback((g: Cell[][], x: number, y: number): {grid: Cell[][]; count: number} => {
		if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return {grid: g, count: 0};
		const cell = g[y]![x]!;
		if (cell.state !== 'hidden') return {grid: g, count: 0};

		const newGrid = g.map(row => row.map(c => ({...c})));
		newGrid[y]![x]!.state = 'revealed';
		let count = 1;

		if (cell.adjacent === 0 && !cell.mine) {
			// Flood fill
			const queue: [number, number][] = [[x, y]];
			while (queue.length > 0) {
				const [cx, cy] = queue.shift()!;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const nx = cx + dx;
						const ny = cy + dy;
						if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
							const nc = newGrid[ny]![nx]!;
							if (nc.state === 'hidden' && !nc.mine) {
								nc.state = 'revealed';
								count++;
								if (nc.adjacent === 0) {
									queue.push([nx, ny]);
								}
							}
						}
					}
				}
			}
		}

		return {grid: newGrid, count};
	}, []);

	const checkWin = useCallback((revealed: number) => {
		if (revealed >= totalSafe) {
			setWon(true);
			setGameOver(true);
		}
	}, [totalSafe]);

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
		const t = setTimeout(() => {
			const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
			const timeBonus = Math.max(0, 300 - elapsed * 2);
			const finalScore = wonRef.current ? revealedCountRef.current * 10 + timeBonus + 200 : Math.floor(revealedCountRef.current * 5);
			onComplete(finalScore);
		}, 2000);
		return () => clearTimeout(t);
	}, [gameOver]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input === 'q' || key.escape) {
			setGameOver(true);
			return;
		}

		if (key.upArrow) setCursorY(y => Math.max(0, y - 1));
		if (key.downArrow) setCursorY(y => Math.min(GRID_H - 1, y + 1));
		if (key.leftArrow) setCursorX(x => Math.max(0, x - 1));
		if (key.rightArrow) setCursorX(x => Math.min(GRID_W - 1, x + 1));

		if (input === ' ' || key.return) {
			const cell = grid[cursorY]![cursorX]!;
			if (cell.state === 'flagged') return;
			if (cell.mine) {
				// Game over - reveal all
				const newGrid = grid.map(row => row.map(c => ({...c, state: 'revealed' as CellState})));
				setGrid(newGrid);
				setGameOver(true);
				return;
			}
			const result = revealCell(grid, cursorX, cursorY);
			setGrid(result.grid);
			const newCount = revealedCount + result.count;
			setRevealedCount(newCount);
			checkWin(newCount);
		}

		if (input === 'f') {
			const cell = grid[cursorY]![cursorX]!;
			if (cell.state === 'revealed') return;
			const newGrid = grid.map(row => row.map(c => ({...c})));
			if (cell.state === 'flagged') {
				newGrid[cursorY]![cursorX]!.state = 'hidden';
				setFlagCount(f => f - 1);
			} else {
				newGrid[cursorY]![cursorX]!.state = 'flagged';
				setFlagCount(f => f + 1);
			}
			setGrid(newGrid);
		}
	});

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="red">MINESWEEPER</Text>
				<Text> | </Text>
				<Text>Mines: <Text bold color="red">{MINE_COUNT - flagCount}</Text></Text>
				<Text> | Cleared: <Text bold color="green">{revealedCount}/{totalSafe}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>

			{/* Column numbers */}
			<Box>
				<Text>   </Text>
				{Array.from({length: GRID_W}, (_, i) => (
					<Text key={i} color="gray">{' ' + i + ' '}</Text>
				))}
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={won ? 'green' : gameOver ? 'red' : 'white'}>
				{grid.map((row, ri) => (
					<Box key={ri}>
						<Text color="gray">{ri + ' '}</Text>
						{row.map((cell, ci) => {
							const isCursor = ci === cursorX && ri === cursorY;
							let char = '■';
							let color = 'gray';

							if (cell.state === 'revealed') {
								if (cell.mine) {
									char = '*';
									color = 'red';
								} else if (cell.adjacent > 0) {
									char = String(cell.adjacent);
									color = NUM_COLORS[cell.adjacent] ?? 'white';
								} else {
									char = '·';
									color = 'white';
								}
							} else if (cell.state === 'flagged') {
								char = '⚑';
								color = 'yellow';
							}

							return (
								<Text key={ci} color={color} inverse={isCursor} bold={isCursor}>
									{' ' + char + ' '}
								</Text>
							);
						})}
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					won ? (
						<Text bold color="green">GAME OVER! {petName} cleared all mines!</Text>
					) : (
						<Text bold color="red">GAME OVER! {petName} hit a mine!</Text>
					)
				) : (
					<Text dimColor>Arrows: move | Space: reveal | F: flag | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
