export interface Vehicle {
    id: number;
    plate: string;
    model: string;
    color: string;
    customizations: { secondaryColor: string; mods: { [key: string]: number } };
  }