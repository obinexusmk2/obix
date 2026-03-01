declare module 'obix/api' {
    export interface Component {
      state: any;
      trigger(event: string, payload?: any): void;
      subscribe(listener: (state: any) => void): () => void;
      render(state: any, trigger?: (event: string, payload?: any) => void): any;
    }
    
  
    export interface FunctionalComponent extends Component {
      initialState: any;
      transitions: Record<string, Function>;
      render(state: any, trigger: (event: string, payload?: any) => void): any;
    }
  
    export interface OOPComponent extends Component {
      initialState: any;
      render(state: any): any;
      _onMount?(): void;
      _onUpdate?(prevState: any, newState: any): void;
      _onUnmount?(): void;
      [methodName: string]: any;
    }
  
    export function component(config: {
      initialState: any;
      transitions: Record<string, (state: any, payload?: any) => any>;
      render: (state: any, trigger: (event: string, payload?: any) => void) => any;
    }): FunctionalComponent;
  
    export abstract class Component {
      initialState: any;
      render(state: any): any;
      state: any;
      trigger(event: string, payload?: any): void;
      subscribe(listener: (state: any) => void): () => void;
      _onMount?(): void;
      _onUpdate?(prevState: any, newState: any): void;
      _onUnmount?(): void;
    }
}