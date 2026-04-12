import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface HideAndSeekProps {
	onComplete: (score: number) => void;
	petName: string;
}

const GRID_W = 8;
const GRID_H = 6;
const GAME_DURATION = 45_000;
const ROUNDS = 5;

const HIDING_SPOTS = ['🌳', '📦', '🏠', '🪨', '🌿', '🗑', '🚗', '🎪'];
const SPOT_CHARS = ['T', 'B', 'H', 'R', 'G', 'D', 'C', 'W'];

function randomHidePos(): {x: number; y: number} {
	return {
		x: Math.floor(Math.random() * GRID_W),
		y: Math.floor(Math.random() * GRID_H),
	};
}

export function HideAndSeekGame({onComplete, petName}: HideAndSeekProps) {
	const [cursorX, setCursorX] = useState(0);
	const [cursorY, setCursorY] = useState(0);
	const [hidePos, setHidePos] = useState(randomHidePos);
	const [revealed, setRevealed] = useState<Set<string>>(new Set());
	const [round, setRound] = useState(1);
	const [score, setScore] = useState(0);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);
	const [found, setFound] = useState(false);
	const [guesses, setGuesses] = useState(0);
	const [hint, setHint] = useState('');

	const scoreRef = useRef(score);
	useEffect(() => { scoreRef.current = score; }, [score]);

	// Randomize grid content per position
	const [spotGrid] = useState(() => {
		return Array.from({length: GRID_H}, () =>
			Array.from({length: GRID_W}, () => Math.floor(Math.random() * SPOT_CHARS.length))
		);
	});

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

	const getDistance = (x1: number, y1: number, x2: number, y2: number): string => {
		const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
		if (dist === 0) return 'HERE!';
		if (dist <= 2) return 'VERY HOT!';
		if (dist <= 4) return 'Warm...';
		if (dist <= 6) return 'Cool...';
		return 'Cold...';
	};

	const getHintColor = (dist: string): string => {
		if (dist === 'HERE!') return 'green';
		if (dist === 'VERY HOT!') return 'red';
		if (dist === 'Warm...') return 'yellow';
		return 'blue';
	};

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}

		if (key.upArrow) setCursorY(y => Math.max(0, y - 1));
		if (key.downArrow) setCursorY(y => Math.min(GRID_H - 1, y + 1));
		if (key.leftArrow) setCursorX(x => Math.max(0, x - 1));
		if (key.rightArrow) setCursorX(x => Math.min(GRID_W - 1, x + 1));

		if (input === ' ' || key.return) {
			if (found) return;
			setGuesses(g => g + 1);
			const key2 = `${cursorX},${cursorY}`;
			setRevealed(prev => new Set([...prev, key2]));

			if (cursorX === hidePos.x && cursorY === hidePos.y) {
				// Found!
				const timeBonus = timeLeft * 2;
				const guessBonus = Math.max(0, 50 - guesses * 5);
				const pts = 50 + timeBonus + guessBonus;
				setScore(s => s + pts);
				setFound(true);
				setHint(`Found ${petName}! +${pts} pts`);

				setTimeout(() => {
					if (round >= ROUNDS) {
						setGameOver(true);
					} else {
						setRound(r => r + 1);
						setHidePos(randomHidePos());
						setRevealed(new Set());
						setFound(false);
						setGuesses(0);
						setHint('');
					}
				}, 1500);
			} else {
				const dist = getDistance(cursorX, cursorY, hidePos.x, hidePos.y);
				setHint(dist);
			}
		}
	});

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="magenta">HIDE & SEEK</Text>
				<Text> | </Text>
				<Text>Round: <Text bold color="yellow">{round}/{ROUNDS}</Text></Text>
				<Text> | Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Guesses: <Text bold>{guesses}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>

			{hint && (
				<Box marginBottom={1}>
					<Text bold color={getHintColor(hint)}>{hint}</Text>
				</Box>
			)}

			<Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1}>
				{Array.from({length: GRID_H}, (_, ri) => (
					<Box key={ri} gap={1}>
						{Array.from({length: GRID_W}, (_, ci) => {
							const isRevealed = revealed.has(`${ci},${ri}`);
							const isCursor = ci === cursorX && ri === cursorY;
							const isHidden = ci === hidePos.x && ri === hidePos.y;
							const spotIdx = spotGrid[ri]![ci]!;
							const spotChar = SPOT_CHARS[spotIdx]!;

							let display: string;
							let color: string;

							if (isHidden && (found || isRevealed)) {
								display = ' @ ';
								color = 'green';
							} else if (isRevealed) {
								const dist = Math.abs(ci - hidePos.x) + Math.abs(ri - hidePos.y);
								display = ` ${dist} `;
								color = dist <= 2 ? 'red' : dist <= 4 ? 'yellow' : 'blue';
							} else {
								display = `[${spotChar}]`;
								color = 'gray';
							}

							return (
								<Text key={ci} color={color} inverse={isCursor} bold={isCursor || (isHidden && found)}>
									{display}
								</Text>
							);
						})}
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} was found {round > 1 ? round - 1 : round} times! Score: {score}</Text>
				) : (
					<Text dimColor>Arrows: move | Space: search | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
