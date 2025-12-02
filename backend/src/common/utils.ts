/**
 * Funções utilitárias compartilhadas
 */

/**
 * Gera um ID único mock para pagamentos
 */
export function generateMockId(prefix: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${randomString}`;
}

/**
 * Calcula o número de noites entre duas datas
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diffTime / MILLISECONDS_PER_DAY) || 1;
}

/**
 * Normaliza uma data string para um objeto Date (apenas a parte da data, sem hora)
 * @param dateString String no formato 'YYYY-MM-DD' ou objeto Date
 * @returns Date object representando o início do dia
 */
export function normalizeDate(dateString: string | Date): Date {
  if (typeof dateString === 'string') {
    const date = new Date(dateString + 'T00:00:00');
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
}

/**
 * Converte um valor para número, tratando strings do banco de dados
 */
export function toNumber(value: string | number): number {
  if (typeof value === 'string') {
    return parseFloat(value);
  }
  return Number(value);
}

/**
 * Formata um valor monetário para exibição
 */
export function formatCurrency(value: string | number): string {
  const numValue = toNumber(value);
  return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
}

