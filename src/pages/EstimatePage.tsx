import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t as translate } from "@/lib/i18n";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// --- Format helpers ---

function fmtCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtNum(n: number, locale = "pl-PL"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type LineItem = {
  _id: Id<"lineItems">;
  position: number;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sourceFile?: string;
  note?: string;
  confidence?: "high" | "medium" | "low";
};

type ChangeLogEntry = {
  _id: string;
  action: "edit" | "add" | "delete" | "note";
  field?: string;
  oldValue?: string;
  newValue?: string;
  itemDescription?: string;
  timestamp: number;
};

// --- Export: XLSX ---

async function exportXLSX(
  projectName: string,
  items: LineItem[],
  totalCost: number,
  locale: Locale
) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const T = (k: Parameters<typeof translate>[0]) => translate(k, locale);

  const data: (string | number)[][] = [
    [`${T("export.estimate")} — ${projectName}`],
    [
      T("export.generated"),
      new Date().toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US"),
    ],
    [],
    [
      T("table.no"),
      T("table.category"),
      T("table.description"),
      T("table.unit"),
      T("table.quantity"),
      `${T("table.unitPrice")} (PLN)`,
      `${T("table.value")} (PLN)`,
      T("edit.note"),
      T("confidence.label"),
    ],
  ];

  items.forEach((item, i) => {
    data.push([
      i + 1,
      item.category,
      item.description,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      item.note ?? "",
      item.confidence === "high" ? T("confidence.high") : item.confidence === "low" ? T("confidence.low") : T("confidence.medium"),
    ]);
  });

  data.push([]);
  data.push(["", "", "", "", "", T("export.netTotal"), totalCost]);
  data.push(["", "", "", "", "", T("export.vat"), totalCost * 0.23]);
  data.push(["", "", "", "", "", T("export.grossTotal"), totalCost * 1.23]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 45 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  const sheetName = T("export.sheet");
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(
    wb,
    `CostContrl_${projectName}_${sheetName.toLowerCase()}.xlsx`
  );
}

// --- Export: PDF ---

async function exportPDF(
  projectName: string,
  items: LineItem[],
  totalCost: number,
  categoryMap: Record<string, LineItem[]>,
  locale: Locale
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const T = (k: Parameters<typeof translate>[0]) => translate(k, locale);
  const dateLoc = locale === "pl" ? "pl-PL" : "en-US";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(16, 41, 71);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("CostContrl", 15, 15);
  doc.setFontSize(10);
  doc.text(T("export.pdfSubtitle"), 15, 22);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(projectName, 15, 40);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${T("export.date")}: ${new Date().toLocaleDateString(dateLoc)}`,
    15,
    47
  );
  doc.text(
    `${T("export.itemsLabel")}: ${items.length} | ${T("export.categoriesLabel")}: ${Object.keys(categoryMap).length}`,
    15,
    52
  );

  doc.setFillColor(230, 236, 242);
  doc.setDrawColor(16, 41, 71);
  doc.roundedRect(120, 33, 75, 24, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(T("export.net"), 125, 40);
  doc.text(T("export.vat"), 125, 46);
  doc.text(T("export.gross"), 125, 52);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(fmtNum(totalCost) + " PLN", 160, 40, { align: "left" });
  doc.text(fmtNum(totalCost * 0.23) + " PLN", 160, 46, { align: "left" });
  doc.setFontSize(11);
  doc.setTextColor(16, 41, 71);
  doc.text(fmtNum(totalCost * 1.23) + " PLN", 160, 53, { align: "left" });

  const tableData = items.map((item, i) => [
    String(i + 1),
    item.category,
    item.description,
    item.unit,
    fmtNum(item.quantity),
    fmtNum(item.unitPrice),
    fmtNum(item.totalPrice),
  ]);

  autoTable(doc, {
    startY: 62,
    head: [
      [
        T("table.no"),
        T("table.category"),
        T("table.description"),
        T("table.unit"),
        T("table.quantity"),
        T("export.unitPriceHeader"),
        `${T("export.valueHeader")} (PLN)`,
      ],
    ],
    body: tableData,
    foot: [["", "", "", "", "", T("export.total"), fmtNum(totalCost)]],
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: {
      fillColor: [16, 41, 71],
      textColor: 255,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [230, 236, 242],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 60 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `CostContrl AI | ${T("export.page")} ${i}/${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  doc.save(
    `CostContrl_${projectName}_${T("export.sheet").toLowerCase()}.pdf`
  );
}

// =====================================================
// INLINE EDITABLE CELL
// =====================================================

function InlineEdit({
  value,
  onSave,
  type = "text",
  className = "",
  align = "left",
}: {
  value: string;
  onSave: (val: string) => void;
  type?: "text" | "number";
  className?: string;
  align?: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (draft !== value) {
      onSave(draft);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`h-7 text-sm ${align === "right" ? "text-right" : ""} ${className}`}
        step={type === "number" ? "0.01" : undefined}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors text-sm ${className}`}
      title={translate("edit.clickToEdit", "pl")}
    >
      {value}
    </span>
  );
}

// =====================================================
// NOTE POPOVER (inline)
// =====================================================

function NoteEditor({
  note,
  onSave,
}: {
  note: string;
  onSave: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(note);
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setDraft(note);
          setOpen(!open);
        }}
        className={`size-6 rounded flex items-center justify-center transition-colors ${
          note
            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
        }`}
        title={note || t("edit.addNote")}
      >
        {note ? (
          <StickyNote className="size-3.5" />
        ) : (
          <MessageSquare className="size-3" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-popover border rounded-lg shadow-lg p-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("edit.note")}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("edit.addNote")}
            className="w-full h-20 text-sm border rounded-md p-2 resize-none bg-background"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              {t("edit.cancel")}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-[#102947] hover:bg-[#1a3a5c]"
              onClick={() => {
                onSave(draft);
                setOpen(false);
              }}
            >
              {t("edit.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CHANGE HISTORY PANEL
// =====================================================

function ChangeHistoryPanel({
  projectId,
  open,
  onClose,
}: {
  projectId: Id<"projects">;
  open: boolean;
  onClose: () => void;
}) {
  const history = useQuery(
    api.changeLog.listByProject,
    open ? { projectId } : "skip"
  );
  const { t, locale } = useLanguage();
  const [showCount, setShowCount] = useState(30);

  if (!open) return null;

  const fieldLabel = (field: string): string => {
    const key = `history.field.${field}` as TranslationKey;
    return t(key) || field;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString(locale === "pl" ? "pl-PL" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `${t("history.today")} ${time}`;
    if (isYesterday) return `${t("history.yesterday")} ${time}`;
    return `${d.toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" })} ${time}`;
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case "edit":
        return <Pencil className="size-3 text-blue-500" />;
      case "add":
        return <Plus className="size-3 text-green-500" />;
      case "delete":
        return <Trash2 className="size-3 text-red-500" />;
      case "note":
        return <StickyNote className="size-3 text-amber-500" />;
      default:
        return <Clock className="size-3" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#102947] dark:text-slate-300" />
          <h3 className="font-semibold">{t("history.title")}</h3>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!history || history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="size-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t("history.empty")}</p>
            <p className="text-sm mt-1">{t("history.emptyDesc")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.slice(0, showCount).map((entry: ChangeLogEntry) => (
              <div
                key={entry._id}
                className="flex gap-3 py-2 px-2 rounded hover:bg-muted/40 transition-colors"
              >
                <div className="mt-0.5">{actionIcon(entry.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">
                      {t(`history.${entry.action}` as TranslationKey)}
                    </span>{" "}
                    {entry.field && (
                      <span className="text-muted-foreground">
                        {fieldLabel(entry.field)}
                      </span>
                    )}
                    {entry.itemDescription && (
                      <span className="text-muted-foreground">
                        {" "}
                        — <span className="italic">{entry.itemDescription?.substring(0, 40)}</span>
                      </span>
                    )}
                  </p>
                  {entry.action === "edit" && entry.oldValue && entry.newValue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="line-through opacity-60">
                        {entry.oldValue}
                      </span>{" "}
                      → <span className="font-medium">{entry.newValue}</span>
                    </p>
                  )}
                  {entry.action === "note" && entry.newValue && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">
                      &quot;{entry.newValue.substring(0, 60)}&quot;
                    </p>
                  )}
                  {entry.action === "delete" && entry.oldValue && (
                    <p className="text-xs text-red-400 mt-0.5 line-through">
                      {entry.oldValue}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {formatTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {history.length > showCount && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowCount((c) => c + 30)}
              >
                {t("history.showMore")} ({history.length - showCount})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// PRICE TEMPLATE PANEL
// =====================================================

function PriceTemplatePanel({
  projectId,
  open,
  onClose,
}: {
  projectId: Id<"projects">;
  open: boolean;
  onClose: () => void;
}) {
  const templates = useQuery(api.priceTemplates.list, open ? {} : "skip");
  const seedTemplates = useMutation(api.priceTemplates.seedGlobalTemplates);
  const addItem = useMutation(api.lineItems.addItem);
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  if (!open) return null;

  const filteredTemplates = (templates ?? []).filter((tmpl) => {
    const matchSearch =
      !search ||
      tmpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || tmpl.category === selectedCat;
    return matchSearch && matchCat;
  });

  const categories = [...new Set((templates ?? []).map((t) => t.category))].sort();

  const handleSeed = async () => {
    setSeeding(true);
    await seedTemplates({});
    setSeeding(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-background border-l shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-[#102947] dark:text-slate-300" />
          <div>
            <h3 className="font-semibold text-sm">{t("templates.title")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {t("templates.subtitle")}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Search + filter */}
      <div className="px-4 py-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("templates.search")}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={selectedCat === null ? "default" : "outline"}
            size="sm"
            className={`h-6 text-[11px] shrink-0 ${selectedCat === null ? "bg-[#102947]" : ""}`}
            onClick={() => setSelectedCat(null)}
          >
            {t("templates.allCategories")}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCat === cat ? "default" : "outline"}
              size="sm"
              className={`h-6 text-[11px] shrink-0 ${selectedCat === cat ? "bg-[#102947]" : ""}`}
              onClick={() => setSelectedCat(cat === selectedCat ? null : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {!templates || templates.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BookOpen className="size-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">
              {t("templates.empty")}
            </p>
            <Button
              size="sm"
              className="bg-[#102947] hover:bg-[#1a3a5c]"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  {t("templates.loadingTemplates")}
                </>
              ) : (
                t("templates.loadTemplates")
              )}
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t("templates.empty")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl._id}
                className="px-4 py-2.5 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {tmpl.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tmpl.category} · {tmpl.unit} ·{" "}
                      <span className="font-medium text-[#102947] dark:text-slate-300">
                        {fmtNum(tmpl.unitPrice)} PLN
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={async () => {
                      await addItem({
                        projectId,
                        category: tmpl.category,
                        description: tmpl.description,
                        unit: tmpl.unit,
                        quantity: 1,
                        unitPrice: tmpl.unitPrice,
                      });
                    }}
                  >
                    <Plus className="size-3" />
                    {t("templates.addToEstimate")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// CONFIDENCE BADGE
// =====================================================

const confidenceConfig = {
  high: {
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  medium: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    dot: "bg-red-500",
  },
} as const;

function ConfidenceBadge({ level, locale }: { level: "high" | "medium" | "low"; locale: string }) {
  const cfg = confidenceConfig[level];
  const labels: Record<string, Record<string, string>> = {
    high: { pl: "Pewna", en: "High" },
    medium: { pl: "Szacunkowa", en: "Estimated" },
    low: { pl: "Niska", en: "Low" },
  };
  const tooltips: Record<string, Record<string, string>> = {
    high: { pl: "Dane z dokumentacji", en: "From documentation" },
    medium: { pl: "Oszacowano z parametrów budynku", en: "Estimated from building parameters" },
    low: { pl: "Wymaga weryfikacji", en: "Needs verification" },
  };
  const lang = locale === "pl" ? "pl" : "en";

  return (
    <span
      title={tooltips[level][lang]}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.color} cursor-help`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {labels[level][lang]}
    </span>
  );
}

// =====================================================
// EDITABLE ROW
// =====================================================

function EditableRow({ item }: { item: LineItem }) {
  const updateItem = useMutation(api.lineItems.update);
  const removeItem = useMutation(api.lineItems.removeItem);
  const { currencyLocale } = useLanguage();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fmtPLN = (amount: number) => fmtCurrency(amount, currencyLocale);

  return (
    <>
      <TableRow className="group">
        <TableCell className="text-muted-foreground text-xs w-8">
          <div className="flex items-center gap-1.5">
            <span>{item.position}</span>
            {item.confidence && (
              <ConfidenceBadge level={item.confidence} locale={currencyLocale.startsWith("pl") ? "pl" : "en"} />
            )}
          </div>
        </TableCell>
        <TableCell>
          <InlineEdit
            value={item.description}
            onSave={(val) =>
              updateItem({ itemId: item._id, description: val })
            }
          />
        </TableCell>
        <TableCell>
          <InlineEdit
            value={item.unit}
            onSave={(val) => updateItem({ itemId: item._id, unit: val })}
            className="w-14"
          />
        </TableCell>
        <TableCell className="text-right">
          <InlineEdit
            value={String(item.quantity)}
            type="number"
            align="right"
            onSave={(val) =>
              updateItem({
                itemId: item._id,
                quantity: Number.parseFloat(val) || item.quantity,
              })
            }
            className="w-20"
          />
        </TableCell>
        <TableCell className="text-right">
          <InlineEdit
            value={String(item.unitPrice)}
            type="number"
            align="right"
            onSave={(val) =>
              updateItem({
                itemId: item._id,
                unitPrice: Number.parseFloat(val) || item.unitPrice,
              })
            }
            className="w-24"
          />
        </TableCell>
        <TableCell className="text-right font-medium text-sm">
          {fmtPLN(item.totalPrice)}
        </TableCell>
        <TableCell>
          <div className="flex gap-0.5 items-center">
            <NoteEditor
              note={item.note ?? ""}
              onSave={(val) => updateItem({ itemId: item._id, note: val })}
            />
            {confirmDelete ? (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-red-500 hover:text-red-700"
                  onClick={() => {
                    removeItem({ itemId: item._id });
                    setConfirmDelete(false);
                  }}
                >
                  <Check className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setConfirmDelete(false)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {/* Note preview row */}
      {item.note && (
        <TableRow className="border-0">
          <TableCell />
          <TableCell
            colSpan={6}
            className="pt-0 pb-1 -mt-2 text-[11px] text-amber-600 dark:text-amber-400 italic"
          >
            <StickyNote className="size-3 inline mr-1 -mt-0.5" />
            {item.note}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// =====================================================
// ADD ITEM CARD
// =====================================================

function AddItemCard({ projectId }: { projectId: Id<"projects"> }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const [form, setForm] = useState({
    category: "",
    description: "",
    unit: t("form.defaultUnit"),
    quantity: "",
    unitPrice: "",
    note: "",
  });
  const addItem = useMutation(api.lineItems.addItem);

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        {t("est.addItem")}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("est.addItem")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Input
            placeholder={t("form.category")}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            placeholder={t("form.description")}
            className="col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            placeholder={t("form.unit")}
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <Input
            placeholder={t("form.quantity")}
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <Input
            placeholder={t("form.unitPrice")}
            type="number"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
          />
        </div>
        <Input
          placeholder={t("edit.addNote")}
          className="mt-2"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="bg-[#102947] hover:bg-[#1a3a5c]"
            onClick={async () => {
              await addItem({
                projectId,
                category: form.category || t("form.other"),
                description: form.description || t("form.newItem"),
                unit: form.unit || t("form.defaultUnit"),
                quantity: Number.parseFloat(form.quantity) || 1,
                unitPrice: Number.parseFloat(form.unitPrice) || 0,
                note: form.note || undefined,
              });
              setForm({
                category: "",
                description: "",
                unit: t("form.defaultUnit"),
                quantity: "",
                unitPrice: "",
                note: "",
              });
              setOpen(false);
            }}
          >
            {t("form.add")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("form.cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// CATEGORY SECTION (collapsible)
// =====================================================

function CategorySection({
  category,
  items,
  fmtPLN,
}: {
  category: string;
  items: LineItem[];
  fmtPLN: (n: number) => string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();
  const catTotal = items.reduce((s, i) => s + i.totalPrice, 0);

  return (
    <Card>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
            {category}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({items.length})
            </span>
          </span>
          <span className="text-sm font-semibold text-[#102947] dark:text-slate-300">
            {fmtPLN(catTotal)}
          </span>
        </CardTitle>
      </CardHeader>
      {!collapsed && (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">{t("table.no")}</TableHead>
                <TableHead>{t("table.description")}</TableHead>
                <TableHead className="w-16">{t("table.unit")}</TableHead>
                <TableHead className="w-24 text-right">
                  {t("table.quantity")}
                </TableHead>
                <TableHead className="w-28 text-right">
                  {t("table.unitPrice")}
                </TableHead>
                <TableHead className="w-28 text-right">
                  {t("table.value")}
                </TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <EditableRow key={item._id} item={item} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export function EstimatePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useQuery(
    api.projects.get,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const lineItems = useQuery(
    api.lineItems.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const { t, tr, locale, currencyLocale } = useLanguage();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  if (!project) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-[#102947] dark:text-slate-300" />
        <p className="mt-2 text-muted-foreground">{t("est.loading")}</p>
      </div>
    );
  }

  if (project.status === "processing") {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4 mt-12">
        <img
          src="/contrlabs-cube.png"
          alt="CostContrl"
          className="size-16 mx-auto animate-pulse opacity-40"
        />
        <h2 className="text-xl font-bold">{t("est.aiAnalyzing")}</h2>
        <p className="text-muted-foreground">
          {t("est.aiDesc")}
          {project.fileCount && project.fileCount > 1
            ? ` ${tr("est.processingMulti", { count: project.fileCount })}`
            : ` ${t("est.processingSingle")}`}
        </p>
        <Loader2 className="size-6 animate-spin mx-auto text-[#102947] dark:text-slate-300" />
      </div>
    );
  }

  const sortedItems = [...(lineItems ?? [])].sort(
    (a, b) => a.position - b.position
  ) as LineItem[];

  const categories = sortedItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, LineItem[]>
  );

  const totalCost = project.totalCost ?? 0;
  const fmtPLN = (amount: number) => fmtCurrency(amount, currencyLocale);
  const notesCount = sortedItems.filter((i) => i.note).length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.fileName}
            {project.fileCount && project.fileCount > 1
              ? ` (+${project.fileCount - 1} ${t("est.moreFiles")})`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplatesOpen(true)}
            title={t("templates.title")}
          >
            <BookOpen className="size-4" />
            <span className="hidden md:inline">{t("templates.title")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            title={t("history.title")}
          >
            <History className="size-4" />
            <span className="hidden md:inline">{t("history.title")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportXLSX(project.name, sortedItems, totalCost, locale)
            }
            disabled={!sortedItems.length}
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportPDF(
                project.name,
                sortedItems,
                totalCost,
                categories,
                locale
              )
            }
            disabled={!sortedItems.length}
          >
            <FileText className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#102947] dark:text-slate-300">
              {fmtPLN(totalCost)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("est.totalNet")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{fmtPLN(totalCost * 1.23)}</p>
            <p className="text-xs text-muted-foreground">
              {t("est.totalGross")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{sortedItems.length}</p>
            <p className="text-xs text-muted-foreground">{t("est.items")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {Object.keys(categories).length}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("est.categories")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{notesCount}</p>
            <p className="text-xs text-muted-foreground">{t("edit.note")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category sections */}
      {Object.entries(categories).map(([category, items]) => (
        <CategorySection
          key={category}
          category={category}
          items={items}
          fmtPLN={fmtPLN}
        />
      ))}

      {/* Add item */}
      {projectId && (
        <AddItemCard projectId={projectId as Id<"projects">} />
      )}

      {/* Side panels */}
      <ChangeHistoryPanel
        projectId={projectId as Id<"projects">}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
      <PriceTemplatePanel
        projectId={projectId as Id<"projects">}
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />

      {/* Overlay for side panels */}
      {(historyOpen || templatesOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => {
            setHistoryOpen(false);
            setTemplatesOpen(false);
          }}
        />
      )}
    </div>
  );
}
