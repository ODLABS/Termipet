import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';

interface TetrisProps {
	onComplete: (score: number) => void;
	petName: string;
}

const BOARD_W = 10;
const BOARD_H = 18;
const GAME_DURATION = 60_000;

type Board = number[][];
type Piece = number[][];

const PIECES: Piece[] = [
	[[1, 1, 1, 1]],                       // I
	[[1, 1], [1, 1]],                     // O
	[[0, 1, 0], [1, 1, 1]],              // T
	[[1, 0, 0], [1, 1, 1]],              // L
	[[0, 0, 1], [1, 1, 1]],              // J
	[[0, 1, 1], [1, 1, 0]],              // S
	[[1, 1, 0], [0, 1, 1]],              // Z
];

const PIECE_COLORS = ['cyan', 'yellow', 'magenta', 'white', 'blue', 'green', 'red'] as const;

function createBoard(): Board {
	return Array.from({length: BOARD_H}, () => Array(BOARD_W).fill(0));
}

function rotatePiece(piece: Piece): Piece {
	const rows = piece.length;
	const cols = piece[0]!.length;
	const rotated: Piece = Array.from({length: cols}, () => Array(rows).fill(0));
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			rotated[c]![rows - 1 - r] = piece[r]![c]!;
		}
	}
	return rotated;
}

function canPlace(board: Board, piece: Piece, px: number, py: number): boolean {
	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r]!.length; c++) {
			if (!piece[r]![c]) continue;
			const nx = px + c;
			const ny = py + r;
			if (nx < 0 || nx >= BOARD_W || ny >= BOARD_H) return false;
			if (ny >= 0 && board[ny]![nx]) return false;
		}
	}
	return true;
}

function placePiece(board: Board, piece: Piece, px: number, py: number, colorIdx: number): Board {
	const newBoard = board.map(row => [...row]);
	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r]!.length; c++) {
			if (piece[r]![c] && py + r >= 0) {
				newBoard[py + r]![px + c] = colorIdx + 1;
			}
		}
	}
	return newBoard;
}

function clearLines(board: Board): {board: Board; cleared: number} {
	const remaining = board.filter(row => row.some(cell => cell === 0));
	const cleared = BOARD_H - remaining.length;
	const newRows = Array.from({length: cleared}, () => Array(BOARD_W).fill(0));
	return {board: [...newRows, ...remaining], cleared};
}

function randomPieceIdx(): number {
	return Math.floor(Math.random() * PIECES.length);
}

const CELL_COLORS: Record<number, string> = {
	0: 'gray',
	1: 'cyan',
	2: 'yellow',
	3: 'magenta',
	4: 'white',
	5: 'blue',
	6: 'green',
	7: 'red',
};

export function TetrisGame({onComplete, petName}: TetrisProps) {
	const [board, setBoard] = useState<Board>(createBoard);
	const [pieceIdx, setPieceIdx] = useState(randomPieceIdx);
	const [piece, setPiece] = useState<Piece>(() => PIECES[pieceIdx]!);
	const [px, setPx] = useState(() => Math.floor((BOARD_W - PIECES[pieceIdx]!![0]!.length) / 2));
	const [py, setPy] = useState(-1);
	const [score, setScore] = useState(0);
	const [lines, setLines] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

	const spawnPiece = useCallback(() => {
		const idx = randomPieceIdx();
		const newPiece = PIECES[idx]!;
		const startX = Math.floor((BOARD_W - newPiece[0]!.length) / 2);
		setPieceIdx(idx);
		setPiece(newPiece);
		setPx(startX);
		setPy(-1);
		return {idx, piece: newPiece, x: startX, y: -1};
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

	// Gravity
	useEffect(() => {
		if (gameOver) return undefined;
		const speed = Math.max(100, 500 - lines * 20);
		const timer = setInterval(() => {
			setPy(prevY => {
				const newY = prevY + 1;
				if (canPlace(board, piece, px, newY)) {
					return newY;
				}
				// Lock piece
				const newBoard = placePiece(board, piece, px, prevY, pieceIdx);
				const {board: clearedBoard, cleared} = clearLines(newBoard);
				const linePoints = [0, 100, 300, 500, 800];
				setScore(s => s + (linePoints[cleared] ?? 0));
				setLines(l => l + cleared);
				setBoard(clearedBoard);
				const spawned = spawnPiece();
				if (!canPlace(clearedBoard, spawned.piece, spawned.x, 0)) {
					setGameOver(true);
				}
				return prevY;
			});
		}, speed);
		return () => clearInterval(timer);
	}, [board, piece, px, pieceIdx, lines, gameOver, spawnPiece]);

	// End game callback
	useEffect(() => {
		if (gameOver) {
			const timer = setTimeout(() => onComplete(score), 1500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [gameOver, score, onComplete]);

	useInput((input, key) => {
		if (gameOver) return;
		if (input.toLowerCase() === 'q' || key.escape) {
			setGameOver(true);
		} else if (key.leftArrow && canPlace(board, piece, px - 1, py)) {
			setPx(p => p - 1);
		} else if (key.rightArrow && canPlace(board, piece, px + 1, py)) {
			setPx(p => p + 1);
		} else if (key.downArrow && canPlace(board, piece, px, py + 1)) {
			setPy(p => p + 1);
		} else if (key.upArrow || input === 'r') {
			const rotated = rotatePiece(piece);
			if (canPlace(board, rotated, px, py)) {
				setPiece(rotated);
			}
		} else if (input === ' ') {
			// Hard drop
			let dropY = py;
			while (canPlace(board, piece, px, dropY + 1)) dropY++;
			const newBoard = placePiece(board, piece, px, dropY, pieceIdx);
			const {board: clearedBoard, cleared} = clearLines(newBoard);
			const linePoints = [0, 100, 300, 500, 800];
			setScore(s => s + (linePoints[cleared] ?? 0) + (dropY - py) * 2);
			setLines(l => l + cleared);
			setBoard(clearedBoard);
			const spawned = spawnPiece();
			if (!canPlace(clearedBoard, spawned.piece, spawned.x, 0)) {
				setGameOver(true);
			}
		}
	});

	// Render
	const displayBoard = board.map(row => [...row]);
	// Draw current piece on display board
	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r]!.length; c++) {
			if (piece[r]![c] && py + r >= 0 && py + r < BOARD_H && px + c >= 0 && px + c < BOARD_W) {
				displayBoard[py + r]![px + c] = pieceIdx + 1;
			}
		}
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="cyan">TETRIS</Text>
				<Text> | </Text>
				<Text>Score: <Text bold color="yellow">{score}</Text></Text>
				<Text> | Lines: <Text bold color="green">{lines}</Text></Text>
				<Text> | Time: <Text bold color={timeLeft <= 10 ? 'red' : 'white'}>{timeLeft}s</Text></Text>
			</Box>
			<Box flexDirection="column" borderStyle="round" borderColor="cyan">
				{displayBoard.map((row, ri) => (
					<Box key={ri}>
						{row.map((cell, ci) => (
							<Text key={ci} color={CELL_COLORS[cell] ?? 'gray'}>
								{cell ? '[]' : ' .'}
							</Text>
						))}
					</Box>
				))}
			</Box>
			<Box marginTop={1}>
				{gameOver ? (
					<Text bold color="red">GAME OVER! {petName} scored {score}!</Text>
				) : (
					<Text dimColor>←→ Move  ↑ Rotate  ↓ Soft drop  Space Hard drop  Q/Esc Quit</Text>
				)}
			</Box>
		</Box>
	);
}
