import type {CurrencyService, PetState, Transaction} from './types.js';

export const localCurrencyService: CurrencyService = {
	getBalance(state: PetState): number {
		return state.currency;
	},

	earn(state: PetState, amount: number, reason: string): PetState {
		const transaction: Transaction = {
			amount,
			reason,
			timestamp: Date.now(),
		};

		return {
			...state,
			currency: state.currency + amount,
			transactions: [...state.transactions.slice(-99), transaction],
		};
	},

	spend(state: PetState, amount: number, item: string): PetState | null {
		if (state.currency < amount) {
			return null;
		}

		const transaction: Transaction = {
			amount: -amount,
			reason: `Bought ${item}`,
			timestamp: Date.now(),
		};

		return {
			...state,
			currency: state.currency - amount,
			transactions: [...state.transactions.slice(-99), transaction],
		};
	},

	getHistory(state: PetState): Transaction[] {
		return state.transactions;
	},
};
