import { AlertTriangle } from "lucide-react";
import { useState } from "react";

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem("disclaimer-dismissed") === "true"
  );

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 border-b bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 md:px-6">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p className="flex-1">
        <strong>Aviso:</strong> Este aplicativo tem caráter exclusivamente educacional. Não constitui
        recomendação de investimento, oferta de produto financeiro ou consultoria. Retornos passados
        não garantem retornos futuros. Consulte um profissional certificado (CVM).
      </p>
      <button
        onClick={() => {
          sessionStorage.setItem("disclaimer-dismissed", "true");
          setDismissed(true);
        }}
        className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
        aria-label="Fechar aviso"
      >
        OK
      </button>
    </div>
  );
}
