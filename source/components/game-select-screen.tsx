import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {GAMES, type GameInfo} from './games/index.js';

interface GameSelectScreenProps {
	onSelect: (game: GameInfo) => void;
	onBack: () => void;
	petName: string;
}

const GAMES_PER_PAGE = 8;

export function GameSelectScreen({onSelect, onBack, petName}: GameSelectScreenProps) {
	const [selectedIdx, setSelectedIdx] = useState(0);
	const [page, setPage] = useState(0);

	const totalPages = Math.ceil(GAMES.length / GAMES_PER_PAGE);
	const startIdx = page * GAMES_PER_PAGE;
	const pageGames = GAMES.slice(startIdx, startIdx + GAMES_PER_PAGE);

	useInput((input, key) => {
		if (key.escape || input.toLowerCase() === 'q') {
			onBack();
			return;
		}

		if (key.upArrow) {
			setSelectedIdx(i => {
				if (i <= 0) {
					if (page > 0) {
						setPage(p => p - 1);
						return GAMES_PER_PAGE - 1;
					}
					return 0;
				}
				return i - 1;
			});
		}

		if (key.downArrow) {
			setSelectedIdx(i => {
				if (i >= pageGames.length - 1) {
					if (page < totalPages - 1) {
						setPage(p => p + 1);
						return 0;
					}
					return i;
				}
				return i + 1;
			});
		}

		if (key.leftArrow && page > 0) {
			setPage(p => p - 1);
			setSelectedIdx(0);
		}

		if (key.rightArrow && page < totalPages - 1) {
			setPage(p => p + 1);
			setSelectedIdx(0);
		}

		if (key.return) {
			const game = pageGames[selectedIdx];
			if (game) onSelect(game);
		}
	});

	const selected = pageGames[selectedIdx];

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box
				borderStyle="double"
				borderColor="yellow"
				paddingX={2}
				paddingY={1}
				flexDirection="column"
				alignItems="center"
			>
				<Text bold color="yellow">
					{'  ___  _   _  _ ___ ___  '}
				</Text>
				<Text bold color="yellow">
					{' / __|| | | |/ |_ _| __| '}
				</Text>
				<Text bold color="yellow">
					{' \\__ \\| |_| | || || _|  '}
				</Text>
				<Text bold color="yellow">
					{' |___/ \\___/|_|___|___| '}
				</Text>
				<Text> </Text>
				<Text color="white">Choose a game for <Text bold color="cyan">{petName}</Text> to play!</Text>
				<Text dimColor>Page {page + 1}/{totalPages}</Text>
			</Box>

			<Box flexDirection="column" marginY={1} width={50}>
				{pageGames.map((game, idx) => {
					const isSelected = idx === selectedIdx;
					return (
						<Box key={game.id} paddingX={1}>
							<Text color={isSelected ? game.color : 'gray'} bold={isSelected}>
								{isSelected ? '> ' : '  '}
								<Text color={game.color}>{game.icon}</Text>
								{' '}
								{game.name}
								{isSelected ? ' <' : ''}
							</Text>
						</Box>
					);
				})}
			</Box>

			{selected && (
				<Box
					borderStyle="round"
					borderColor={selected.color}
					paddingX={2}
					paddingY={0}
					width={50}
				>
					<Box flexDirection="column">
						<Text color={selected.color} bold>{selected.name}</Text>
						<Text>{selected.description}</Text>
					</Box>
				</Box>
			)}

			<Box marginTop={1} gap={2}>
				<Text dimColor>↑↓ Select</Text>
				<Text dimColor>←→ Page</Text>
				<Text dimColor>Enter: Play</Text>
				<Text dimColor>Q/Esc: Back</Text>
			</Box>
		</Box>
	);
}
