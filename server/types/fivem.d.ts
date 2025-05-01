// Declarações para funções globais e nativas do FiveM
declare function onNet(eventName: string, handler: (...args: any[]) => void): void;
declare function emitNet(eventName: string, ...args: any[]): void;
declare function emit(eventName: string, ...args: any[]): void;
declare function Player(source: number | string): PlayerObject;
declare function RegisterCommand(
  commandName: string,
  handler: (source: number, args: string[], rawCommand: string) => void,
  restricted: boolean
): void;
declare function IsPlayerAceAllowed(player: string, permission: string): boolean;

// Declaração para GetPlayerIdentifier
declare function GetPlayerIdentifier(player: string, identifierType: number): string;

// Declaração para GetNumPlayerIdentifiers
declare function GetNumPlayerIdentifiers(player: string): number;

// Declarações para variáveis globais
declare const global: {
  source: number;
};

// Declarações para exports (ex.: oxmysql)
declare const exports: {
  oxmysql: {
    query_async: <T = any>(query: string, params: any[], cb?: (result: T) => void) => Promise<T>;
  };
};

interface PlayerObject {
  state: StateBag;
}

// Interface para StateBag (ajustada para o FiveM real)
interface StateBag {
  [key: string]: any;
  set(key: string, value: any, replicated: boolean): void;
}