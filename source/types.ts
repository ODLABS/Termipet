export type PetType = 'cat' | 'dog' | 'dragon' | 'blob';

export type EvolutionStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';

export type PetMood = 'happy' | 'idle' | 'hungry' | 'sleeping' | 'sick' | 'dead';

export type ActionType = 'feed' | 'play' | 'train' | 'clean' | 'sleep';

export type Screen = 'pet-select' | 'name-input' | 'egg-hatch' | 'main' | 'shop' | 'evolving' | 'dead';

export type ShopItemId = string;

export type ItemCategory = 'food' | 'toy' | 'medicine' | 'cosmetic';

export interface PetStats {
	hunger: number;
	happiness: number;
	energy: number;
	cleanliness: number;
	health: number;
}

export interface ShopItem {
	id: ShopItemId;
	name: string;
	description: string;
	price: number;
	effect: Partial<PetStats>;
	category: ItemCategory;
}

export interface Transaction {
	amount: number;
	reason: string;
	timestamp: number;
}

export interface PetState {
	name: string;
	type: PetType;
	stage: EvolutionStage;
	stats: PetStats;
	xp: number;
	level: number;
	age: number;
	currency: number;
	streak: number;
	lastPlayedDate: string;
	lastTickTime: number;
	birthTime: number;
	isAlive: boolean;
	isDirty: boolean;
	isSick: boolean;
	isSleeping: boolean;
	inventory: ShopItemId[];
	deathCount: number;
	totalPlaytime: number;
	evolutionPath: 'good' | 'neutral' | 'bad';
	transactions: Transaction[];
}

export interface CurrencyService {
	getBalance(state: PetState): number;
	earn(state: PetState, amount: number, reason: string): PetState;
	spend(state: PetState, amount: number, item: string): PetState | null;
	getHistory(state: PetState): Transaction[];
}

export const PET_TYPES: PetType[] = ['cat', 'dog', 'dragon', 'blob'];

export const PET_TYPE_NAMES: Record<PetType, string> = {
	cat: 'Cat',
	dog: 'Dog',
	dragon: 'Dragon',
	blob: 'Blob',
};

export const PET_TYPE_DESCRIPTIONS: Record<PetType, string> = {
	cat: 'Independent and mysterious. Harder to please but very rewarding.',
	dog: 'Loyal and energetic. Easy to care for, loves to play!',
	dragon: 'Fierce and proud. Needs lots of food but gains XP fast.',
	blob: 'Chill and easygoing. Low maintenance, happy with anything.',
};

export const EVOLUTION_STAGES: EvolutionStage[] = ['egg', 'baby', 'child', 'teen', 'adult', 'elder'];
