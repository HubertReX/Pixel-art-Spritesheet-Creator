import Dexie, { type Table } from 'dexie';
import { Design } from '../types';

export class SpriteArtisanDB extends Dexie {
  // 'designs' is the name of our table.
  designs!: Table<Design>; 

  constructor() {
    super('SpriteArtisanDB');
    // FIX: Cast `this` to `Dexie` to resolve a potential TypeScript type resolution issue with inherited methods in the constructor.
    (this as Dexie).version(1).stores({
      designs: 'id, name' // Primary key 'id', and index 'name' for sorting.
    });
  }
}

export const db = new SpriteArtisanDB();

/**
 * Fetches all designs from the database, sorted by name.
 * @returns A promise that resolves to an array of designs.
 */
export const getAllDesigns = async (): Promise<Design[]> => {
    return await db.designs.orderBy('name').toArray();
};

/**
 * Saves or updates a design in the database.
 * Dexie's `put` method handles both creation and updates.
 * @param design The design object to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const saveDesign = async (design: Design): Promise<void> => {
    await db.designs.put(design);
};

/**
 * Deletes a design from the database by its ID.
 * @param id The ID of the design to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteDesign = async (id: string): Promise<void> => {
    await db.designs.delete(id);
};
