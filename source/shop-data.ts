import type {ShopItem} from './types.js';

export const shopItems: ShopItem[] = [
	// Food
	{
		id: 'basic-food',
		name: 'Basic Kibble',
		description: 'Simple food. Restores some hunger.',
		price: 0,
		effect: {hunger: 20},
		category: 'food',
	},
	{
		id: 'premium-food',
		name: 'Premium Feast',
		description: 'Gourmet meal! Restores hunger and boosts happiness.',
		price: 10,
		effect: {hunger: 50, happiness: 15},
		category: 'food',
	},
	{
		id: 'super-food',
		name: 'Golden Treat',
		description: 'The finest delicacy. Massive hunger and happiness boost.',
		price: 25,
		effect: {hunger: 80, happiness: 30},
		category: 'food',
	},
	{
		id: 'energy-drink',
		name: 'Energy Juice',
		description: 'Restores energy without needing sleep.',
		price: 15,
		effect: {energy: 40},
		category: 'food',
	},

	// Toys
	{
		id: 'ball',
		name: 'Bouncy Ball',
		description: 'A fun toy! Boosts happiness.',
		price: 15,
		effect: {happiness: 30},
		category: 'toy',
	},
	{
		id: 'plushie',
		name: 'Plushie Friend',
		description: 'A cuddly companion. Big happiness boost!',
		price: 30,
		effect: {happiness: 50},
		category: 'toy',
	},

	// Medicine
	{
		id: 'medicine',
		name: 'Medicine',
		description: 'Cures sickness and restores some health.',
		price: 20,
		effect: {health: 30},
		category: 'medicine',
	},
	{
		id: 'vitamin',
		name: 'Super Vitamin',
		description: 'Boosts all stats slightly.',
		price: 35,
		effect: {health: 15, hunger: 10, happiness: 10, energy: 10, cleanliness: 10},
		category: 'medicine',
	},
	{
		id: 'resurrection',
		name: 'Phoenix Feather',
		description: 'Revive a dead pet! Keeps level and XP.',
		price: 100,
		effect: {health: 50, hunger: 50, happiness: 50, energy: 50, cleanliness: 50},
		category: 'medicine',
	},

	// Cosmetics
	{
		id: 'sparkle',
		name: 'Sparkle Dust',
		description: 'Makes your pet extra clean and shiny!',
		price: 10,
		effect: {cleanliness: 40, happiness: 10},
		category: 'cosmetic',
	},
	{
		id: 'name-change',
		name: 'Name Tag',
		description: 'Rename your pet.',
		price: 25,
		effect: {},
		category: 'cosmetic',
	},
];

export function getShopItem(id: string): ShopItem | undefined {
	return shopItems.find(item => item.id === id);
}

export function getItemsByCategory(category: ShopItem['category']): ShopItem[] {
	return shopItems.filter(item => item.category === category);
}
