import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface BugCatcherProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 30;
const H = 14;
const GAME_DURATION = 45_000;

interface Bug {
	x: number;
	y: number;
	dx: number;
	dy: number;
	char: string;
	points: number;
	speed: number;
	id: number;
}

const BUG_TYPES = [
	{char: '~', points: 10, speed: 1, name: 'Worm'},
	{char: '^', points: 20, speed: 2, name: 'Spider'},
	{char: '&', points: 30, speed: 3, name: 'Beetle'},
	{char: '%', points: 50, speed: 2, name: 'Butterfly'},
	{char: '#', points: 100, speed: 4, name: 'Golden Bug'},
];

let bugIdCounter = 0;

function spawnBug(): Bug {
	const type = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)]!;
	const edge = Math.floor(Math.random() * 4);
	let x: number, y: number, dx: number, dy: number;
	switch (edge) {
		case 0: // top
			x = Math.floor(Math.random() * W);
			y = 0;
			dx = Math.random() > 0.5 ? 1 : -1;
			dy = 1;
			break;
		case 1: // right
			x = W - 1;
			y = Math.floor(Math.random() * H);
			dx = -1;
			dy = Math.random() > 0.5 ? 1 : -1;
			break;
		case 2: // bottom
			x = Math.floor(Math.random() * W);
			y = H - 1;
			dx = Math.random() > 0.5 ? 1 : -1;
			dy = -1;
			break;
		default: // left
			x = 0;
			y = Math.floor(Math.random() * H);
			dx = 1;
			dy = Math.random() > 0.5 ? 1 : -1;
	}
	return {x, y, dx, dy, char: type.char, points: type.points, speed: type.speed, id: ++bugIdCounter};
}

