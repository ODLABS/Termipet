import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

interface SimonSaysProps {
	onComplete: (score: number) => void;
	petName: string;
}

const COLORS = ['R', 'G', 'B', 'Y'] as const;
const COLOR_NAMES: Record<string, string> = {R: 'Red', G: 'Green', B: 'Blue', Y: 'Yellow'};
const COLOR_DISPLAY: Record<string, string> = {R: 'red', G: 'green', B: 'blue', Y: 'yellow'};

type Phase = 'showing' | 'input' | 'success' | 'fail';

export function SimonSaysGame({onComplete, petName}: SimonSaysProps) {
	const [sequence, setSequence] = useState<string[]>([]);
	const [inputIdx, setInputIdx] = useState(0);
	const [phase, setPhase] = useState<Phase>('showing');
	const [showIdx, setShowIdx] = useState(-1);
	const [round, setRound] = useState(0);
	const [completedRounds, setCompletedRounds] = useState(0);
	const [activeColor, setActiveColor] = useState<string | null>(null);
	const [gameOver, setGameOver] = useState(false);
	const [flashColor, setFlashColor] = useState<string | null>(null);
	const [timeLeft, setTimeLeft] = useState(45);

	const completedRoundsRef = useRef(completedRounds);
	useEffect(() => { completedRoundsRef.current = completedRounds; }, [completedRounds]);

	// Start new round
	const startRound = useCallback((prevSeq: string[]) => {
		const newColor = COLORS[Math.floor(Math.random() * COLORS.length)]!;
		const newSeq = [...prevSeq, newColor];
		setSequence(newSeq);
		setInputIdx(0);
		setPhase('showing');
		setShowIdx(-1);
		setRound(r => r + 1);
		return newSeq;
	}, []);

	// Initial start
	useEffect(() => {
		const timer = setTimeout(() => {
			startRound([]);
		}, 1000);
		return () => clearTimeout(timer);
	}, []);

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

	// Show sequence animation
	useEffect(() => {
		if (phase !== 'showing') return undefined;
		const seq = sequence;
		let idx = 0;
		setShowIdx(-1);

		const showNext = () => {
			if (idx >= seq.length) {
				setShowIdx(-1);
				setActiveColor(null);
				setPhase('input');
				return;
			}
			setShowIdx(idx);
			setActiveColor(seq[idx]!);
			idx++;
			setTimeout(() => {
				setActiveColor(null);
				setTimeout(showNext, 300);
			}, 600);
		};

		const timer = setTimeout(showNext, 500);
		return () => clearTimeout(timer);
	}, [phase, sequence]);

	useEffect(() => {
		if (!gameOver) return undefined;
		const t = setTimeout(() => onComplete(completedRoundsRef.current * 25), 2000);
		return () => clearTimeout(t);
	}, [gameOver]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
			return;
		}
		if (phase !== 'input') return;
		const colorKey = input.toUpperCase();
		if (!COLORS.includes(colorKey as any)) return;

		setFlashColor(colorKey);
		setTimeout(() => setFlashColor(null), 200);

		if (colorKey === sequence[inputIdx]) {
			const nextIdx = inputIdx + 1;
			if (nextIdx >= sequence.length) {
				// Round complete!
				setCompletedRounds(round);
				setPhase('success');
				setTimeout(() => {
					startRound(sequence);
				}, 1000);
			} else {
				setInputIdx(nextIdx);
			}
		} else {
			setPhase('fail');
			setGameOver(true);
		}
	});

	const renderPad = (color: string) => {
		const isActive = activeColor === color || flashColor === color;
		const displayColor = COLOR_DISPLAY[color]!;
		const padArt = [
			'┌───────┐',
			'│       │',
			`│  [${color}]  │`,
			'│       │',
			'└───────┘',
		];
		return (
			<Box flexDirection="column" alignItems="center">
				{padArt.map((line, i) => (
					<Text key={i} color={isActive ? displayColor : 'gray'} bold={isActive}>
						{line}
					</Text>
				))}
				<Text color={displayColor} dimColor={!isActive}>{COLOR_NAMES[color]}</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="magenta">SIMON SAYS</Text>
				<Text> | </Text>
				<Text>Round: <Text bold color="yellow">{round}</Text></Text>
				<Text> | Sequence: <Text bold color="cyan">{sequence.length}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>

			<Box marginBottom={1}>
				{phase === 'showing' && <Text color="yellow" bold>Watch the sequence...</Text>}
				{phase === 'input' && (
					<Text color="green" bold>
						Your turn! ({inputIdx + 1}/{sequence.length})
					</Text>
				)}
				{phase === 'success' && <Text color="green" bold>Correct! Next round...</Text>}
				{phase === 'fail' && <Text color="red" bold>Wrong! Game Over!</Text>}
			</Box>

			<Box gap={1}>
				{renderPad('R')}
				{renderPad('G')}
			</Box>
			<Box gap={1}>
				{renderPad('B')}
				{renderPad('Y')}
			</Box>

			<Box marginTop={1}>
				<Text dimColor>
					Sequence: {sequence.map((c, i) => (
						<Text key={i} color={i < inputIdx ? 'green' : i === showIdx ? COLOR_DISPLAY[c] : 'gray'}>
							{c}{' '}
						</Text>
					))}
				</Text>
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="red">{petName} remembered {completedRounds} rounds! Score: {completedRounds * 25}</Text>
				) : (
					<Text dimColor>Press R/G/B/Y to repeat the sequence | Q/Esc: Quit</Text>
				)}
			</Box>
		</Box>
	);
}
