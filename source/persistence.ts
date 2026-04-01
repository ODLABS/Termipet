import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type {PetState} from './types.js';

const SAVE_DIR = path.join(os.homedir(), '.termipets');
const SAVE_FILE = path.join(SAVE_DIR, 'pet.json');

async function ensureDir(): Promise<void> {
	try {
		await fs.mkdir(SAVE_DIR, {recursive: true});
	} catch {
		// Directory already exists
	}
}

export async function savePet(state: PetState): Promise<void> {
	await ensureDir();
	const data = JSON.stringify(state, null, 2);
	await fs.writeFile(SAVE_FILE, data, 'utf-8');
}

export async function loadPet(): Promise<PetState | null> {
	try {
		const data = await fs.readFile(SAVE_FILE, 'utf-8');
		return JSON.parse(data) as PetState;
	} catch {
		return null;
	}
}

export async function deleteSave(): Promise<void> {
	try {
		await fs.unlink(SAVE_FILE);
	} catch {
		// File doesn't exist
	}
}
