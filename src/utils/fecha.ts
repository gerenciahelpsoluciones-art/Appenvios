// Fecha de hoy en Colombia (YYYY-MM-DD).
// new Date().toISOString() da la fecha UTC: después de las 7 p. m. ya es el día siguiente
// y las ventas de fin de mes caían en el mes equivocado.
export const hoyColombia = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
