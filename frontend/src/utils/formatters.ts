/**
 * Funções utilitárias para formatação
 */

/**
 * Formata um valor monetário para exibição em Real Brasileiro
 * @param value O valor a ser formatado (número ou string)
 * @returns String formatada como moeda brasileira (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

