export type PluginRoute = {
  path: string;
  title: string;
};

export interface IUIPlugin {
  id: string;
  name: string;
  routes: PluginRoute[];
  mount(): Promise<void>;
  unmount(): Promise<void>;
}
