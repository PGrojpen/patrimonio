import type { AssetAllocation, RebalanceFrequency } from "@/types/api";

// Pesos em 0..1 (formato da API)
export interface PortfolioTemplate {
  id: string;
  label: string;
  description: string;
  rebalance_frequency: RebalanceFrequency;
  assets: AssetAllocation[];
}

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  {
    id: "conservador",
    label: "Conservador BR",
    description: "Renda fixa pública de alta liquidez e segurança",
    rebalance_frequency: "annual",
    assets: [
      {
        name: "Tesouro Selic 2029",
        weight: 0.6,
        annual_rate_pct: 13.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pos_selic",
      },
      {
        name: "Tesouro IPCA+ 2032",
        weight: 0.3,
        annual_rate_pct: 12.5,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "ipca_plus",
      },
      {
        name: "Tesouro Prefixado 2029",
        weight: 0.1,
        annual_rate_pct: 12.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pre",
      },
    ],
  },
  {
    id: "moderado",
    label: "Moderado BR",
    description: "Mix de renda fixa e renda variável doméstica",
    rebalance_frequency: "annual",
    assets: [
      {
        name: "Tesouro Selic 2029",
        weight: 0.3,
        annual_rate_pct: 13.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pos_selic",
      },
      {
        name: "Tesouro IPCA+ 2032",
        weight: 0.3,
        annual_rate_pct: 12.5,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "ipca_plus",
      },
      {
        name: "Tesouro Prefixado 2029",
        weight: 0.2,
        annual_rate_pct: 12.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pre",
      },
      {
        name: "BOVA11",
        weight: 0.2,
        annual_rate_pct: 14.0,
        tax_regime: "stocks",
        has_fgc: false,
        indexador: "equity",
      },
    ],
  },
  {
    id: "agressivo",
    label: "Agressivo BR",
    description: "Maior exposição a renda variável nacional e internacional",
    rebalance_frequency: "annual",
    assets: [
      {
        name: "Tesouro Selic 2029",
        weight: 0.1,
        annual_rate_pct: 13.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pos_selic",
      },
      {
        name: "Tesouro IPCA+ 2032",
        weight: 0.3,
        annual_rate_pct: 12.5,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "ipca_plus",
      },
      {
        name: "BOVA11",
        weight: 0.4,
        annual_rate_pct: 14.0,
        tax_regime: "stocks",
        has_fgc: false,
        indexador: "equity",
      },
      {
        name: "IVVB11",
        weight: 0.2,
        annual_rate_pct: 15.0,
        tax_regime: "stocks",
        has_fgc: false,
        indexador: "equity",
      },
    ],
  },
  {
    id: "renda_fixa",
    label: "100% Renda Fixa",
    description: "Diversificado em produtos de renda fixa com diferentes indexadores",
    rebalance_frequency: "annual",
    assets: [
      {
        name: "Tesouro Selic 2029",
        weight: 0.4,
        annual_rate_pct: 13.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pos_selic",
      },
      {
        name: "Tesouro IPCA+ 2032",
        weight: 0.4,
        annual_rate_pct: 12.5,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "ipca_plus",
      },
      {
        name: "Tesouro Prefixado 2029",
        weight: 0.2,
        annual_rate_pct: 12.0,
        tax_regime: "regressive_ir",
        has_fgc: false,
        indexador: "pre",
      },
    ],
  },
];

export const TAX_REGIME_LABELS: Record<string, string> = {
  regressive_ir: "IR Regressivo",
  exempt: "Isento (LCI/LCA)",
  come_cotas: "Come-cotas",
  stocks: "Ações",
};

export const INDEXADOR_LABELS: Record<string, string> = {
  pre: "Prefixado",
  pos_cdi: "Pós CDI",
  pos_selic: "Pós Selic",
  ipca_plus: "IPCA+",
  hybrid: "Híbrido",
  equity: "Renda Variável",
};