export function BugCatcherGame({onComplete, petName}: BugCatcherProps) {
	const [cursorX, setCursorX] = useState(Math.floor(W / 2));
	const [cursorY, setCursorY] = useState(Math.floor(H / 2));
	const [bugs, setBugs] = useState<Bug[]>([]);
	const [score, setScore] = useState(0);
	const [caught, setCaught] = useState(0);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);
	const [combo, setCombo] = useState(0);
	const [maxCombo, setMaxCombo] = useState(0);
	const [lastCatch, setLastCatch] = useState('');
	const [netFrame, setNetFrame] = useState(0);

	const scoreRef = useRef(score);
	const maxComboRef = useRef(maxCombo);
	useEffect(() => { scoreRef.current = score; }, [score]);
	useEffect(() => { maxComboRef.current = maxCombo; }, [maxCombo]);

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

	// Spawn bugs
	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setBugs(prev => {
				if (prev.length < 8 + Math.floor(caught / 5)) {
					return [...prev, spawnBug()];
				}
				return prev;
			});
		}, Math.max(300, 1000 - caught * 20));
		return () => clearInterval(timer);
	}, [gameOver, caught]);

	// Move bugs
	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setBugs(prev => prev.map(bug => {
				let nx = bug.x + bug.dx;
				let ny = bug.y + bug.dy;
				let ndx = bug.dx;
				let ndy = bug.dy;

				// Random direction change
				if (Math.random() < 0.2) {
					ndx = Math.floor(Math.random() * 3) - 1;
					ndy = Math.floor(Math.random() * 3) - 1;
					if (ndx === 0 && ndy === 0) ndx = 1;
				}

				// Bounce off walls
				if (nx < 0 || nx >= W) {ndx = -ndx; nx = Math.max(0, Math.min(W - 1, nx));}
				if (ny < 0 || ny >= H) {ndy = -ndy; ny = Math.max(0, Math.min(H - 1, ny));}

				return {...bug, x: nx, y: ny, dx: ndx, dy: ndy};
			}).filter(bug => bug.x >= -1 && bug.x <= W && bug.y >= -1 && bug.y <= H));

			setNetFrame(f => (f + 1) % 4);
		}, 150);
		return () => clearInterval(timer);
	}, [gameOver]);

	useEffect(() => {
		if (!gameOver) return undefined;
		const t = setTimeout(() => onComplete(scoreRef.current + maxComboRef.current * 10), 2000);
		return () => clearTimeout(t);
	}, [gameOver]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}

		if (key.upArrow) setCursorY(y => Math.max(0, y - 1));
		if (key.downArrow) setCursorY(y => Math.min(H - 1, y + 1));
		if (key.leftArrow) setCursorX(x => Math.max(0, x - 1));
		if (key.rightArrow) setCursorX(x => Math.min(W - 1, x + 1));

		if (input === ' ' || key.return) {
			// Try to catch bugs in a 3x3 area around cursor
			setBugs(prev => {
				const remaining: Bug[] = [];
				let caughtAny = false;
				for (const bug of prev) {
					if (Math.abs(bug.x - cursorX) <= 1 && Math.abs(bug.y - cursorY) <= 1) {
						const comboMultiplier = 1 + combo * 0.2;
						const pts = Math.floor(bug.points * comboMultiplier);
						setScore(s => s + pts);
						setCaught(c => c + 1);
						setCombo(c => {
							const nc = c + 1;
							setMaxCombo(m => Math.max(m, nc));
							return nc;
						});
						const bugName = BUG_TYPES.find(t => t.char === bug.char)?.name ?? 'Bug';
						setLastCatch(`Caught ${bugName}! +${pts}`);
						caughtAny = true;
					} else {
						remaining.push(bug);
					}
				}
				if (!caughtAny) {
					setCombo(0);
					setLastCatch('Missed!');
				}
				setTimeout(() => setLastCatch(''), 800);
				return remaining;
			});
		}
	});

	// Render
	const grid: string[][] = Array.from({length: H}, () => Array(W).fill('·'));
	const gridColors: string[][] = Array.from({length: H}, () => Array(W).fill('gray'));

	// Draw bugs
	for (const bug of bugs) {
		const bx = Math.round(bug.x);
		const by = Math.round(bug.y);
		if (bx >= 0 && bx < W && by >= 0 && by < H) {
			grid[by]![bx] = bug.char;
			gridColors[by]![bx] = bug.points >= 100 ? 'yellow' : bug.points >= 50 ? 'magenta' : bug.points >= 30 ? 'cyan' : bug.points >= 20 ? 'red' : 'green';
		}
	}

	// Draw net/cursor (3x3 area)
	const netChars = ['+', 'x', '+', 'x'];
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			const nx = cursorX + dx;
			const ny = cursorY + dy;
			if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
				if (dx === 0 && dy === 0) {
					grid[ny]![nx] = netChars[netFrame]!;
					gridColors[ny]![nx] = 'white';
				} else if (grid[ny]![nx] === '·') {
					grid[ny]![nx] = '·';
					gridColors[ny]![nx] = 'white';
				}
			}
		}
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="green">BUG CATCHER</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Caught: <Text bold color="cyan">{caught}</Text></Text>
				<Text> | Combo: <Text bold color={combo >= 3 ? 'green' : 'white'}>{combo}x</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>

			{lastCatch && (
				<Box>
					<Text bold color={lastCatch.includes('Missed') ? 'red' : 'green'}>{lastCatch}</Text>
				</Box>
			)}

			<Box marginBottom={1} gap={1}>
				<Text dimColor>Bugs: </Text>
				{BUG_TYPES.map((bt, i) => (
					<Text key={i} color={bt.points >= 100 ? 'yellow' : bt.points >= 50 ? 'magenta' : 'gray'}>
						{bt.char}={bt.points}pts
					</Text>
				))}
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor="green">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={gridColors[ri]![ci] || 'gray'}>
								{cell === '·' ? '· ' : cell + ' '}
							</Text>
						))}
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} caught {caught} bugs! Score: {score + maxCombo * 10}</Text>
				) : (
					<Text dimColor>Arrows: move net | Space: catch! | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
