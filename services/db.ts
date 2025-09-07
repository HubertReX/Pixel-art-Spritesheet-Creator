
import Dexie, { type Table } from 'dexie';
import { Design, AnimationPose } from '../types';

export class SpriteArtisanDB extends Dexie {
  // 'designs' is the name of our table.
  designs!: Table<Design>; 

  constructor() {
    super('SpriteArtisanDB');
    // FIX: Cast `this` to `Dexie` to resolve a potential TypeScript type resolution issue with inherited methods in the constructor.
    (this as Dexie).version(1).stores({
      designs: 'id, name' // Primary key 'id', and index 'name' for sorting.
    });

    // Version 2: Add timestamps for creation and modification.
    (this as Dexie).version(2).stores({
        designs: 'id, name, lastModified' // Add lastModified to indexes for sorting
    }).upgrade(tx => {
        // This upgrade function is called when a client has a db version < 2.
        // We add the new timestamp properties to all existing designs.
        const now = Date.now();
        return tx.table('designs').toCollection().modify(design => {
            design.createdAt = design.createdAt || now;
            design.lastModified = design.lastModified || now;
        });
    });

    // Version 3: Change selectedViewpoints to animationPoses for multi-pose support
    (this as Dexie).version(3).stores({
        designs: 'id, name, lastModified' // Schema definition doesn't change, only the object shape
    }).upgrade(tx => {
        return tx.table('designs').toCollection().modify(design => {
            // Check if the old property exists and the new one doesn't
            if (design.selectedViewpoints && !design.animationPoses) {
                // Migrate the old data to the new structure
                design.animationPoses = [{
                    id: 'default-standing',
                    name: 'Standing',
                    viewpoints: design.selectedViewpoints
                }];
                // Remove the old, now-redundant property
                delete design.selectedViewpoints;
            }
        });
    });
  }
}

export const db = new SpriteArtisanDB();

/**
 * Fetches all designs from the database, sorted by last modified date (descending).
 * @returns A promise that resolves to an array of designs.
 */
export const getAllDesigns = async (): Promise<Design[]> => {
    return await db.designs.orderBy('lastModified').reverse().toArray();
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
 * Saves or updates multiple designs in the database efficiently.
 * @param designs An array of design objects to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const bulkSaveDesigns = async (designs: Design[]): Promise<void> => {
    await db.designs.bulkPut(designs);
};

/**
 * Deletes a design from the database by its ID.
 * @param id The ID of the design to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteDesign = async (id: string): Promise<void> => {
    await db.designs.delete(id);
};
