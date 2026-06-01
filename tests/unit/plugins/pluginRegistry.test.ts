import { describe, expect, it } from 'vitest';
import {
  EventTypes,
  type DomainEvent,
  type EventBus,
  type EventType,
} from '../../../src/domain/index.js';
import {
  ElectronPlugin,
  PluginRegistry,
  TerminalPlugin,
  WebPlugin,
  type ICorePlugin,
} from '../../../src/plugins/index.js';

class FakeEventBus implements EventBus {
  readonly events: DomainEvent[] = [];

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    this.events.push(event);
  }

  subscribe<TEvent extends DomainEvent>(
    _type: EventType,
    _handler: (event: TEvent) => void | Promise<void>,
  ): () => void {
    return () => undefined;
  }
}

class FakeCorePlugin implements ICorePlugin {
  id = 'core-test';
  name = 'Core Test Plugin';
  registered = false;

  async register(eventBus: EventBus): Promise<void> {
    this.registered = true;
    await eventBus.publish({
      id: 'core-plugin-registered',
      type: EventTypes.SESSION_UPDATED,
      occurredAt: new Date('2026-06-01T00:00:00.000Z'),
      payload: { id: this.id },
    });
  }

  async unregister(eventBus: EventBus): Promise<void> {
    this.registered = false;
    await eventBus.publish({
      id: 'core-plugin-unregistered',
      type: EventTypes.SESSION_UPDATED,
      occurredAt: new Date('2026-06-01T00:00:01.000Z'),
      payload: { id: this.id },
    });
  }
}

describe('PluginRegistry', () => {
  it('registers UI plugins and aggregates routes', async () => {
    const registry = new PluginRegistry(new FakeEventBus());

    await registry.registerUI(new TerminalPlugin());
    await registry.registerUI(new WebPlugin());
    await registry.registerUI(new ElectronPlugin());

    const routes = registry.listRoutes();

    expect(registry.listUIPlugins()).toHaveLength(3);
    expect(routes.find((route) => route.path === '/model')).toBeDefined();
    expect(routes.find((route) => route.path === '/chat/:sessionId')).toBeDefined();
  });

  it('registers and unregisters core plugins with event bus integration', async () => {
    const eventBus = new FakeEventBus();
    const registry = new PluginRegistry(eventBus);
    const plugin = new FakeCorePlugin();

    await registry.registerCore(plugin);
    expect(plugin.registered).toBe(true);
    expect(registry.listCorePlugins()).toHaveLength(1);

    await registry.unregisterCore(plugin.id);
    expect(plugin.registered).toBe(false);
    expect(registry.listCorePlugins()).toHaveLength(0);
    expect(eventBus.events).toHaveLength(2);
  });
});
