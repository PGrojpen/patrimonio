import { BookOpen } from "lucide-react";

const CONCEPTS = [
  {
    id: "juros-compostos",
    title: "Juros Compostos",
    emoji: "📈",
    body: `Juros compostos são a base do crescimento patrimonial. Diferente dos juros simples, onde os juros são calculados apenas sobre o principal, nos compostos os juros de cada período são incorporados ao capital e também rendem juros nos períodos seguintes.

Fórmula: FV = PV × (1 + r)ⁿ + PMT × [(1 + r)ⁿ - 1] / r

Exemplo: R$ 500/mês por 30 anos a 11% a.a. → R$ 1.4 milhões. Sem os juros compostos seriam apenas R$ 180.000 (360 × R$ 500).`,
  },
  {
    id: "cdi-selic-ipca",
    title: "CDI, Selic e IPCA",
    emoji: "🏦",
    body: `**Selic**: Taxa básica de juros definida pelo Banco Central (COPOM). É o piso da economia — remunera títulos do Tesouro Selic.

**CDI**: Certificado de Depósito Interbancário. Taxa quase idêntica à Selic, usada como referência para CDBs e fundos DI. Quando um CDB rende "120% do CDI", significa 120% desta taxa.

**IPCA**: Inflação oficial do Brasil (IBGE). Para calcular retorno real, use a equação de Fisher: (1 + nominal) / (1 + IPCA) - 1.`,
  },
  {
    id: "sharpe-sortino",
    title: "Sharpe e Sortino Ratios",
    emoji: "⚖️",
    body: `**Sharpe Ratio** = (Retorno da carteira - Taxa livre de risco) / Desvio padrão da carteira

Mede quanto retorno você recebe por unidade de risco total. Sharpe > 1 é bom, > 2 é excelente.

**Sortino Ratio** = (Retorno - Taxa livre de risco) / Desvio padrão do downside

Só penaliza a volatilidade negativa (perdas). Mais relevante para investidores avessos a perdas. Um Sortino bem maior que o Sharpe indica que a carteira tem boa assimetria (poucas perdas grandes).`,
  },
  {
    id: "drawdown",
    title: "Maximum Drawdown",
    emoji: "📉",
    body: `O Maximum Drawdown (MDD) mede a maior queda percentual do pico ao vale em um período.

Fórmula: MDD = (Mínimo - Pico anterior) / Pico anterior × 100

Exemplo: Se sua carteira foi de R$ 100k para R$ 70k antes de se recuperar, o MDD foi -30%.

O MDD é crucial para avaliar se você sobreviveria psicologicamente a uma estratégia. Uma carteira com -60% de MDD exige que o investidor aguente ver metade do patrimônio evaporar sem vender.`,
  },
  {
    id: "var-cvar",
    title: "VaR e CVaR",
    emoji: "🎲",
    body: `**VaR 95% (Value at Risk)**: A perda máxima esperada com 95% de confiança em um período. Se o VaR mensal é -5%, significa que em 95% dos meses a perda não passa disso.

**CVaR 95% (Expected Shortfall)**: A perda média nos piores 5% dos cenários. Mais conservador que o VaR — captura o "tail risk".

Exemplo: VaR 95% = -5%. CVaR 95% = -9%. Significa que nos meses ruins, a perda média é de 9%.`,
  },
  {
    id: "markowitz",
    title: "Teoria Moderna de Portfólios (Markowitz)",
    emoji: "🎯",
    body: `Harry Markowitz (Nobel 1990) demonstrou que a diversificação reduz o risco sem necessariamente reduzir o retorno.

**Fronteira Eficiente**: Conjunto de portfólios que, para cada nível de risco, oferecem o maior retorno possível.

**Portfólio de mínima variância**: A carteira com menor volatilidade possível.

**Portfólio de máximo Sharpe**: A carteira com melhor relação risco-retorno.

**Correlação**: Ativos com correlação baixa ou negativa se complementam. Por isso misturar ações brasileiras com S&P 500 e FIIs pode reduzir a volatilidade da carteira.`,
  },
  {
    id: "gbm-monte-carlo",
    title: "Monte Carlo e GBM",
    emoji: "🎰",
    body: `**Geometric Brownian Motion (GBM)**: Modelo estocástico para preços de ativos. Assume retornos log-normais.

dS = μS dt + σS dW

onde μ é o drift (retorno esperado), σ é a volatilidade, e dW é o movimento Browniano (choque aleatório).

**Monte Carlo**: Roda o GBM 10.000+ vezes com choques aleatórios diferentes. A distribuição das trajetórias revela a incerteza do futuro.

**Bootstrap**: Alternativa ao GBM que amostra retornos históricos reais, preservando fat tails e assimetria.`,
  },
  {
    id: "tributacao",
    title: "Tributação de Investimentos no Brasil",
    emoji: "🇧🇷",
    body: `**Tabela regressiva IR (Renda fixa)**:
- 0 a 180 dias: 22,5%
- 181 a 360 dias: 20,0%
- 361 a 720 dias: 17,5%
- Acima de 720 dias: 15,0%

**LCI/LCA**: Isentos de IR para pessoa física.

**FII**: Dividendos isentos para PF. Ganho de capital na venda: 20%.

**Ações (swing trade)**: 15% sobre o ganho. Isenção para vendas até R$ 20.000/mês.

**Day trade**: 20%, sem isenção.

**Come-cotas**: Fundos de investimento têm antecipação de IR em maio e novembro.`,
  },
];

export function LearnPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {CONCEPTS.map((concept) => (
          <div key={concept.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label={concept.title}>
                {concept.emoji}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">{concept.title}</h3>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {concept.body}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-2 font-medium text-foreground">
          <BookOpen className="h-4 w-4" />
          Leituras Recomendadas
        </div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Tesouro Direto: tesourodireto.gov.br</li>
          <li>Banco Central (SGS — Séries históricas): bcb.gov.br</li>
          <li>CVM (educação financeira): investidor.gov.br</li>
          <li>Markowitz (1952) — "Portfolio Selection", Journal of Finance</li>
          <li>Black-Scholes (1973) — "The Pricing of Options and Corporate Liabilities"</li>
        </ul>
      </div>
    </div>
  );
}
