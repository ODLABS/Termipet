import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import type {PetState, PetType, ActionType, ShopItem, Screen} from './types.js';
import {createNewPet, gameTick, performAction, checkStreak, applyItemEffect, revivePet} from './game-engine.js';
import {localCurrencyService} from './currency-service.js';
import {savePet, loadPet, deleteSave} from './persistence.js';
import {TICK_INTERVAL_MS} from './constants.js';
import {Header} from './components/header.js';
import {PetDisplay} from './components/pet-display.js';
import {StatBars} from './components/stat-bars.js';
import {ActionMenu} from './components/action-menu.js';
import {PetSelectScreen} from './components/pet-select-screen.js';
import {NameInputScreen} from './components/name-input-screen.js';
import {EggHatchScreen} from './components/egg-hatch-screen.js';
import {EvolutionScreen} from './components/evolution-screen.js';
import {DeathScreen} from './components/death-screen.js';
import {ShopScreen} from './components/shop-screen.js';
import {GameSelectScreen} from './components/game-select-screen.js';
import {GAMES, type GameInfo} from './components/games/index.js';

interface WelcomeScreenProps {
	onNew: () => void;
	onLoad: () => void;
	hasSave: boolean;
}

function WelcomeScreen({onNew, onLoad, hasSave}: WelcomeScreenProps) {
	useInput((input: string) => {
		if (input === '1' || input.toLowerCase() === 'n') {
			onNew();
		} else if ((input === '2' || input.toLowerCase() === 'l') && hasSave) {
			onLoad();
		}
	});

	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box
				borderStyle="double"
				borderColor="cyan"
				paddingX={3}
				paddingY={1}
				flexDirection="column"
				alignItems="center"
			>
				<Text bold color="cyan">
					{'  _____ _____ ____  __  __ ___ ____  _____ _____ ____  '}
				</Text>
				<Text bold color="cyan">
					{' |_   _| ____|  _ \\|  \\/  |_ _|  _ \\| ____|_   _/ ___| '}
				</Text>
				<Text bold color="cyan">
					{'   | | |  _| | |_) | |\\/| || || |_) |  _|   | | \\___ \\ '}
				</Text>
				<Text bold color="cyan">
					{'   | | | |___|  _ <| |  | || ||  __/| |___  | |  ___) |'}
				</Text>
				<Text bold color="cyan">
					{'   |_| |_____|_| \\_\\_|  |_|___|_|   |_____| |_| |____/ '}
				</Text>
				<Text> </Text>
				<Text color="white">A virtual pet that lives in your terminal.</Text>
				<Text color="white">Feed it. Grow it. Keep it alive.</Text>
				<Text> </Text>
				{hasSave ? (
					<>
						<Text>[<Text color="green" bold>1</Text>] New Pet</Text>
						<Text>[<Text color="cyan" bold>2</Text>] Continue</Text>
					</>
				) : (
					<Text>[<Text color="green" bold>1</Text>] Hatch Your First Pet!</Text>
				)}
			</Box>
		</Box>
	);
}

