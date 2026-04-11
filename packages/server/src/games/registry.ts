import type { GamePlugin } from '@the-green-felt/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGamePlugin = GamePlugin<any, any, any>;

/**
 * Registry of all available game plugins.
 * The server queries this to find the correct plugin for a game session.
 */
class GameRegistry {
  private readonly plugins = new Map<string, AnyGamePlugin>();

  /** Register a game plugin. */
  register(plugin: AnyGamePlugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Game plugin "${plugin.metadata.id}" is already registered`);
    }
    this.plugins.set(plugin.metadata.id, plugin);
  }

  /** Get a plugin by its ID. */
  get(gameTypeId: string): AnyGamePlugin | undefined {
    return this.plugins.get(gameTypeId);
  }

  /** Get all registered plugins (for listing in the lobby). */
  getAll(): AnyGamePlugin[] {
    return [...this.plugins.values()];
  }

  /** Check if a plugin is registered. */
  has(gameTypeId: string): boolean {
    return this.plugins.has(gameTypeId);
  }
}

/** Singleton game registry */
export const gameRegistry = new GameRegistry();
