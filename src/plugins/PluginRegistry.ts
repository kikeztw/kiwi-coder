import type { EventBus } from '../domain/events/EventBus.js';
import type { ICorePlugin, IUIPlugin, PluginRoute } from './interfaces/index.js';

type RegistryState = {
  ui: Map<string, IUIPlugin>;
  core: Map<string, ICorePlugin>;
};

export class PluginRegistry {
  private readonly state: RegistryState = {
    ui: new Map<string, IUIPlugin>(),
    core: new Map<string, ICorePlugin>(),
  };

  constructor(private readonly eventBus: EventBus) {}

  async registerUI(plugin: IUIPlugin): Promise<void> {
    if (this.state.ui.has(plugin.id)) {
      throw new Error(`UI plugin "${plugin.id}" is already registered`);
    }
    await plugin.mount();
    this.state.ui.set(plugin.id, plugin);
  }

  async unregisterUI(pluginId: string): Promise<void> {
    const plugin = this.state.ui.get(pluginId);
    if (!plugin) {
      return;
    }
    await plugin.unmount();
    this.state.ui.delete(pluginId);
  }

  async registerCore(plugin: ICorePlugin): Promise<void> {
    if (this.state.core.has(plugin.id)) {
      throw new Error(`Core plugin "${plugin.id}" is already registered`);
    }
    await plugin.register(this.eventBus);
    this.state.core.set(plugin.id, plugin);
  }

  async unregisterCore(pluginId: string): Promise<void> {
    const plugin = this.state.core.get(pluginId);
    if (!plugin) {
      return;
    }
    await plugin.unregister(this.eventBus);
    this.state.core.delete(pluginId);
  }

  listUIPlugins(): IUIPlugin[] {
    return Array.from(this.state.ui.values());
  }

  listCorePlugins(): ICorePlugin[] {
    return Array.from(this.state.core.values());
  }

  listRoutes(): PluginRoute[] {
    return this.listUIPlugins().flatMap((plugin) => plugin.routes);
  }
}
