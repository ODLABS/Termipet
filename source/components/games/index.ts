import React from 'react';
import {TetrisGame} from './tetris.js';
import {SnakeGame} from './snake.js';
import {PongGame} from './pong.js';
import {WhackAMoleGame} from './whack-a-mole.js';
import {SimonSaysGame} from './simon-says.js';
import {CatchGame} from './catch-game.js';
import {TypingRaceGame} from './typing-race.js';
import {MinesweeperGame} from './minesweeper.js';
import {Game2048} from './game-2048.js';
import {FroggerGame} from './frogger.js';
import {FetchGame} from './fetch.js';
import {HideAndSeekGame} from './hide-and-seek.js';
import {MazeRunnerGame} from './maze-runner.js';
import {BugCatcherGame} from './bug-catcher.js';

export interface GameInfo {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	component: React.ComponentType<{onComplete: (score: number) => void; petName: string}>;
	entryFee: number;
	winThreshold: number;
	payoutMultiplier: number;
}

export const GAMES: GameInfo[] = [
	{id: 'tetris', name: 'Tetris', description: 'Classic falling blocks — clear lines!', icon: '▦', color: 'cyan', component: TetrisGame, entryFee: 5, winThreshold: 100, payoutMultiplier: 2},
	{id: 'snake', name: 'Snake', description: 'Eat food, grow longer, avoid walls!', icon: '~', color: 'green', component: SnakeGame, entryFee: 5, winThreshold: 50, payoutMultiplier: 2},
	{id: 'pong', name: 'Pong', description: 'Paddle vs CPU — first to 5 wins!', icon: '|', color: 'yellow', component: PongGame, entryFee: 10, winThreshold: 300, payoutMultiplier: 3},
	{id: 'whack-a-mole', name: 'Whack-a-Mole', description: 'Smash moles as they pop up!', icon: '()', color: 'magenta', component: WhackAMoleGame, entryFee: 5, winThreshold: 100, payoutMultiplier: 2},
	{id: 'simon-says', name: 'Simon Says', description: 'Memory sequence — how far can you go?', icon: '◆', color: 'red', component: SimonSaysGame, entryFee: 10, winThreshold: 125, payoutMultiplier: 3},
	{id: 'catch', name: 'Catch', description: 'Catch falling food, dodge rocks!', icon: '\\/', color: 'cyan', component: CatchGame, entryFee: 5, winThreshold: 30, payoutMultiplier: 2},
	{id: 'typing-race', name: 'Typing Race', description: 'Type words as fast as you can!', icon: 'Aa', color: 'yellow', component: TypingRaceGame, entryFee: 5, winThreshold: 100, payoutMultiplier: 2},
	{id: 'minesweeper', name: 'Minesweeper', description: 'Reveal tiles, avoid mines!', icon: '**', color: 'red', component: MinesweeperGame, entryFee: 10, winThreshold: 500, payoutMultiplier: 5},
	{id: '2048', name: '2048', description: 'Merge tiles to reach 2048!', icon: '##', color: 'yellow', component: Game2048, entryFee: 10, winThreshold: 1000, payoutMultiplier: 3},
	{id: 'frogger', name: 'Frogger', description: 'Cross the road and river!', icon: '@>', color: 'green', component: FroggerGame, entryFee: 5, winThreshold: 150, payoutMultiplier: 2},
	{id: 'fetch', name: 'Fetch', description: 'Throw the ball — your pet catches it!', icon: 'o>', color: 'cyan', component: FetchGame, entryFee: 5, winThreshold: 150, payoutMultiplier: 2},
	{id: 'hide-seek', name: 'Hide & Seek', description: 'Find your pet before time runs out!', icon: '??', color: 'magenta', component: HideAndSeekGame, entryFee: 5, winThreshold: 50, payoutMultiplier: 2},
	{id: 'maze', name: 'Maze Runner', description: 'Navigate randomly generated mazes!', icon: '[]', color: 'green', component: MazeRunnerGame, entryFee: 10, winThreshold: 100, payoutMultiplier: 3},
	{id: 'bug-catcher', name: 'Bug Catcher', description: 'Catch ASCII bugs crawling around!', icon: '%%', color: 'greenBright', component: BugCatcherGame, entryFee: 5, winThreshold: 100, payoutMultiplier: 2},
];

export {TetrisGame, SnakeGame, PongGame, WhackAMoleGame, SimonSaysGame, CatchGame, TypingRaceGame, MinesweeperGame, Game2048, FroggerGame, FetchGame, HideAndSeekGame, MazeRunnerGame, BugCatcherGame};
