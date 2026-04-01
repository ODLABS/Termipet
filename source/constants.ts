export const TICK_INTERVAL_MS = 5000;
export const ANIMATION_INTERVAL_MS = 600;

// Stat decay per minute
export const DECAY_RATES = {
	hunger: 0.8,
	happiness: 0.5,
	energy: 0.3,
	cleanliness: 0.6,
};

// Max offline decay in minutes (cap so pets don't always die overnight)
export const MAX_OFFLINE_DECAY_MINUTES = 30;

// Critical threshold - health starts decaying below this
export const CRITICAL_THRESHOLD = 15;

// Health decay per minute when stats are critical
export const HEALTH_DECAY_RATE = 1.5;

// Death threshold
export const DEATH_THRESHOLD = 0;

// Evolution thresholds in minutes of age
export const EVOLUTION_THRESHOLDS = {
	egg: 0,
	baby: 1,
	child: 5,
	teen: 15,
	adult: 30,
	elder: 60,
};

// Action effects
export const ACTION_EFFECTS = {
	feed: {hunger: 25, energy: -5, happiness: 5},
	play: {happiness: 20, energy: -15, hunger: -5},
	train: {happiness: -5, energy: -20, hunger: -10},
	clean: {happiness: 5, energy: -5},
	sleep: {energy: 40, happiness: 5, hunger: -10},
} as const;

// XP rewards per action
export const XP_REWARDS = {
	feed: 2,
	play: 5,
	train: 10,
	clean: 3,
	sleep: 1,
};

// Currency rewards
export const CURRENCY_REWARDS = {
	feed: 2,
	play: 3,
	train: 5,
	clean: 1,
	sleep: 0,
	dailyCheckin: 5,
	evolution: 50,
	streak7: 25,
	streak30: 100,
};

// XP per level
export const XP_PER_LEVEL = 50;

// Pet type modifiers
export const PET_TYPE_MODIFIERS = {
	cat: {hungerDecay: 0.8, happinessDecay: 1.3, xpMultiplier: 1.0, energyDecay: 0.7},
	dog: {hungerDecay: 1.0, happinessDecay: 0.7, xpMultiplier: 1.0, energyDecay: 1.2},
	dragon: {hungerDecay: 1.5, happinessDecay: 1.0, xpMultiplier: 1.5, energyDecay: 1.0},
	blob: {hungerDecay: 0.6, happinessDecay: 0.6, xpMultiplier: 0.8, energyDecay: 0.5},
} as const;

// Evolution path thresholds (average stats over time)
export const EVOLUTION_PATH = {
	good: 60,
	neutral: 35,
	// Below neutral = bad
};

// Action cooldowns in milliseconds
export const ACTION_COOLDOWNS = {
	feed: 30_000,
	play: 60_000,
	train: 90_000,
	clean: 30_000,
	sleep: 120_000,
};

// Sleep duration in seconds
export const SLEEP_DURATION_MS = 10_000;
