import React from 'react';
import { colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export interface CategoryMeta {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

/**
 * Paleta derivada exclusivamente dos tokens do tema.
 * Sem hex avulsos — tudo vem de colors.brand, colors.chart ou colors.semantic.
 */
const palette = {
  purple:    colors.brand.primary,   // #7c6aff
  pink:      colors.brand.accent,    // #ff6b9d
  teal:      colors.brand.teal,      // #00d4aa
  amber:     colors.warning,         // #ffb347
  blue:      colors.chart[4],        // #4ea8de
  violet:    colors.chart[5],        // #9b5de5
  rose:      colors.chart[6],        // #f15bb5
  cyan:      colors.chart[7],        // #00f5d4
  sky:       colors.chart[8],        // #00bbf9
  muted:     colors.text.secondary,  // #9898b8
} as const;

/**
 * Retorna ícone e cor baseados no nome da categoria e tipo.
 * Cores derivadas do design system — sem valores arbitrários.
 */
export const getCategoryMeta = (name: string, type: 'Income' | 'Expense'): CategoryMeta => {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // ─── RECEITAS ──────────────────────────────────────────────────────
  if (type === 'Income') {
    if (n.includes('salario') || n.includes('pagamento') || n.includes('mensal') || n.includes('prolabore')) {
      return { icon: 'cash-outline', color: palette.teal };
    }
    if (n.includes('freelance') || n.includes('job') || n.includes('trabalho') || n.includes('servico') || n.includes('extra') || n.includes('bico')) {
      return { icon: 'laptop-outline', color: palette.blue };
    }
    if (n.includes('invest') || n.includes('rendimento') || n.includes('juros') || n.includes('poupanca') || n.includes('dividendo') || n.includes('acoes') || n.includes('cripto')) {
      return { icon: 'bar-chart-outline', color: palette.amber };
    }
    if (n.includes('venda') || n.includes('comissao') || n.includes('negocio') || n.includes('loja')) {
      return { icon: 'storefront-outline', color: palette.pink };
    }
    if (n.includes('aluguel') || n.includes('renda') || n.includes('imovel')) {
      return { icon: 'business-outline', color: palette.purple };
    }
    if (n.includes('reembolso') || n.includes('devolucao') || n.includes('estorno')) {
      return { icon: 'swap-horizontal-outline', color: palette.violet };
    }
    if (n.includes('presente') || n.includes('doacao') || n.includes('premio') || n.includes('bonus')) {
      return { icon: 'gift-outline', color: palette.rose };
    }
    return { icon: 'wallet-outline', color: palette.teal };
  }

  // ─── DESPESAS ──────────────────────────────────────────────────────

  // Alimentação / Restaurante
  if (n.includes('alimentac') || n.includes('restaurante') || n.includes('comida') || n.includes('lanche') || n.includes('jantar') || n.includes('almoco') || n.includes('delivery') || n.includes('ifood') || n.includes('refeic')) {
    return { icon: 'fast-food-outline', color: palette.amber };
  }
  // Mercado / Supermercado
  if (n.includes('mercado') || n.includes('supermercado') || n.includes('compras') || n.includes('feira') || n.includes('despensa') || n.includes('hortifruti')) {
    return { icon: 'cart-outline', color: palette.teal };
  }
  // Café / Padaria
  if (n.includes('cafe') || n.includes('padaria') || n.includes('confeitaria') || n.includes('doce') || n.includes('sorvete')) {
    return { icon: 'cafe-outline', color: palette.amber };
  }
  // Transporte / Carro
  if (n.includes('carro') || n.includes('combustivel') || n.includes('gasolina') || n.includes('transporte') || n.includes('uber') || n.includes('metro') || n.includes('onibus') || n.includes('taxi') || n.includes('pedagio') || n.includes('estacionamento') || n.includes('veiculo')) {
    return { icon: 'car-sport-outline', color: palette.blue };
  }
  // Saúde / Médico
  if (n.includes('saude') || n.includes('farmacia') || n.includes('medico') || n.includes('remedio') || n.includes('dentista') || n.includes('hospital') || n.includes('clinica') || n.includes('exame') || n.includes('consulta') || n.includes('terapia') || n.includes('psicolog')) {
    return { icon: 'medkit-outline', color: palette.pink };
  }
  // Moradia / Casa
  if (n.includes('casa') || n.includes('aluguel') || n.includes('condominio') || n.includes('moradia') || n.includes('reforma') || n.includes('decorac') || n.includes('moveis') || n.includes('limpeza')) {
    return { icon: 'home-outline', color: palette.purple };
  }
  // Contas / Energia / Água
  if (n.includes('luz') || n.includes('energia') || n.includes('agua') || n.includes('gas') || n.includes('conta')) {
    return { icon: 'bulb-outline', color: palette.cyan };
  }
  // Internet / Telefone / Assinaturas
  if (n.includes('internet') || n.includes('telefone') || n.includes('celular') || n.includes('assinatura') || n.includes('stream') || n.includes('netflix') || n.includes('spotify') || n.includes('prime') || n.includes('mensalidade') || n.includes('disney') || n.includes('youtube')) {
    return { icon: 'phone-portrait-outline', color: palette.sky };
  }
  // Lazer / Viagem
  if (n.includes('lazer') || n.includes('viagem') || n.includes('ferias') || n.includes('hotel') || n.includes('passeio') || n.includes('entretenimento') || n.includes('turismo')) {
    return { icon: 'airplane-outline', color: palette.violet };
  }
  // Cinema / Jogos / Eventos
  if (n.includes('cinema') || n.includes('show') || n.includes('festa') || n.includes('balada') || n.includes('jogos') || n.includes('games') || n.includes('teatro') || n.includes('evento') || n.includes('ingresso')) {
    return { icon: 'game-controller-outline', color: palette.purple };
  }
  // Educação / Escola
  if (n.includes('educac') || n.includes('escola') || n.includes('faculdade') || n.includes('curso') || n.includes('livro') || n.includes('estudo') || n.includes('universidade') || n.includes('ensino')) {
    return { icon: 'school-outline', color: palette.sky };
  }
  // Roupas / Vestuário
  if (n.includes('roupa') || n.includes('vestuario') || n.includes('calcado') || n.includes('loja') || n.includes('shopping') || n.includes('moda') || n.includes('acessorios')) {
    return { icon: 'shirt-outline', color: palette.rose };
  }
  // Beleza / Estética
  if (n.includes('beleza') || n.includes('estetica') || n.includes('cabelo') || n.includes('salao') || n.includes('manicure') || n.includes('cosmetico') || n.includes('barbeiro')) {
    return { icon: 'sparkles-outline', color: palette.pink };
  }
  // Academia / Fitness
  if (n.includes('academia') || n.includes('fitness') || n.includes('esporte') || n.includes('musculac') || n.includes('crossfit') || n.includes('natac') || n.includes('gym') || n.includes('pilates') || n.includes('yoga')) {
    return { icon: 'fitness-outline', color: palette.teal };
  }
  // Investimentos / Poupança
  if (n.includes('invest') || n.includes('poupanca') || n.includes('previdencia') || n.includes('acoes') || n.includes('cripto') || n.includes('tesouro')) {
    return { icon: 'trending-up-outline', color: palette.teal };
  }
  // Pet / Animais
  if (n.includes('pet') || n.includes('cachorro') || n.includes('gato') || n.includes('veterinario') || n.includes('racao') || n.includes('petshop') || n.includes('animal')) {
    return { icon: 'paw-outline', color: palette.amber };
  }
  // Filhos / Crianças
  if (n.includes('filho') || n.includes('crianca') || n.includes('bebe') || n.includes('fralda') || n.includes('creche') || n.includes('pediatra')) {
    return { icon: 'people-outline', color: palette.blue };
  }
  // Impostos / Taxas
  if (n.includes('imposto') || n.includes('ipva') || n.includes('iptu') || n.includes('multa') || n.includes('taxa') || n.includes('tarifa')) {
    return { icon: 'receipt-outline', color: palette.violet };
  }
  // Seguros
  if (n.includes('seguro') || n.includes('protecao')) {
    return { icon: 'shield-checkmark-outline', color: palette.blue };
  }
  // Banco / Cartão / Financeiro
  if (n.includes('banco') || n.includes('juros') || n.includes('financiamento') || n.includes('emprestimo') || n.includes('parcela') || n.includes('cartao') || n.includes('credito') || n.includes('anuidade')) {
    return { icon: 'card-outline', color: palette.purple };
  }
  // Presentes / Doações
  if (n.includes('presente') || n.includes('doacao') || n.includes('caridade') || n.includes('dizimo') || n.includes('oferta') || n.includes('igreja')) {
    return { icon: 'heart-outline', color: palette.pink };
  }
  // Default
  return { icon: 'ellipsis-horizontal-circle-outline', color: palette.muted };
};
