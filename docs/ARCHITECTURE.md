# Architecture Decision Records — Patrimônio

## ADR-001: FastAPI over Flask/Django

**Status**: Accepted

**Context**: The backend needs to serve async financial computations, support OpenAPI docs, and validate complex request schemas.

**Decision**: FastAPI with Pydantic v2 and async SQLAlchemy.

**Rationale**:
- Native async support (critical for concurrent API calls to BCB/yfinance)
- Automatic OpenAPI/Swagger generation (portfolio requirement)
- Pydantic v2 provides strict validation with zero boilerplate
- 2–3× faster than Flask for I/O-bound tasks

**Trade-offs**: Steeper learning curve than Flask; less opinionated than Django.

---

## ADR-002: SQLite in development, PostgreSQL-ready in production

**Status**: Accepted

**Context**: This is a portfolio project that may be deployed on free tiers.

**Decision**: SQLite via aiosqlite for dev; the `DATABASE_URL` env var supports PostgreSQL by swapping the scheme.

**Rationale**:
- Zero setup for local development
- SQLAlchemy 2.0 is database-agnostic; migration is one env var change
- Railway/Render offer free PostgreSQL instances for production

**Trade-offs**: SQLite doesn't support concurrent writes well. Acceptable for a single-user portfolio demo.

---

## ADR-003: File-based cache over Redis

**Status**: Accepted

**Context**: Redis adds operational overhead for a portfolio project.

**Decision**: File-based JSON cache with TTL, keyed by SHA256 of inputs.

**Rationale**:
- Zero external dependencies
- Works identically in Docker and bare metal
- TTL enforcement on read (lazy expiry)
- Redis can be added as a drop-in replacement via the same `FileCache` interface

**Trade-offs**: No distributed cache, no pub/sub. Acceptable for single-instance deployment.

---

## ADR-004: Recharts over Plotly.js

**Status**: Accepted

**Context**: Both are capable charting libraries; Plotly is more feature-rich, Recharts is React-native.

**Decision**: Recharts.

**Rationale**:
- Composable React components — no imperative DOM manipulation
- Much smaller bundle size (~120KB vs ~3MB for Plotly)
- Seamless dark mode via CSS variables
- TypeScript support is first-class

**Trade-offs**: Less out-of-the-box interactivity (no range sliders, lasso select). Mitigated by custom tooltips and zoom via ResponsiveContainer.

---

## ADR-005: Zustand over Redux for global state

**Status**: Accepted

**Context**: Need to persist up to 4 user-saved scenarios across pages.

**Decision**: Zustand with `persist` middleware (localStorage).

**Rationale**:
- 1KB vs 15KB for Redux Toolkit
- No boilerplate: one `create()` call
- `persist` middleware handles localStorage serialization
- No Provider wrappers needed

**Trade-offs**: Less tooling/devtools than Redux. Acceptable for this scope.

---

## ADR-006: GBM + Bootstrap for Monte Carlo

**Status**: Accepted

**Context**: Need a robust stochastic model for portfolio projections.

**Decision**: Implement both GBM and Bootstrap, let user choose.

**Rationale**:
- GBM: theoretically grounded, parameterized by (μ, σ), intuitive for users
- Bootstrap: distribution-free, preserves fat tails/skewness from historical data
- Itô correction (`−σ²/2`) ensures the median is consistent with drift
- NumPy vectorization: 10k simulations × 240 months in < 1 second

**Trade-offs**: GBM assumes constant volatility and log-normal returns — neither holds in practice. Bootstrap suffers from look-ahead bias. Both are disclosed to users.

---

## Extensibility Points

| Feature | Current | Extension Path |
|---------|---------|---------------|
| Cache | File JSON | Swap `FileCache` for Redis client |
| Database | SQLite | Change `DATABASE_URL` to PostgreSQL |
| Auth | None | Add JWT middleware to FastAPI |
| Charting | Recharts | Add Plotly for 3D frontier, heatmap |
| Data source | BCB + yfinance | Add B3 direct API, CVM fund data |
| Deploy | Docker | Add Kubernetes manifests |

---

## Data Flow

```
User Input → React Hook Form → Zod validation
    ↓
React Query mutation → axios → FastAPI route
    ↓
Pydantic schema validation → Service layer
    ↓
Financial computation (numpy/scipy)
    ↓
File cache (check/store)
    ↓
Pydantic response serialization → JSON
    ↓
React Query cache → Component re-render → Recharts
```
