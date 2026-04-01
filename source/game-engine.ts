import type {PetState, PetStats, PetType, EvolutionStage, ActionType, PetMood} from './types.js';
import {
	DECAY_RATES,
	MAX_OFFLINE_DECAY_MINUTES,
	CRITICAL_THRESHOLD,
	HEALTH_DECAY_RATE,
	DEATH_THRESHOLD,
	EVOLUTION_THRESHOLDS,
	ACTION_EFFECTS,
	XP_REWARDS,
	CURRENCY_REWARDS,
	XP_PER_LEVEL,
	PET_TYPE_MODIFIERS,
	EVOLUTION_PATH,
} from './constants.js';
import {localCurrencyService} from './currency-service.js';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function createNewPet(name: string, type: PetType): PetState {
	const now = Date.now();
	return {
		name,
		type,
		stage: 'egg',
		stats: {
			hunger: 80,
			happiness: 80,
			energy: 100,
			cleanliness: 100,
			health: 100,
		},
		xp: 0,
		level: 1,
		age: 0,
		currency: 20,
		streak: 0,
		lastPlayedDate: '',
		lastTickTime: now,
		birthTime: now,
		isAlive: true,
		isDirty: false,
		isSick: false,
		isSleeping: false,
		inventory: [],
		deathCount: 0,
		totalPlaytime: 0,
		evolutionPath: 'good',
		transactions: [],
	};
}

export function getPetMood(state: PetState): PetMood {
	if (!state.isAlive) return 'dead';
	if (state.isSleeping) return 'sleeping';
	if (state.isSick) return 'sick';
	if (state.stats.hunger < 25) return 'hungry';
	if (state.stats.happiness > 60) return 'happy';
	return 'idle';
}

function getStageForAge(ageMinutes: number): EvolutionStage {
	if (ageMinutes >= EVOLUTION_THRESHOLDS.elder) return 'elder';
	if (ageMinutes >= EVOLUTION_THRESHOLDS.adult) return 'adult';
	if (ageMinutes >= EVOLUTION_THRESHOLDS.teen) return 'teen';
	if (ageMinutes >= EVOLUTION_THRESHOLDS.child) return 'child';
	if (ageMinutes >= EVOLUTION_THRESHOLDS.baby) return 'baby';
	return 'egg';
}

function calculateEvolutionPath(stats: PetStats): 'good' | 'neutral' | 'bad' {
	const average = (stats.hunger + stats.happiness + stats.energy + stats.cleanliness + stats.health) / 5;
	if (average >= EVOLUTION_PATH.good) return 'good';
	if (average >= EVOLUTION_PATH.neutral) return 'neutral';
	return 'bad';
}

export function gameTick(state: PetState): {state: PetState; evolved: boolean} {
	if (!state.isAlive) return {state, evolved: false};

	const now = Date.now();
	const elapsedMs = now - state.lastTickTime;
	const elapsedMinutes = Math.min(elapsedMs / 60_000, MAX_OFFLINE_DECAY_MINUTES);

	let {stats} = state;
	const mods = PET_TYPE_MODIFIERS[state.type];

	// Decay stats over time (unless sleeping)
	if (!state.isSleeping) {
		stats = {
			...stats,
			hunger: clamp(stats.hunger - (DECAY_RATES.hunger * mods.hungerDecay * elapsedMinutes), 0, 100),
			happiness: clamp(stats.happiness - (DECAY_RATES.happiness * mods.happinessDecay * elapsedMinutes), 0, 100),
			energy: clamp(stats.energy - (DECAY_RATES.energy * mods.energyDecay * elapsedMinutes), 0, 100),
			cleanliness: clamp(stats.cleanliness - (DECAY_RATES.cleanliness * elapsedMinutes), 0, 100),
		};
	} else {
		// While sleeping, restore energy but drain hunger
		stats = {
			...stats,
			energy: clamp(stats.energy + (2 * elapsedMinutes), 0, 100),
			hunger: clamp(stats.hunger - (DECAY_RATES.hunger * 0.3 * elapsedMinutes), 0, 100),
		};
	}

	// Count critical stats
	const criticalCount = [
		stats.hunger < CRITICAL_THRESHOLD,
		stats.happiness < CRITICAL_THRESHOLD,
		stats.cleanliness < CRITICAL_THRESHOLD,
	].filter(Boolean).length;

	// Health decay when stats are critical
	if (criticalCount > 0) {
		stats = {
			...stats,
			health: clamp(stats.health - (HEALTH_DECAY_RATE * criticalCount * elapsedMinutes), 0, 100),
		};
	} else if (stats.health < 100) {
		// Slowly recover health when all stats are OK
		stats = {
			...stats,
			health: clamp(stats.health + (0.3 * elapsedMinutes), 0, 100),
		};
	}

	// Sickness from low cleanliness
	const isSick = state.isSick || stats.cleanliness < 10;
	const isDirty = stats.cleanliness < 30;

	// Check for death
	const isAlive = stats.health > DEATH_THRESHOLD;

	// Age in minutes
	const ageMinutes = (now - state.birthTime) / 60_000;

	// Check evolution
	const newStage = getStageForAge(ageMinutes);
	const evolved = newStage !== state.stage;

	// Evolution path
	const evolutionPath = calculateEvolutionPath(stats);

	// Level up from XP
	const level = Math.floor(state.xp / XP_PER_LEVEL) + 1;

	let newState: PetState = {
		...state,
		stats,
		stage: newStage,
		age: ageMinutes,
		level,
		isAlive,
		isDirty,
		isSick,
		evolutionPath,
		lastTickTime: now,
		totalPlaytime: state.totalPlaytime + elapsedMs / 1000,
	};

	// Award evolution bonus
	if (evolved && isAlive) {
		newState = localCurrencyService.earn(newState, CURRENCY_REWARDS.evolution, `Evolved to ${newStage}`);
	}

	return {state: newState, evolved};
}

