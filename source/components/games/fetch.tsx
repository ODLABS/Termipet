import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

interface FetchProps {
	onComplete: (score: number) => void;
	petName: string;
}

const W = 40;
const H = 14;
const ROUNDS = 5;

type Phase = 'aiming' | 'power' | 'flying' | 'catching' | 'result';

export function FetchGame({onComplete, petName}: FetchProps) {
	const [phase, setPhase] = useState<Phase>('aiming');
	const [angle, setAngle] = useState(45);
	const [power, setPower] = useState(50);
	const [powerDir, setPowerDir] = useState(1);
	const [ballX, setBallX] = useState(2);
	const [ballY, setBallY] = useState(H - 2);
	const [ballVx, setBallVx] = useState(0);
	const [ballVy, setBallVy] = useState(0);
	const [petX, setPetX] = useState(0);
	const [petRunning, setPetRunning] = useState(false);
	const [landX, setLandX] = useState(0);
	const [score, setScore] = useState(0);
	const [round, setRound] = useState(1);
	const [roundScore, setRoundScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);

	// Angle oscillation
	useEffect(() => {
		if (phase !== 'aiming') return undefined;
		const timer = setInterval(() => {
			setAngle(prev => {
				let next = prev + 2;
				if (next > 80) next = 10;
				return next;
			});
		}, 100);
		return () => clearInterval(timer);
	}, [phase]);

	// Power oscillation
	useEffect(() => {
		if (phase !== 'power') return undefined;
		const timer = setInterval(() => {
			setPower(prev => {
				let next = prev + powerDir * 3;
				if (next >= 100) {
					setPowerDir(-1);
					next = 100;
				}
				if (next <= 10) {
					setPowerDir(1);
					next = 10;
				}
				return next;
			});
		}, 50);
		return () => clearInterval(timer);
	}, [phase, powerDir]);

	// Ball physics
	useEffect(() => {
		if (phase !== 'flying') return undefined;
		const timer = setInterval(() => {
			setBallX(x => x + ballVx);
			setBallY(y => {
				const ny = y + ballVy;
				setBallVy(v => v + 0.3); // gravity
				if (ny >= H - 2) {
					// Landed
					setLandX(Math.round(ballX));
					setPhase('catching');
					setPetRunning(true);
					return H - 2;
				}
				return ny;
			});
		}, 60);
		return () => clearInterval(timer);
	}, [phase, ballVx, ballVy, ballX]);

	// Pet running to catch
	useEffect(() => {
		if (phase !== 'catching') return undefined;
		setPetX(2); // start from left
		const timer = setInterval(() => {
			setPetX(prev => {
				const target = landX;
				if (Math.abs(prev - target) <= 2) {
					// Caught!
					const distance = Math.abs(landX - 2);
					const accuracy = Math.max(0, 100 - Math.abs(distance - 20) * 3);
					const pts = Math.floor(accuracy / 10) * 10;
					setRoundScore(pts);
					setScore(s => s + pts);
					setPhase('result');
					setPetRunning(false);
					return target;
				}
				return prev + (target > prev ? 2 : -2);
			});
		}, 80);
		return () => clearInterval(timer);
	}, [phase, landX]);

	// End of result phase
	useEffect(() => {
		if (phase !== 'result') return undefined;
		const timer = setTimeout(() => {
			if (round >= ROUNDS) {
				setGameOver(true);
			} else {
				setRound(r => r + 1);
				setPhase('aiming');
				setBallX(2);
				setBallY(H - 2);
				setAngle(45);
				setPower(50);
				setPowerDir(1);
			}
		}, 2000);
		return () => clearTimeout(timer);
	}, [phase, round]);

	useEffect(() => {
		if (gameOver) {
			const timer = setTimeout(() => onComplete(score), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, onComplete]);

	useInput((input) => {
		if (gameOver) return;
		if (input === ' ') {
			if (phase === 'aiming') {
				setPhase('power');
			} else if (phase === 'power') {
				// Launch!
				const rad = (angle * Math.PI) / 180;
				const speed = power / 15;
				setBallVx(Math.cos(rad) * speed);
				setBallVy(-Math.sin(rad) * speed);
				setPhase('flying');
			}
		}
	});

	// Render
	const grid: string[][] = Array.from({length: H}, () => Array(W).fill(' '));
	const gridColors: string[][] = Array.from({length: H}, () => Array(W).fill(''));

	// Ground
	for (let x = 0; x < W; x++) {
		grid[H - 1]![x] = '▓';
		gridColors[H - 1]![x] = 'green';
	}

	// Distance markers
	for (let x = 5; x < W; x += 5) {
		grid[H - 1]![x] = '|';
		gridColors[H - 1]![x] = 'white';
	}

	// Thrower
	grid[H - 2]![1] = '♦';
	gridColors[H - 2]![1] = 'cyan';

	// Ball
	const bx = Math.round(ballX);
	const by = Math.round(ballY);
	if (bx >= 0 && bx < W && by >= 0 && by < H) {
		grid[by]![bx] = 'o';
		gridColors[by]![bx] = 'yellow';
	}

	// Pet (during catching or result)
	if (phase === 'catching' || phase === 'result') {
		const px = Math.round(petX);
		if (px >= 0 && px < W) {
			grid[H - 2]![px] = '@';
			gridColors[H - 2]![px] = 'magenta';
		}
	}

	// Landing spot
	if ((phase === 'catching' || phase === 'result') && landX >= 0 && landX < W) {
		grid[H - 1]![landX] = 'X';
		gridColors[H - 1]![landX] = 'red';
	}

	// Power/angle indicator
	const powerBar = '█'.repeat(Math.floor(power / 5)) + '░'.repeat(20 - Math.floor(power / 5));
	const angleIndicator = '─'.repeat(Math.floor(angle / 10));

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="cyan">FETCH!</Text>
				<Text> | </Text>
				<Text>Round: <Text bold color="yellow">{round}/{ROUNDS}</Text></Text>
				<Text> | Score: <Text bold color="yellow">{score}</Text></Text>
			</Box>

			{phase === 'aiming' && (
				<Box marginBottom={1}>
					<Text color="white">Angle: <Text bold color="cyan">{angle}°</Text> {angleIndicator}↗</Text>
					<Text> | Press SPACE to set angle</Text>
				</Box>
			)}
			{phase === 'power' && (
				<Box marginBottom={1}>
					<Text color="white">Power: [<Text color={power > 70 ? 'red' : power > 40 ? 'yellow' : 'green'}>{powerBar}</Text>] {power}%</Text>
					<Text> | Press SPACE to throw!</Text>
				</Box>
			)}
			{phase === 'result' && (
				<Box marginBottom={1}>
					<Text bold color={roundScore >= 70 ? 'green' : roundScore >= 40 ? 'yellow' : 'red'}>
						{roundScore >= 70 ? 'Great catch!' : roundScore >= 40 ? 'Nice try!' : 'Missed!'} +{roundScore} pts
					</Text>
				</Box>
			)}

			<Box flexDirection="column" borderStyle="round" borderColor="cyan">
				{grid.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={gridColors[ri]![ci] || undefined}>{cell}</Text>
						))}
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} played fetch! Total score: {score}</Text>
				) : phase === 'flying' ? (
					<Text color="yellow">Ball is flying...</Text>
				) : phase === 'catching' ? (
					<Text color="magenta">{petName} is chasing the ball!</Text>
				) : (
					<Text dimColor>SPACE to set angle, then power | {ROUNDS - round} rounds left</Text>
				)}
			</Box>
		</Box>
	);
}
