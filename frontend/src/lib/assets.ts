export interface AssetOption {
  ticker: string;
  name: string;
  category: "Ações" | "ETFs" | "FIIs";
}

export const ASSETS: AssetOption[] = [
  // ── Ações ──────────────────────────────────────────────────────────────
  { ticker: "PETR4.SA", name: "Petrobras PN",           category: "Ações" },
  { ticker: "PETR3.SA", name: "Petrobras ON",           category: "Ações" },
  { ticker: "VALE3.SA", name: "Vale",                   category: "Ações" },
  { ticker: "ITUB4.SA", name: "Itaú Unibanco PN",       category: "Ações" },
  { ticker: "BBDC4.SA", name: "Bradesco PN",            category: "Ações" },
  { ticker: "BBAS3.SA", name: "Banco do Brasil",        category: "Ações" },
  { ticker: "ABEV3.SA", name: "Ambev",                  category: "Ações" },
  { ticker: "B3SA3.SA", name: "B3",                     category: "Ações" },
  { ticker: "WEGE3.SA", name: "WEG",                    category: "Ações" },
  { ticker: "RENT3.SA", name: "Localiza",               category: "Ações" },
  { ticker: "LREN3.SA", name: "Lojas Renner",           category: "Ações" },
  { ticker: "TOTS3.SA", name: "TOTVS",                  category: "Ações" },
  { ticker: "SUZB3.SA", name: "Suzano",                 category: "Ações" },
  { ticker: "GGBR4.SA", name: "Gerdau PN",              category: "Ações" },
  { ticker: "USIM5.SA", name: "Usiminas PNA",           category: "Ações" },
  { ticker: "EQTL3.SA", name: "Equatorial Energia",     category: "Ações" },
  { ticker: "EGIE3.SA", name: "Engie Brasil",           category: "Ações" },
  { ticker: "CMIG4.SA", name: "Cemig PN",               category: "Ações" },
  { ticker: "ELET3.SA", name: "Eletrobras ON",          category: "Ações" },
  { ticker: "TAEE11.SA", name: "Taesa Units",           category: "Ações" },
  { ticker: "SBSP3.SA", name: "Sabesp",                 category: "Ações" },
  { ticker: "CCRO3.SA", name: "CCR",                    category: "Ações" },
  { ticker: "RAIL3.SA", name: "Rumo",                   category: "Ações" },
  { ticker: "EMBR3.SA", name: "Embraer",                category: "Ações" },
  { ticker: "JBSS3.SA", name: "JBS",                    category: "Ações" },
  { ticker: "BRFS3.SA", name: "BRF",                    category: "Ações" },
  { ticker: "MRVE3.SA", name: "MRV Engenharia",         category: "Ações" },
  { ticker: "CYRE3.SA", name: "Cyrela",                 category: "Ações" },
  { ticker: "MULT3.SA", name: "Multiplan",              category: "Ações" },
  { ticker: "RADL3.SA", name: "Raia Drogasil",          category: "Ações" },
  { ticker: "FLRY3.SA", name: "Fleury",                 category: "Ações" },
  { ticker: "PRIO3.SA", name: "PetroRio",               category: "Ações" },
  { ticker: "CSAN3.SA", name: "Cosan",                  category: "Ações" },
  { ticker: "RDOR3.SA", name: "Rede D'Or",              category: "Ações" },
  { ticker: "HAPV3.SA", name: "Hapvida",                category: "Ações" },

  // ── ETFs ───────────────────────────────────────────────────────────────
  { ticker: "BOVA11.SA", name: "iShares Ibovespa",      category: "ETFs" },
  { ticker: "IVVB11.SA", name: "iShares S&P 500 (BRL)", category: "ETFs" },
  { ticker: "NASD11.SA", name: "Invesco Nasdaq 100",    category: "ETFs" },
  { ticker: "SMAL11.SA", name: "iShares Small Cap BR",  category: "ETFs" },
  { ticker: "GOLD11.SA", name: "iShares Ouro",          category: "ETFs" },
  { ticker: "DIVO11.SA", name: "iShares Dividendos BR", category: "ETFs" },

  // ── FIIs ───────────────────────────────────────────────────────────────
  { ticker: "KNRI11.SA", name: "Kinea Renda Imobiliária",  category: "FIIs" },
  { ticker: "MXRF11.SA", name: "Maxi Renda",               category: "FIIs" },
  { ticker: "HGLG11.SA", name: "CSHG Logística",           category: "FIIs" },
  { ticker: "XPML11.SA", name: "XP Malls",                 category: "FIIs" },
  { ticker: "VISC11.SA", name: "Vinci Shopping Centers",   category: "FIIs" },
  { ticker: "BCFF11.SA", name: "BTG Fundo de Fundos",      category: "FIIs" },
  { ticker: "HGRE11.SA", name: "CSHG Real Estate",         category: "FIIs" },
  { ticker: "XPLG11.SA", name: "XP Log",                   category: "FIIs" },
  { ticker: "BTLG11.SA", name: "BTG Logística",            category: "FIIs" },
];

export const CATEGORIES = ["Ações", "ETFs", "FIIs"] as const;
export type AssetCategory = (typeof CATEGORIES)[number];

export function assetsByCategory(assets: AssetOption[]) {
  const map = new Map<AssetCategory, AssetOption[]>();
  for (const cat of CATEGORIES) map.set(cat, []);
  for (const a of assets) map.get(a.category)!.push(a);
  return map;
}
