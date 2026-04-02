import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';

interface TypingRaceProps {
	onComplete: (score: number) => void;
	petName: string;
}

const GAME_DURATION = 60_000;

const WORDS = [
	'cat', 'dog', 'fish', 'bird', 'run', 'jump', 'play', 'feed', 'pet', 'love',
	'happy', 'fast', 'code', 'type', 'game', 'ball', 'bone', 'food', 'star', 'moon',
	'tree', 'fire', 'rain', 'snow', 'wind', 'leaf', 'rock', 'wave', 'nest', 'paws',
	'tail', 'purr', 'bark', 'howl', 'swim', 'fly', 'sing', 'grow', 'glow', 'dash',
	'dragon', 'treat', 'fetch', 'train', 'sleep', 'clean', 'level', 'score', 'coin',
	'magic', 'spark', 'flame', 'frost', 'bloom', 'shine', 'quest', 'brave', 'swift',
];

function randomWord(): string {
	return WORDS[Math.floor(Math.random() * WORDS.length)]!;
}

export function TypingRaceGame({onComplete, petName}: TypingRaceProps) {
	const [currentWord, setCurrentWord] = useState(randomWord);
	const [typed, setTyped] = useState('');
	const [score, setScore] = useState(0);
	const [wordsCompleted, setWordsCompleted] = useState(0);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
	const [gameOver, setGameOver] = useState(false);
	const [streak, setStreak] = useState(0);
	const [maxWpm, setMaxWpm] = useState(0);
	const [recentWords, setRecentWords] = useState<{word: string; correct: boolean}[]>([]);
	const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

	useEffect(() => {
		if (gameOver) return undefined;
		const timer = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					setGameOver(true);
					return 0;
				}
				const elapsed = GAME_DURATION / 1000 - prev + 1;
				if (elapsed > 0) {
					const wpm = Math.round((wordsCompleted / elapsed) * 60);
					setMaxWpm(m => Math.max(m, wpm));
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [gameOver, wordsCompleted]);

	useEffect(() => {
		if (gameOver) {
			const finalScore = score + maxWpm * 2;
			const timer = setTimeout(() => onComplete(finalScore), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, maxWpm, onComplete]);

	useInput((input, key) => {
		if (gameOver) return;

		if (key.backspace || key.delete) {
			setTyped(t => t.slice(0, -1));
			return;
		}

		if (key.return) {
			if (typed.toLowerCase() === currentWord.toLowerCase()) {
				const streakBonus = streak >= 5 ? 5 : streak >= 3 ? 3 : 0;
				setScore(s => s + 10 + currentWord.length + streakBonus);
				setWordsCompleted(w => w + 1);
				setStreak(s => s + 1);
				setRecentWords(r => [...r.slice(-4), {word: currentWord, correct: true}]);
				setFlash('correct');
			} else {
				setStreak(0);
				setRecentWords(r => [...r.slice(-4), {word: currentWord, correct: false}]);
				setFlash('wrong');
			}
			setTimeout(() => setFlash(null), 300);
			setCurrentWord(randomWord());
			setTyped('');
			return;
		}

		if (input && input.length === 1 && !key.ctrl && !key.meta) {
			setTyped(t => t + input);
		}
	});

	const elapsed = GAME_DURATION / 1000 - timeLeft;
	const wpm = elapsed > 0 ? Math.round((wordsCompleted / elapsed) * 60) : 0;

	// Render the word with color-coded typed letters
	const renderWord = () => {
		const chars = currentWord.split('');
		return chars.map((c, i) => {
			let color = 'white';
			if (i < typed.length) {
				color = typed[i]!.toLowerCase() === c.toLowerCase() ? 'green' : 'red';
			}
			return <Text key={i} color={color} bold>{c}</Text>;
		});
	};

	const trackChars = '░'.repeat(30);
	const progress = Math.min(30, Math.floor((wordsCompleted / 20) * 30));
	const petPos = Math.min(29, progress);

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="yellow">TYPING RACE</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | WPM: <Text bold color="cyan">{wpm}</Text></Text>
				<Text> | Streak: <Text bold color={streak >= 3 ? 'green' : 'white'}>{streak}🔥</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>

			{/* Race track */}
			<Box>
				<Text color="gray">
					{trackChars.slice(0, petPos)}
				</Text>
				<Text color="green" bold>@</Text>
				<Text color="gray">
					{trackChars.slice(petPos + 1)}
				</Text>
				<Text color="yellow"> 🏁</Text>
			</Box>

			<Box
				marginY={1}
				paddingX={3}
				paddingY={1}
				borderStyle="round"
				borderColor={flash === 'correct' ? 'green' : flash === 'wrong' ? 'red' : 'white'}
				flexDirection="column"
				alignItems="center"
			>
				<Text dimColor>Type the word and press Enter:</Text>
				<Box marginY={1}>
					<Text bold>{renderWord()}</Text>
				</Box>
				<Box>
					<Text color="cyan">{'> '}</Text>
					<Text>{typed}</Text>
					<Text color="gray">_</Text>
				</Box>
			</Box>

			{/* Recent words */}
			<Box gap={1}>
				{recentWords.map((w, i) => (
					<Text key={i} color={w.correct ? 'green' : 'red'} strikethrough={!w.correct}>
						{w.word}
					</Text>
				))}
			</Box>

			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="green">{petName} typed {wordsCompleted} words! Score: {score + maxWpm * 2}</Text>
				) : (
					<Text dimColor>Words completed: {wordsCompleted} | Best WPM: {maxWpm}</Text>
				)}
			</Box>
		</Box>
	);
}