export function App() {
	const {exit} = useApp();
	const [pet, setPet] = useState<PetState | null>(null);
	const [screen, setScreen] = useState<Screen | 'welcome'>('welcome');
	const [selectedType, setSelectedType] = useState<PetType>('cat');
	const [hasSave, setHasSave] = useState(false);
	const [actionMessage, setActionMessage] = useState('');
	const [loaded, setLoaded] = useState(false);
	const [currentGame, setCurrentGame] = useState<GameInfo | null>(null);

	// Load save on startup
	useEffect(() => {
		const load = async () => {
			const saved = await loadPet();
			if (saved) {
				setHasSave(true);
			}

			setLoaded(true);
		};

		void load();
	}, []);

	// Game tick
	useEffect(() => {
		if (!pet || !pet.isAlive || screen !== 'main') return;

		const timer = setInterval(() => {
			setPet(prev => {
				if (!prev || !prev.isAlive) return prev;
				const result = gameTick(prev);

				if (result.evolved) {
					setScreen('evolving');
				}

				if (!result.state.isAlive) {
					setScreen('dead');
				}

				// Auto-save
				void savePet(result.state);
				return result.state;
			});
		}, TICK_INTERVAL_MS);

		return () => {
			clearInterval(timer);
		};
	}, [pet?.isAlive, screen]);

	const showMessage = useCallback((msg: string) => {
		setActionMessage(msg);
		setTimeout(() => {
			setActionMessage('');
		}, 2000);
	}, []);

	const handleNewGame = useCallback(() => {
		setScreen('pet-select');
	}, []);

	const handleLoadGame = useCallback(async () => {
		const saved = await loadPet();
		if (saved) {
			const withStreak = checkStreak(saved);
			const result = gameTick(withStreak);

			if (!result.state.isAlive) {
				setPet(result.state);
				setScreen('dead');
			} else {
				setPet(result.state);
				setScreen('main');
				void savePet(result.state);

				if (result.evolved) {
					setScreen('evolving');
				}
			}
		}
	}, []);

	const handleSelectPetType = useCallback((type: PetType) => {
		setSelectedType(type);
		setScreen('name-input');
	}, []);

	const handleNameSubmit = useCallback((name: string) => {
		const newPet = createNewPet(name, selectedType);
		const withStreak = checkStreak(newPet);
		setPet(withStreak);
		setScreen('egg-hatch');
		void savePet(withStreak);
	}, [selectedType]);

	const handleHatchDone = useCallback(() => {
		setPet(prev => {
			if (!prev) return prev;
			const result = gameTick(prev);
			return result.state;
		});
		setScreen('main');
	}, []);

	const handleEvolutionDone = useCallback(() => {
		setScreen('main');
	}, []);

	const handleAction = useCallback((action: ActionType) => {
		setPet(prev => {
			if (!prev || !prev.isAlive) return prev;

			if (prev.isSleeping && action !== 'sleep') {
				showMessage('Your pet is sleeping! Press S to wake up first.');
				return prev;
			}

			const newState = performAction(prev, action);
			void savePet(newState);

			const messages: Record<ActionType, string> = {
				feed: `Fed ${prev.name}! +${25} hunger`,
				play: `Played with ${prev.name}! +${20} happiness`,
				train: `Trained ${prev.name}! +XP`,
				clean: `Cleaned ${prev.name}! Sparkly clean!`,
				sleep: prev.isSleeping ? `${prev.name} woke up!` : `${prev.name} is going to sleep...`,
			};

			showMessage(messages[action]);
			return newState;
		});
	}, [showMessage]);

	const handleShopBuy = useCallback((item: ShopItem) => {
		setPet(prev => {
			if (!prev) return prev;

			const afterSpend = localCurrencyService.spend(prev, item.price, item.name);
			if (!afterSpend) {
				showMessage('Not enough coins!');
				return prev;
			}

			// Apply item effect
			let newState = applyItemEffect(afterSpend, item.effect);

			// Special: medicine cures sickness
			if (item.category === 'medicine') {
				newState = {...newState, isSick: false};
			}

			// Special: resurrection (handled in death screen, but also via shop)
			if (item.id === 'resurrection' && !prev.isAlive) {
				newState = revivePet(newState);
			}

			void savePet(newState);
			showMessage(`Bought ${item.name}!`);
			return newState;
		});
	}, [showMessage]);

	const handleRestart = useCallback(async () => {
		await deleteSave();
		setPet(null);
		setScreen('pet-select');
	}, []);

	const handleRevive = useCallback(() => {
		setPet(prev => {
			if (!prev) return prev;

			const afterSpend = localCurrencyService.spend(prev, 100, 'Phoenix Feather');
			if (!afterSpend) {
				showMessage('Not enough coins! Need 100.');
				return prev;
			}

			const revived = revivePet(afterSpend);
			void savePet(revived);
			setScreen('main');
			showMessage(`${prev.name} has been revived!`);
			return revived;
		});
	}, [showMessage]);

	const handleGameComplete = useCallback((gameScore: number) => {
		setPet(prev => {
			if (!prev) return prev;
			// Award coins and happiness based on score
			const coins = Math.max(1, Math.floor(gameScore / 10));
			const happinessBoost = Math.min(30, Math.floor(gameScore / 20));
			const xpGain = Math.max(1, Math.floor(gameScore / 15));
			const newState: PetState = {
				...prev,
				currency: prev.currency + coins,
				xp: prev.xp + xpGain,
				level: Math.floor((prev.xp + xpGain) / 50) + 1,
				stats: {
					...prev.stats,
					happiness: Math.min(100, prev.stats.happiness + happinessBoost),
					energy: Math.max(0, prev.stats.energy - 10),
					hunger: Math.max(0, prev.stats.hunger - 5),
				},
				transactions: [
					...prev.transactions.slice(-99),
					{amount: coins, reason: `Mini-game: ${currentGame?.name ?? 'Game'}`, timestamp: Date.now()},
				],
			};
			void savePet(newState);
			showMessage(`Game over! +${coins} coins, +${happinessBoost} happiness, +${xpGain} XP`);
			return newState;
		});
		setCurrentGame(null);
		setScreen('main');
	}, [currentGame, showMessage]);

	const handleQuit = useCallback(() => {
		if (pet) {
			void savePet(pet);
		}

		exit();
	}, [pet, exit]);

	if (!loaded) {
		return (
			<Box>
				<Text>Loading...</Text>
			</Box>
		);
	}

	switch (screen) {
		case 'welcome': {
			return <WelcomeScreen onNew={handleNewGame} onLoad={handleLoadGame} hasSave={hasSave} />;
		}

		case 'pet-select': {
			return <PetSelectScreen onSelect={handleSelectPetType} />;
		}

		case 'name-input': {
			return <NameInputScreen petType={selectedType} onSubmit={handleNameSubmit} />;
		}

		case 'egg-hatch': {
			if (!pet) return null;
			return <EggHatchScreen pet={pet} onDone={handleHatchDone} />;
		}

		case 'evolving': {
			if (!pet) return null;
			return <EvolutionScreen pet={pet} onDone={handleEvolutionDone} />;
		}

		case 'dead': {
			if (!pet) return null;
			return (
				<DeathScreen
					pet={pet}
					onRestart={handleRestart}
					onRevive={handleRevive}
					onQuit={handleQuit}
					canRevive={pet.currency >= 100}
				/>
			);
		}

		case 'shop': {
			if (!pet) return null;
			return <ShopScreen pet={pet} onBuy={handleShopBuy} onBack={() => {
				setScreen('main');
			}} />;
		}

		case 'game-select': {
			if (!pet) return null;
			return (
				<GameSelectScreen
					petName={pet.name}
					onSelect={(game) => {
						setCurrentGame(game);
						setScreen('playing');
					}}
					onBack={() => {
						setScreen('main');
					}}
				/>
			);
		}

		case 'playing': {
			if (!pet || !currentGame) return null;
			const GameComponent = currentGame.component;
			return <GameComponent onComplete={handleGameComplete} petName={pet.name} />;
		}

		case 'main': {
			if (!pet) return null;
			return (
				<Box flexDirection="column">
					<Header pet={pet} />
					<PetDisplay pet={pet} />
					<StatBars stats={pet.stats} />
					{actionMessage && (
						<Box paddingX={1} marginY={1}>
							<Text color="green" bold>{'>> '}{actionMessage}</Text>
						</Box>
					)}
					<ActionMenu
						onAction={handleAction}
						onShop={() => {
							setScreen('shop');
						}}
						onPlay={() => {
							if (pet.isSleeping) {
								showMessage('Wake up your pet first!');
								return;
							}
							setScreen('game-select');
						}}
						onQuit={handleQuit}
						isSleeping={pet.isSleeping}
					/>
				</Box>
			);
		}

		default: {
			return null;
		}
	}
}
