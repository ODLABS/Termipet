import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {PetState, ShopItem} from '../types.js';
import {shopItems} from '../shop-data.js';

interface ShopScreenProps {
	pet: PetState;
	onBuy: (item: ShopItem) => void;
	onBack: () => void;
}

export function ShopScreen({pet, onBuy, onBack}: ShopScreenProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [message, setMessage] = useState('');

	useInput((_input, key) => {
		if (key.escape || _input.toLowerCase() === 'q') {
			onBack();
			return;
		}

		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => Math.min(shopItems.length - 1, prev + 1));
		} else if (key.return) {
			const item = shopItems[selectedIndex];
			if (!item) return;

			if (item.price > pet.currency) {
				setMessage('Not enough coins!');
				setTimeout(() => {
					setMessage('');
				}, 2000);
			} else {
				onBuy(item);
				setMessage(`Bought ${item.name}!`);
				setTimeout(() => {
					setMessage('');
				}, 2000);
			}
		}
	});

	const categories = ['food', 'toy', 'medicine', 'cosmetic'] as const;

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box borderStyle="double" borderColor="yellow" paddingX={1} flexDirection="column">
				<Box justifyContent="space-between">
					<Text bold color="yellow">
						Shop
					</Text>
					<Text color="yellow">
						$ {pet.currency} coins
					</Text>
				</Box>
				<Text> </Text>
				{categories.map(category => {
					const items = shopItems.filter(item => item.category === category);
					if (items.length === 0) return null;

					return (
						<Box key={category} flexDirection="column" marginBottom={1}>
							<Text bold color="cyan" underline>
								{category.charAt(0).toUpperCase() + category.slice(1)}
							</Text>
							{items.map(item => {
								const globalIndex = shopItems.indexOf(item);
								const isSelected = globalIndex === selectedIndex;
								const canAfford = pet.currency >= item.price;

								return (
									<Box key={item.id} gap={1}>
										<Text color={isSelected ? 'green' : 'white'} bold={isSelected}>
											{isSelected ? '>' : ' '}
										</Text>
										<Text
											color={isSelected ? 'green' : canAfford ? 'white' : 'gray'}
											bold={isSelected}
										>
											{item.name}
										</Text>
										<Text color={canAfford ? 'yellow' : 'red'}>
											{item.price === 0 ? 'FREE' : `$${item.price}`}
										</Text>
										<Text dimColor>
											{item.description}
										</Text>
									</Box>
								);
							})}
						</Box>
					);
				})}
				{message && (
					<Text color="green" bold>{message}</Text>
				)}
				<Text> </Text>
				<Text dimColor>Up/Down to browse | Enter to buy | Q/Esc to go back</Text>
			</Box>
		</Box>
	);
}
