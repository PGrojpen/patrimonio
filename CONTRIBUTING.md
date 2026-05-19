# Contribuindo com o Patrimônio

Obrigado por querer contribuir! Este documento descreve o processo.

## Setup

```bash
git clone https://github.com/yourusername/patrimonio.git
cd patrimonio

# Backend
cd backend && pip install -e ".[dev]" && cd ..

# Frontend
cd frontend && npm install && cd ..
```

## Fluxo de trabalho

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Escreva código e testes
4. Rode os checks:
   ```bash
   # Backend
   cd backend
   ruff check app tests
   black --check app tests
   pytest

   # Frontend
   cd frontend
   npm run type-check
   npm run lint
   npm test
   ```
5. Commit com [Conventional Commits](https://www.conventionalcommits.org):
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` documentação
   - `test:` testes
   - `refactor:` refatoração
6. Abra um Pull Request

## Padrões de código

- Python: `ruff` + `black` + `mypy --strict`
- TypeScript: `eslint` + `prettier` + `strict: true`
- Sem `any` no TypeScript
- Docstrings Google style em funções públicas Python
- Sem comentários óbvios — apenas WHY quando não trivial

## Fórmulas financeiras

Se adicionar cálculos, documente em `docs/FINANCIAL_MATH.md` com:
- Fórmula em LaTeX
- Referência bibliográfica
- Exemplo numérico