export function performAction(state: PetState, action: ActionType): PetState {
	if (!state.isAlive) return state;

	// Can't do anything while sleeping (except being woken - handled in UI)
	if (state.isSleeping && action !== 'sleep') return state;

	const effects = ACTION_EFFECTS[action];
	const newStats = {...state.stats};

	for (const [key, value] of Object.entries(effects)) {
		const statKey = key as keyof PetStats;
		if (statKey in newStats) {
			newStats[statKey] = clamp(newStats[statKey] + value, 0, 100);
		}
	}

	// Handle special action effects
	let newState: PetState = {
		...state,
		stats: newStats,
	};

	switch (action) {
		case 'clean': {
			newState.isDirty = false;
			newState.isSick = false;
			newState.stats.cleanliness = clamp(newState.stats.cleanliness + 30, 0, 100);
			break;
		}

		case 'sleep': {
			if (state.isSleeping) {
				// Wake up
				newState.isSleeping = false;
			} else {
				newState.isSleeping = true;
			}

			break;
		}

		default:
			break;
	}

	// XP and currency
	const mods = PET_TYPE_MODIFIERS[state.type];
	const xpGain = Math.round(XP_REWARDS[action] * mods.xpMultiplier);
	newState.xp += xpGain;
	newState.level = Math.floor(newState.xp / XP_PER_LEVEL) + 1;

	const currencyGain = CURRENCY_REWARDS[action];
	if (currencyGain > 0) {
		newState = localCurrencyService.earn(newState, currencyGain, action);
	}

	return newState;
}

export function checkStreak(state: PetState): PetState {
	const today = new Date().toISOString().split('T')[0]!;

	if (state.lastPlayedDate === today) {
		return state;
	}

	let newState = {...state};

	if (state.lastPlayedDate) {
		const lastDate = new Date(state.lastPlayedDate);
		const todayDate = new Date(today);
		const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 1) {
			newState.streak += 1;
		} else {
			newState.streak = 1;
		}
	} else {
		newState.streak = 1;
	}

	newState.lastPlayedDate = today;

	// Daily check-in reward
	newState = localCurrencyService.earn(newState, CURRENCY_REWARDS.dailyCheckin, 'Daily check-in');

	// Streak bonuses
	if (newState.streak === 7) {
		newState = localCurrencyService.earn(newState, CURRENCY_REWARDS.streak7, '7-day streak bonus');
	} else if (newState.streak === 30) {
		newState = localCurrencyService.earn(newState, CURRENCY_REWARDS.streak30, '30-day streak bonus');
	}

	return newState;
}

export function applyItemEffect(state: PetState, effect: Partial<PetStats>): PetState {
	const newStats = {...state.stats};
	for (const [key, value] of Object.entries(effect)) {
		const statKey = key as keyof PetStats;
		if (statKey in newStats && typeof value === 'number') {
			newStats[statKey] = clamp(newStats[statKey] + value, 0, 100);
		}
	}

	return {
		...state,
		stats: newStats,
		isSick: state.isSick && newStats.health > 30 ? false : state.isSick,
	};
}

export function revivePet(state: PetState): PetState {
	return {
		...state,
		isAlive: true,
		stats: {
			hunger: 50,
			happiness: 50,
			energy: 50,
			cleanliness: 50,
			health: 50,
		},
		isSick: false,
		isDirty: false,
		isSleeping: false,
		deathCount: state.deathCount + 1,
		lastTickTime: Date.now(),
	};
}

export function getTimeUntilEvolution(state: PetState): string {
	const currentStageIndex = (['egg', 'baby', 'child', 'teen', 'adult', 'elder'] as EvolutionStage[]).indexOf(state.stage);
	const stages = Object.entries(EVOLUTION_THRESHOLDS);

	if (currentStageIndex >= stages.length - 1) return 'Max stage';

	const nextThreshold = stages[currentStageIndex + 1]![1];
	const minutesLeft = Math.max(0, nextThreshold - state.age);

	if (minutesLeft < 1) return 'Soon!';
	if (minutesLeft < 60) return `${Math.ceil(minutesLeft)}m`;
	return `${Math.floor(minutesLeft / 60)}h ${Math.ceil(minutesLeft % 60)}m`;
}

export function formatAge(ageMinutes: number): string {
	if (ageMinutes < 1) return '<1m';
	if (ageMinutes < 60) return `${Math.floor(ageMinutes)}m`;
	const hours = Math.floor(ageMinutes / 60);
	const mins = Math.floor(ageMinutes % 60);
	if (hours < 24) return `${hours}h ${mins}m`;
	const days = Math.floor(hours / 24);
	return `${days}d ${hours % 24}h`;
}
