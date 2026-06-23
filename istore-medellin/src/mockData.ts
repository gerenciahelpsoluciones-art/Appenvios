import type { Product, Profile, Repair } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'pf-admin',
    name: 'Administrador General',
    role: 'admin',
    status: 'active',
    username: 'admin',
    password: 'Help.2026*'
  }
];

export const INITIAL_REPAIRS: Repair[] = [];

export const SALES_DATA: any[] = [];

export const RETOMA_DATA: any[] = [];
