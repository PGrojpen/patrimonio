import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CONCEPTS: Record<string, { title: string; body: string }> = {
  sharpe: {
    title: "Sharpe Ratio",
    body: "Mede o retorno por unidade de risco. Quanto maior, melhor. Abaixo de 1 é fraco, acima de 2 é excelente. Fórmula: (Rp - Rf) / σp",
  },
  sortino: {
    title: "Sortino Ratio",
    body: "Similar ao Sharpe, mas penaliza apenas a volatilidade negativa (downside). Mais relevante para investidores avessos a perdas.",
  },
  drawdown: {
    title: "Maximum Drawdown",
    body: "Maior queda percentual do pico ao vale no período. Indica o pior cenário que o investidor teria vivenciado.",
  },
  var: {
    title: "VaR 95%",
    body: "Value at Risk: a perda máxima esperada em 95% dos cenários. Em outras palavras, nos piores 5% dos meses, o retorno seria pior que este valor.",
  },
  cvar: {
    title: "CVaR / Expected Shortfall",
    body: "Conditional VaR: retorno médio nos piores 5% dos cenários. Mais conservador que o VaR pois captura o tail risk.",
  },
  beta: {
    title: "Beta",
    body: "Mede a sensibilidade ao mercado (Ibovespa). Beta=1 move igual ao mercado, Beta<1 é mais defensivo, Beta>1 é mais volátil.",
  },
  cdi: {
    title: "CDI",
    body: "Certificado de Depósito Interbancário — taxa de referência da renda fixa brasileira. Referência para CDBs, LCIs, fundos DI.",
  },
  ipca: {
    title: "IPCA",
    body: "Índice Nacional de Preços ao Consumidor Amplo — inflação oficial brasileira, medida pelo IBGE mensalmente.",
  },
  selic: {
    title: "Selic",
    body: "Taxa básica de juros brasileira, definida pelo COPOM (Banco Central). Define o piso de rentabilidade da economia.",
  },
  gbm: {
    title: "Geometric Brownian Motion",
    body: "Modelo estocástico usado para simular preços de ativos. Assume retornos normalmente distribuídos e variância constante. Fórmula: dS = μS dt + σS dW",
  },
  markowitz: {
    title: "Fronteira Eficiente de Markowitz",
    body: "Conjunto de portfólios que maximizam o retorno para cada nível de risco. Desenvolvida por Harry Markowitz em 1952, base da teoria moderna de portfólios.",
  },
  calmar: {
    title: "Calmar Ratio",
    body: "Retorno anualizado dividido pelo maximum drawdown (absoluto). Mede retorno por unidade de drawdown sofrido.",
  },
};

interface ConceptTooltipProps {
  concept: keyof typeof CONCEPTS;
  className?: string;
}

export function ConceptTooltip({ concept, className }: ConceptTooltipProps) {
  const [open, setOpen] = useState(false);
  const info = CONCEPTS[concept];
  if (!info) return null;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Saiba mais sobre ${info.title}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border bg-card p-3 shadow-lg">
            <p className="mb-1 font-semibold text-sm">{info.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{info.body}</p>
          </div>
        </>
      )}
    </span>
  );
}
