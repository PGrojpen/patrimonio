# Matemática Financeira — Patrimônio

Documentação das fórmulas e modelos matemáticos utilizados no simulador.

---

## 1. Valor Futuro com Aportes

### Fórmula base

$$FV = PV \cdot (1+r)^n + PMT \cdot \frac{(1+r)^n - 1}{r}$$

Onde:
- $PV$ = valor presente (aporte inicial)
- $PMT$ = pagamento periódico (aporte mensal)
- $r$ = taxa por período (mensal)
- $n$ = número de períodos
- $FV$ = valor futuro

### Conversão de taxa anual para mensal

$$r_{mensal} = (1 + r_{anual})^{1/12} - 1$$

A raiz duodécima garante equivalência de taxas em regime de juros compostos.

---

## 2. Retorno e Volatilidade

### Retorno simples

$$R_t = \frac{P_t - P_{t-1}}{P_{t-1}}$$

### Retorno logarítmico (log-return)

$$r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$

Log-returns são aditivos e mais adequados para modelagem estatística (aproximação normal).

### Volatilidade anualizada

$$\sigma_{anual} = \sigma_{mensal} \cdot \sqrt{12}$$

Para dados diários: $\sigma_{anual} = \sigma_{diário} \cdot \sqrt{252}$ (252 dias úteis).

### CAGR (Compound Annual Growth Rate)

$$CAGR = \left(\frac{FV}{PV}\right)^{1/n} - 1$$

Onde $n$ é o número de anos.

---

## 3. Métricas de Risco

### Sharpe Ratio

$$S = \frac{\bar{R}_p - R_f}{\sigma_p}$$

- $\bar{R}_p$ = retorno médio da carteira (anualizado)
- $R_f$ = taxa livre de risco (CDI)
- $\sigma_p$ = volatilidade anualizada

Interpretação: Sharpe > 1 bom, > 2 excelente, < 0 pior que renda fixa.

### Sortino Ratio

$$So = \frac{\bar{R}_p - R_f}{\sigma_d}$$

Onde $\sigma_d$ é o desvio padrão apenas dos retornos **negativos** (downside deviation).

### Maximum Drawdown

$$MDD = \min_t \left[\frac{P_t - \max_{s \leq t} P_s}{\max_{s \leq t} P_s}\right]$$

O ponto mais baixo do "underwater chart".

### VaR 95% (Histórico)

$$VaR_{95\%} = \text{Percentil}_{5\%}(R_1, R_2, ..., R_T)$$

A perda no 5º percentil da distribuição empírica de retornos.

### CVaR 95% (Expected Shortfall)

$$CVaR_{95\%} = \mathbb{E}[R_t \mid R_t \leq VaR_{95\%}]$$

Média dos retornos abaixo do VaR. Medida coerente de risco (Artzner et al., 1999).

### Beta

$$\beta = \frac{Cov(R_p, R_m)}{Var(R_m)}$$

Sensibilidade da carteira ao mercado (Ibovespa). $\beta = 1$ move igual ao IBOV.

### Calmar Ratio

$$Calmar = \frac{CAGR}{|MDD|}$$

Retorno anualizado por unidade de drawdown máximo.

---

## 4. Geometric Brownian Motion (GBM)

Modelo estocástico para preços de ativos financeiros:

$$dS = \mu S \, dt + \sigma S \, dW$$

Em forma discreta (discretização de Euler-Maruyama):

$$S_{t+dt} = S_t \cdot \exp\left[\left(\mu - \frac{\sigma^2}{2}\right)dt + \sigma\sqrt{dt}\,Z\right]$$

Onde $Z \sim \mathcal{N}(0,1)$ e o fator $\sigma^2/2$ é a **correção de Itô** que garante que a mediana do processo seja consistente com o drift $\mu$.

### Implementação mensal

Com $dt = 1/12$:

$$S_{t+1} = S_t \cdot \exp\left[\left(\mu - \frac{\sigma^2}{2}\right)\frac{1}{12} + \sigma\sqrt{\frac{1}{12}}\,Z\right] + PMT$$

---

## 5. Otimização de Markowitz

### Retorno da carteira

$$R_p = \mathbf{w}^T \boldsymbol{\mu}$$

### Variância da carteira

$$\sigma_p^2 = \mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}$$

Onde $\boldsymbol{\Sigma}$ é a matriz de covariância $n \times n$ dos retornos.

### Problema de mínima variância

$$\min_{\mathbf{w}} \quad \mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}$$
$$\text{s.t.} \quad \mathbf{1}^T \mathbf{w} = 1, \quad \mathbf{w} \geq 0$$

### Problema de máximo Sharpe

$$\max_{\mathbf{w}} \quad \frac{\mathbf{w}^T\boldsymbol{\mu} - R_f}{\sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}}$$

Implementado com `scipy.optimize.minimize` (método SLSQP).

---

## 6. Tributação

### Tabela regressiva IR (renda fixa)

| Prazo | Alíquota IR |
|-------|-------------|
| 0–180 dias | 22,5% |
| 181–360 dias | 20,0% |
| 361–720 dias | 17,5% |
| > 720 dias | 15,0% |

### IOF regressivo (< 30 dias)

$$IOF_{dia\,d} = \text{Tabela}[d] \% \cdot \text{Ganho bruto}$$

Varia de 96% no dia 1 a 0% no dia 30.

### Retorno líquido estimado

$$R_{líq} \approx R_{bruto} \cdot (1 - \text{alíquota})$$

---

## 7. Ajuste pela Inflação — Equação de Fisher

$$R_{real} = \frac{1 + R_{nominal}}{1 + \pi} - 1$$

Onde $\pi$ é a inflação (IPCA). Para projeções, usa-se o Focus/BCB.

---

## Referências

- Markowitz, H. (1952). Portfolio Selection. *Journal of Finance*, 7(1), 77–91.
- Black, F., & Scholes, M. (1973). The Pricing of Options and Corporate Liabilities. *Journal of Political Economy*, 81(3), 637–654.
- Sharpe, W. (1994). The Sharpe Ratio. *Journal of Portfolio Management*, 21(1), 49–58.
- Artzner, P. et al. (1999). Coherent Measures of Risk. *Mathematical Finance*, 9(3), 203–228.
- Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS): [bcb.gov.br](https://www.bcb.gov.br)
