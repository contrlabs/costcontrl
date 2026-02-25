import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

declare const process: { env: Record<string, string | undefined> };

const VIKTOR_API_URL = process.env.VIKTOR_SPACES_API_URL!;
const PROJECT_NAME = process.env.VIKTOR_SPACES_PROJECT_NAME!;
const PROJECT_SECRET = process.env.VIKTOR_SPACES_PROJECT_SECRET!;

// =====================================================
// TOOL CALL (for file_to_markdown only)
// =====================================================
async function callTool<T>(
  role: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(
    `${VIKTOR_API_URL}/api/viktor-spaces/tools/call`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: PROJECT_NAME,
        project_secret: PROJECT_SECRET,
        role,
        arguments: args,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? "Tool call failed");
  }
  return json.result as T;
}

// =====================================================
// GPT-4o CLIENT
// =====================================================
async function getOpenAIKey(ctx: any): Promise<string> {
  // Try env var first, then fall back to appSettings table
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) return envKey;

  const setting = await ctx.runQuery(internal.appSettings.internalGet, { key: "OPENAI_API_KEY" });
  if (setting) return setting;

  throw new Error("OPENAI_API_KEY not set — configure via env variable or appSettings");
}

function getOpenAI(apiKey: string) {
  return new OpenAI({ apiKey });
}

async function gpt4o(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const openai = getOpenAI(apiKey);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 8000,
    ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content ?? "";
}

// =====================================================
// POLISH CONSTRUCTION REFERENCE PRICING (2025/2026)
// =====================================================
const REFERENCE_PRICES = `
REFERENCYJNE CENY BUDOWLANE POLSKA 2025/2026 (PLN netto):

KOSZTY CAŁKOWITE wg typu budynku (PLN/m² PUM):
- Budynek wielorodzinny (standard): 4 500 - 6 500 PLN/m²
- Budynek wielorodzinny (podwyższony): 6 500 - 9 000 PLN/m²
- Budynek jednorodzinny: 4 000 - 7 000 PLN/m²
- Budynek biurowy: 5 000 - 8 000 PLN/m²
- Hala produkcyjna/magazynowa: 2 500 - 4 500 PLN/m²

PRZYKŁADOWE CENY JEDNOSTKOWE:
Roboty ziemne:
- Wykopy fundamentowe mechaniczne: 45-85 PLN/m³
- Zasypki piaskiem z zagęszczeniem: 65-120 PLN/m³
- Wywóz gruntu: 35-65 PLN/m³

Fundamenty:
- Beton podkładowy C12/15: 350-450 PLN/m³
- Beton C25/30 fundamenty: 550-750 PLN/m³
- Zbrojenie stal BSt500S: 7-10 PLN/kg
- Izolacja przeciwwilgociowa: 35-65 PLN/m²
- Płyta fundamentowa żelbetowa 30cm: 380-520 PLN/m²

Konstrukcja żelbetowa:
- Słupy żelbetowe: 1 800-2 800 PLN/m³
- Belki żelbetowe: 2 000-3 200 PLN/m³
- Stropy żelbetowe monolityczne 20-25cm: 280-420 PLN/m²
- Stropy prefabrykowane (płyty HC): 250-380 PLN/m²
- Schody żelbetowe: 1 200-2 200 PLN/m²
- Ściany żelbetowe: 450-750 PLN/m²

Ściany murowane:
- Bloczki silikatowe 24cm: 160-220 PLN/m²
- Bloczki Ytong 24cm: 170-240 PLN/m²
- Ściany działowe 12cm: 100-160 PLN/m²

Dach:
- Konstrukcja więźby dachowej: 180-320 PLN/m²
- Dachówka ceramiczna z montażem: 160-280 PLN/m²
- Dach płaski (papa termozgrzewalna): 120-220 PLN/m²
- Obróbki blacharskie: 80-180 PLN/mb
- Rynny i rury spustowe: 90-180 PLN/mb

Stolarka:
- Okna PCV 3-szybowe: 800-1 500 PLN/m²
- Okna aluminiowe: 1 200-2 500 PLN/m²
- Drzwi wejściowe aluminiowe: 4 500-12 000 PLN/szt.
- Drzwi wewnętrzne z ościeżnicą: 800-2 200 PLN/szt.
- Brama garażowa segmentowa: 4 500-9 000 PLN/szt.

Izolacja termiczna:
- Styropian 15cm + klej + tynk (ETICS): 140-220 PLN/m²
- Styropian 20cm + klej + tynk (ETICS): 170-260 PLN/m²
- Wełna mineralna 20cm: 80-140 PLN/m²
- XPS fundamenty: 90-160 PLN/m²

Wykończenie:
- Tynki gipsowe maszynowe: 45-70 PLN/m²
- Gładź gipsowa: 25-45 PLN/m²
- Malowanie 2x: 18-35 PLN/m²
- Płytki ceramiczne (podłoga): 120-250 PLN/m²
- Płytki ceramiczne (ściany łazienka): 140-280 PLN/m²
- Panele podłogowe: 80-160 PLN/m²
- Wylewka betonowa: 45-75 PLN/m²

Instalacje (za m² PUM):
- Elektryczna kompletna: 180-350 PLN/m²
- Wod-kan kompletna: 120-250 PLN/m²
- Centralnego ogrzewania: 150-300 PLN/m²
- Wentylacja mechaniczna: 100-250 PLN/m²
- Fotowoltaika: 3 500-5 500 PLN/kWp
- Pompa ciepła (powietrzna): 35 000-65 000 PLN/kpl.

Elementy zewnętrzne:
- Elewacja tynkowa (kompletna): 180-320 PLN/m²
- Elewacja klinkierowa: 350-550 PLN/m²
- Balkon/taras: 800-1 500 PLN/m²
- Parking naziemny: 150-350 PLN/m²
- Drogi wewnętrzne/chodniki: 120-280 PLN/m²

Prefabrykaty betonowe:
- Ściany prefabrykowane: 400-700 PLN/m²
- Płyty stropowe HC (sprężone): 250-400 PLN/m²
- Słupy prefabrykowane: 1 500-3 000 PLN/szt.
- Belki prefabrykowane: 300-600 PLN/mb
- Schody prefabrykowane: 2 000-5 000 PLN/bieg
`;

// =====================================================
// BRANCH STRUCTURE (official Polish cost estimate categories)
// =====================================================
const BRANCH_CATEGORIES = `
STRUKTURA BRANŻOWA KOSZTORYSU:

BRANŻA OGÓLNOBUDOWLANA:
- Roboty ziemne i przygotowawcze
- Fundamenty
- Konstrukcja żelbetowa (słupy, belki, stropy, schody)
- Ściany nośne i działowe
- Dach / Stropodach
- Stolarka okienna i drzwiowa
- Izolacja termiczna i przeciwwilgociowa
- Tynki i okładziny wewnętrzne
- Posadzki i podłogi
- Elewacja

BRANŻA SANITARNA:
- Instalacja wod-kan
- Instalacja CO / ogrzewanie
- Wentylacja i klimatyzacja
- Instalacja gazowa (jeśli dotyczy)

BRANŻA ELEKTRYCZNA:
- Instalacja elektryczna i oświetleniowa
- Instalacja niskoprądowa (teletechniczna)

ROBOTY ZEWNĘTRZNE:
- Zagospodarowanie terenu
- Przyłącza mediów
- Drogi, parkingi, chodniki
- Zieleń i mała architektura
`;

// =====================================================
// ESTIMATION PIPELINE — GPT-4o POWERED
// =====================================================

export const processEstimate = action({
  args: {
    projectId: v.id("projects"),
    fileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { projectId, fileId }) => {
    const project = await ctx.runQuery(internal.estimation.internalGetProject, { projectId });
    if (!project) throw new Error("Project not found");
    const userId = project.userId;

    // Get API key (env var or appSettings table)
    const apiKey = await getOpenAIKey(ctx);

    await ctx.runMutation(internal.estimation.internalUpdateStatus, {
      projectId,
      status: "processing",
    });

    try {
      // ============================
      // STEP 1: Get all project files
      // ============================
      const projectFiles = await ctx.runQuery(internal.estimation.internalGetProjectFiles, { projectId });

      const filesToProcess: Array<{ fileName: string; fileUrl: string; fileId?: string }> = [];

      for (const pf of projectFiles) {
        const url = await ctx.storage.getUrl(pf.fileId);
        if (url) {
          filesToProcess.push({ fileName: pf.fileName, fileUrl: url, fileId: pf._id });
        }
      }

      if (filesToProcess.length === 0 && fileId) {
        const url = await ctx.storage.getUrl(fileId);
        if (url) {
          filesToProcess.push({ fileName: project.fileName, fileUrl: url });
        }
      }

      if (filesToProcess.length === 0) {
        throw new Error("Brak plików do analizy");
      }

      // ============================
      // STEP 2: Extract text from all files (parallel)
      // ============================
      const extractionPromises = filesToProcess.map(async (file) => {
        try {
          if (file.fileId) {
            await ctx.runMutation(internal.estimation.internalUpdateFileStatus, {
              fileId: file.fileId as any,
              status: "processing",
            });
          }

          const markdownResult = await callTool<{ markdown?: string; content?: string }>(
            "file_to_markdown",
            { file_path: file.fileUrl }
          );

          const content = markdownResult.markdown || markdownResult.content || "";

          if (file.fileId) {
            await ctx.runMutation(internal.estimation.internalUpdateFileStatus, {
              fileId: file.fileId as any,
              status: "analyzed",
              extractedText: content.substring(0, 10000),
            });
          }

          return { fileName: file.fileName, content, success: true };
        } catch (err) {
          console.error(`Error extracting ${file.fileName}:`, err);
          if (file.fileId) {
            await ctx.runMutation(internal.estimation.internalUpdateFileStatus, {
              fileId: file.fileId as any,
              status: "error",
            });
          }
          return { fileName: file.fileName, content: `[Nie udało się wyodrębnić tekstu z: ${file.fileName}]`, success: false };
        }
      });

      const allTexts = await Promise.all(extractionPromises);
      const fileCount = allTexts.length;

      console.log(`Extracted text from ${fileCount} files. Lengths: ${allTexts.map(t => `${t.fileName}=${t.content.length}`).join(", ")}`);

      // ============================
      // STEP 3: Classify files + build context
      // ============================
      const textDocExtensions = [".docx", ".doc", ".txt", ".rtf", ".odt", ".xlsx", ".xls", ".ods"];
      const textDocs = allTexts.filter(t => textDocExtensions.some(ext => t.fileName.toLowerCase().endsWith(ext)));
      const drawingDocs = allTexts.filter(t => !textDocExtensions.some(ext => t.fileName.toLowerCase().endsWith(ext)));

      // Allocate context budget: text docs get priority
      const maxChars = 50000; // GPT-4o can handle much more
      const textBudget = textDocs.length > 0 ? Math.floor(maxChars * 0.6) : 0;
      const drawingBudget = maxChars - textBudget;
      const charsPerTextDoc = textDocs.length > 0 ? Math.floor(textBudget / textDocs.length) : 0;
      const charsPerDrawing = drawingDocs.length > 0 ? Math.floor(drawingBudget / drawingDocs.length) : 0;

      let combinedContext = "";
      if (textDocs.length > 0) {
        combinedContext += "

=== DOKUMENTACJA TEKSTOWA (opisy techniczne, specyfikacje) ===";
        for (const { fileName, content } of textDocs) {
          combinedContext += `

--- PLIK: ${fileName} [OPIS TECHNICZNY] ---
${content.substring(0, charsPerTextDoc)}`;
        }
      }
      if (drawingDocs.length > 0) {
        combinedContext += "

=== RYSUNKI / RZUTY (wyodrębniony tekst z PDF) ===";
        for (const { fileName, content } of drawingDocs) {
          combinedContext += `

--- PLIK: ${fileName} [RYSUNEK] ---
${content.substring(0, charsPerDrawing)}`;
        }
      }

      // ============================
      // STEP 4: GPT-4o Pass 1 — Analyze building
      // ============================
      console.log("GPT-4o Pass 1: Building analysis...");

      const analysisSystem = `Jesteś doświadczonym polskim kosztorysantem budowlanym z 20-letnim stażem. Analizujesz dokumentację budowlaną i identyfikujesz kluczowe parametry inwestycji.

Odpowiadaj zawsze po polsku, zwięźle i konkretnie. Podawaj liczby tam gdzie to możliwe.`;

      const analysisUser = `Przeanalizuj poniższą dokumentację budowlaną (${fileCount} plików: ${textDocs.length} dokumentów tekstowych + ${drawingDocs.length} rysunków/PDF).

Określ:
1. TYP BUDYNKU (wielorodzinny/jednorodzinny/biurowy/hala/komercyjny/inny)
2. POWIERZCHNIA UŻYTKOWA (m² PUM) — szacunkowa na podstawie dokumentacji
3. POWIERZCHNIA ZABUDOWY (m²) — jeśli można określić
4. LICZBA KONDYGNACJI (nadziemne + podziemne)
5. LOKALIZACJA (jeśli wspomniana)
6. STANDARD WYKOŃCZENIA (podstawowy/podwyższony/premium)
7. TECHNOLOGIA (tradycyjna/prefabrykowana/szkieletowa/mieszana)
8. ZAKRES BRANŻOWY widoczny w dokumentacji (architektura, konstrukcja, instalacje sanitarne, elektryczne, etc.)
9. SPECYFICZNE MATERIAŁY wymienione w dokumentacji
10. ELEMENTY SPECJALNE (windy, garaż podziemny, fotowoltaika, pompy ciepła, etc.)

Nazwy plików: ${allTexts.map(t => t.fileName).join(", ")}

DOKUMENTACJA:
${combinedContext.substring(0, 30000)}

Odpowiedz zwięźle — max 500 słów. Podawaj KONKRETNE LICZBY.`;

      let buildingAnalysis: string;
      try {
        buildingAnalysis = await gpt4o(apiKey, analysisSystem, analysisUser, { temperature: 0.1, maxTokens: 1500 });
      } catch (err) {
        console.error("GPT-4o analysis failed:", err);
        buildingAnalysis = "Budynek wielorodzinny, szacowana powierzchnia 1200 m² PUM, 4 kondygnacje, standard podstawowy, technologia tradycyjna.";
      }

      console.log("Building analysis:", buildingAnalysis.substring(0, 500));

      // ============================
      // STEP 5: GPT-4o Pass 2 — Per-file analysis (parallel for multi-file)
      // ============================
      console.log("GPT-4o Pass 2: Per-file cost analysis...");

      const perFileSystem = `Jesteś doświadczonym polskim kosztorysantem budowlanym. Na podstawie analizy budynku i jednego pliku dokumentacji generujesz pozycje kosztorysowe.

KONTEKST BUDYNKU:
${buildingAnalysis}

${REFERENCE_PRICES}

ZASADY:
1. Generuj pozycje kosztorysowe TYLKO z tego co widać w tym konkretnym pliku
2. Używaj REALISTYCZNYCH cen polskich 2025/2026 z referencji powyżej
3. Ilości muszą odpowiadać RZECZYWISTYM wymiarom budynku
4. Każda pozycja musi mieć: category, description, unit, quantity, unitPrice, branch, confidence
5. branch = "ogolnobudowlana" | "sanitarna" | "elektryczna" | "zewnetrzna"
6. confidence = "high" | "medium" | "low" — ocena pewności pozycji:
   - "high" = ilość i cena bezpośrednio z dokumentacji (wymiary, specyfikacja materiału)
   - "medium" = ilość oszacowana z parametrów budynku, cena z referencji
   - "low" = brak danych w dokumencie, pozycja uzupełniona na podstawie doświadczenia

Odpowiedz WYŁĄCZNIE poprawnym JSON:
{"items": [{"category":"...","description":"...","unit":"m²","quantity":100,"unitPrice":250,"branch":"ogolnobudowlana","confidence":"medium"}]}`;

      type PartialEstimate = {
        items: Array<{
          category: string;
          description: string;
          unit: string;
          quantity: number;
          unitPrice: number;
          branch?: string;
          confidence?: "high" | "medium" | "low";
        }>;
      };

      let allPartialItems: Array<{
        category: string;
        description: string;
        unit: string;
        quantity: number;
        unitPrice: number;
        branch: string;
        sourceFile: string;
        confidence: "high" | "medium" | "low";
      }> = [];

      if (fileCount <= 3) {
        // For few files: analyze each separately in parallel
        const perFilePromises = allTexts.map(async ({ fileName, content }) => {
          const fileContent = content.substring(0, 20000);
          if (fileContent.length < 50) return []; // Skip empty files

          try {
            const result = await gpt4o(apiKey, 
              perFileSystem,
              `Plik: ${fileName}

Zawartość:
${fileContent}

Wygeneruj pozycje kosztorysowe z tego pliku.`,
              { jsonMode: true, temperature: 0.15, maxTokens: 4000 }
            );
            const parsed: PartialEstimate = JSON.parse(result);
            return (parsed.items || []).map(item => ({
              ...item,
              branch: item.branch || "ogolnobudowlana",
              sourceFile: fileName,
              confidence: item.confidence || "medium",
            }));
          } catch (err) {
            console.error(`Per-file analysis failed for ${fileName}:`, err);
            return [];
          }
        });

        const perFileResults = await Promise.all(perFilePromises);
        allPartialItems = perFileResults.flat();
      } else {
        // For many files: batch into combined context (more efficient)
        try {
          const result = await gpt4o(apiKey, 
            perFileSystem,
            `Dokumentacja (${fileCount} plików):
${combinedContext.substring(0, 45000)}

Wygeneruj KOMPLETNY kosztorys (40-60 pozycji) obejmujący WSZYSTKIE branże widoczne w dokumentacji. Przy każdej pozycji w polu "sourceFile" podaj nazwę pliku źródłowego.`,
            { jsonMode: true, temperature: 0.15, maxTokens: 8000 }
          );
          const parsed: PartialEstimate = JSON.parse(result);
          allPartialItems = (parsed.items || []).map(item => ({
            ...item,
            branch: item.branch || "ogolnobudowlana",
            sourceFile: (item as any).sourceFile || allTexts[0]?.fileName || "",
            confidence: (item as any).confidence || "medium",
          }));
        } catch (err) {
          console.error("Batch analysis failed:", err);
        }
      }

      console.log(`Per-file analysis: ${allPartialItems.length} raw items`);

      // ============================
      // STEP 6: GPT-4o Pass 3 — Merge, dedupe, validate
      // ============================
      if (allPartialItems.length > 0) {
        console.log("GPT-4o Pass 3: Merge & dedupe & validate...");

        const mergeSystem = `Jesteś doświadczonym polskim kosztorysantem budowlanym. Twoje zadanie:

1. POŁĄCZ zduplikowane pozycje (np. "ściany z bloczków" z dwóch plików = jedna pozycja ze zsumowaną ilością)
2. USUŃ oczywiste duplikaty (te same roboty policzone podwójnie z różnych plików)
3. UZUPEŁNIJ brakujące kategorie — kosztorys MUSI zawierać ALL of these branches/categories
4. ZWALIDUJ ceny i ilości — czy są realistyczne dla tego budynku?
5. POSORTUJ według struktury branżowej

ANALIZA BUDYNKU:
${buildingAnalysis}

${BRANCH_CATEGORIES}

${REFERENCE_PRICES}

KRYTYCZNA WALIDACJA:
- Budynek wielorodzinny ~1500 m²: łącznie 6.5-10M PLN netto
- Budynek wielorodzinny ~3000 m²: łącznie 13-20M PLN netto  
- Budynek jednorodzinny ~150 m²: łącznie 600K-1.1M PLN netto
- Hala ~2000 m²: łącznie 5-9M PLN netto
- Sprawdź czy SUMA jest realistyczna. Jeśli nie — skoryguj ceny/ilości.

WYMAGANE minimum 30 pozycji, optymalnie 40-60.

Odpowiedz WYŁĄCZNIE poprawnym JSON:
{"items":[{"position":1,"branch":"ogolnobudowlana","category":"...","description":"...","unit":"m²","quantity":100,"unitPrice":250,"sourceFile":"...","confidence":"medium"}],"summary":{"totalNetto":0,"area":0,"costPerM2":0,"buildingType":"","notes":""},"mergeLog":["Połączono: X + Y → Z"]}

Dla confidence zachowaj wartości z pozycji wejściowych. Jeśli łączysz pozycje z różnym confidence, użyj niższego.`;

        try {
          const mergeResult = await gpt4o(apiKey, 
            mergeSystem,
            `Pozycje do połączenia i walidacji (${allPartialItems.length} pozycji z ${fileCount} plików):

${JSON.stringify(allPartialItems, null, 0).substring(0, 30000)}`,
            { jsonMode: true, temperature: 0.1, maxTokens: 8000 }
          );

          const merged = JSON.parse(mergeResult);
          if (merged.items && Array.isArray(merged.items) && merged.items.length >= 5) {
            allPartialItems = merged.items.map((item: any) => ({
              category: `[${(item.branch || "ogolnobudowlana").toUpperCase()}] ${item.category || "Inne"}`,
              description: item.description || "Pozycja kosztorysu",
              unit: item.unit || "kpl.",
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              branch: item.branch || "ogolnobudowlana",
              sourceFile: item.sourceFile || "",
              confidence: item.confidence || "medium",
            }));

            if (merged.mergeLog) {
              console.log("Merge log:", merged.mergeLog.join("; "));
            }
            if (merged.summary) {
              console.log("Summary:", JSON.stringify(merged.summary));
            }
          }
        } catch (err) {
          console.error("Merge step failed, using raw items:", err);
        }
      }

      // ============================
      // STEP 7: Final validation — cost/m² check
      // ============================
      if (allPartialItems.length > 0) {
        let totalCostCheck = allPartialItems.reduce((sum, item) => {
          return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        }, 0);

        const areaMatch = buildingAnalysis.match(/(\d[\d\s,.]*)\s*m²/);
        const estimatedArea = areaMatch ? parseFloat(areaMatch[1].replace(/[\s,]/g, "").replace(",", ".")) : 0;

        if (estimatedArea > 100 && totalCostCheck > 0) {
          const costPerM2 = totalCostCheck / estimatedArea;
          console.log(`Final validation: ${totalCostCheck.toLocaleString()} PLN / ${estimatedArea} m² = ${costPerM2.toFixed(0)} PLN/m²`);

          if (costPerM2 < 3500) {
            const scaleFactor = 4500 / costPerM2;
            console.log(`Scaling up prices by ${scaleFactor.toFixed(2)}x (cost/m² too low)`);
            allPartialItems = allPartialItems.map(item => ({
              ...item,
              unitPrice: Math.round(Number(item.unitPrice) * scaleFactor),
              // Downgrade confidence when auto-scaling prices
              confidence: item.confidence === "high" ? "medium" : "low",
            }));
          }
        }
      }

      // Fallback if everything failed
      if (allPartialItems.length === 0) {
        console.log("All AI steps failed, using realistic fallback");
        allPartialItems = generateRealisticFallback(buildingAnalysis).map(item => ({
          ...item,
          branch: "ogolnobudowlana",
          confidence: "low" as const,
        }));
      }

      // ============================
      // STEP 8: Save results
      // ============================
      await ctx.runMutation(internal.estimation.internalClearLineItems, { projectId });

      let totalCost = 0;
      for (let i = 0; i < allPartialItems.length; i++) {
        const item = allPartialItems[i];
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const total = Math.round(qty * price * 100) / 100;
        totalCost += total;

        await ctx.runMutation(internal.estimation.internalAddLineItem, {
          projectId,
          userId,
          position: i + 1,
          category: String(item.category || "Inne"),
          description: String(item.description || "Pozycja kosztorysu"),
          unit: String(item.unit || "kpl."),
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          sourceFile: String(item.sourceFile || allTexts[0]?.fileName || ""),
          confidence: item.confidence || "medium",
        });
      }

      await ctx.runMutation(internal.estimation.internalUpdateStatus, {
        projectId,
        status: "completed",
        totalCost: Math.round(totalCost * 100) / 100,
      });

      console.log(`✅ Estimation complete: ${allPartialItems.length} items, total: ${totalCost.toLocaleString()} PLN`);

    } catch (error) {
      console.error("Estimation error:", error);
      await ctx.runMutation(internal.estimation.internalUpdateStatus, {
        projectId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Estimation failed",
      });
    }
  },
});

// =====================================================
// REALISTIC FALLBACK
// =====================================================
function generateRealisticFallback(analysis: string) {
  const areaMatch = analysis.match(/(\d[\d\s,.]*)\s*m²/);
  const rawArea = areaMatch ? parseFloat(areaMatch[1].replace(/[\s,]/g, "").replace(",", ".")) : 0;
  const area = rawArea > 50 ? rawArea : 1200;

  const floors = (analysis.match(/(\d+)\s*(kondygnacj|pięt|pieter)/i) || [])[1];
  const floorCount = floors ? parseInt(floors) : 4;

  const footprint = area / floorCount;
  const perimeterEst = Math.sqrt(footprint) * 4 * 1.3;
  const wallArea = perimeterEst * 3.0 * floorCount;
  const roofArea = footprint * 1.15;

  return [
    { category: "[OGOLNOBUDOWLANA] Roboty ziemne", description: "Wykopy fundamentowe mechaniczne z odwozem", unit: "m³", quantity: Math.round(footprint * 0.8), unitPrice: 75, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Roboty ziemne", description: "Zasypki piaskiem z zagęszczeniem", unit: "m³", quantity: Math.round(footprint * 0.3), unitPrice: 95, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Fundamenty", description: "Płyta fundamentowa żelbetowa C30/37 gr. 30cm", unit: "m²", quantity: Math.round(footprint), unitPrice: 450, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Fundamenty", description: "Zbrojenie fundamentów stal BSt500S", unit: "kg", quantity: Math.round(footprint * 12), unitPrice: 8.5, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Fundamenty", description: "Izolacja przeciwwilgociowa fundamentów", unit: "m²", quantity: Math.round(footprint * 1.3), unitPrice: 55, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Konstrukcja żelbetowa", description: "Słupy żelbetowe C30/37", unit: "m³", quantity: Math.round(floorCount * 8), unitPrice: 2400, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Konstrukcja żelbetowa", description: "Belki żelbetowe C30/37", unit: "m³", quantity: Math.round(floorCount * 6), unitPrice: 2800, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Konstrukcja żelbetowa", description: "Stropy żelbetowe monolityczne gr. 22cm", unit: "m²", quantity: Math.round(footprint * floorCount), unitPrice: 350, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Konstrukcja żelbetowa", description: "Schody żelbetowe", unit: "kpl.", quantity: floorCount, unitPrice: 8500, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Ściany nośne i działowe", description: "Ściany nośne z bloczków silikatowych 24cm", unit: "m²", quantity: Math.round(wallArea * 0.6), unitPrice: 195, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Ściany nośne i działowe", description: "Ściany działowe z bloczków 12cm", unit: "m²", quantity: Math.round(area * 0.8), unitPrice: 130, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Dach / Stropodach", description: "Stropodach — izolacja + papa termozgrzewalna", unit: "m²", quantity: Math.round(roofArea), unitPrice: 280, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Dach / Stropodach", description: "Obróbki blacharskie attyki", unit: "mb", quantity: Math.round(perimeterEst), unitPrice: 140, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Stolarka", description: "Okna PCV trzyszybowe z montażem", unit: "m²", quantity: Math.round(area * 0.15), unitPrice: 1200, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Stolarka", description: "Drzwi wejściowe do budynku aluminiowe", unit: "szt.", quantity: 2, unitPrice: 8500, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Stolarka", description: "Drzwi wewnętrzne z ościeżnicą", unit: "szt.", quantity: Math.round(area / 15), unitPrice: 1400, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Izolacja termiczna", description: "Ocieplenie ścian styropian 20cm (ETICS)", unit: "m²", quantity: Math.round(wallArea * 0.7), unitPrice: 220, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Izolacja termiczna", description: "Ocieplenie fundamentów XPS 12cm", unit: "m²", quantity: Math.round(perimeterEst * 1.2), unitPrice: 130, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Tynki i okładziny", description: "Tynki gipsowe maszynowe", unit: "m²", quantity: Math.round(area * 2.8), unitPrice: 55, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Tynki i okładziny", description: "Gładzie gipsowe + malowanie 2x", unit: "m²", quantity: Math.round(area * 2.8), unitPrice: 45, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Tynki i okładziny", description: "Płytki ceramiczne łazienki", unit: "m²", quantity: Math.round(area * 0.25), unitPrice: 220, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Posadzki", description: "Wylewki samopoziomujące", unit: "m²", quantity: Math.round(area), unitPrice: 65, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Posadzki", description: "Panele podłogowe / parkiet", unit: "m²", quantity: Math.round(area * 0.6), unitPrice: 130, sourceFile: "fallback" },
    { category: "[OGOLNOBUDOWLANA] Elewacja", description: "Tynk silikonowy elewacyjny", unit: "m²", quantity: Math.round(wallArea * 0.7), unitPrice: 45, sourceFile: "fallback" },
    { category: "[SANITARNA] Instalacja wod-kan", description: "Instalacja wod-kan kompletna", unit: "m²", quantity: Math.round(area), unitPrice: 185, sourceFile: "fallback" },
    { category: "[SANITARNA] Instalacja wod-kan", description: "Biały montaż (umywalki, WC, wanny)", unit: "kpl.", quantity: Math.round(area / 65), unitPrice: 4500, sourceFile: "fallback" },
    { category: "[SANITARNA] Instalacja CO", description: "Ogrzewanie podłogowe", unit: "m²", quantity: Math.round(area), unitPrice: 180, sourceFile: "fallback" },
    { category: "[SANITARNA] Instalacja CO", description: "Węzeł cieplny / kotłownia", unit: "kpl.", quantity: 1, unitPrice: Math.round(area * 50), sourceFile: "fallback" },
    { category: "[SANITARNA] Wentylacja", description: "Wentylacja mechaniczna z rekuperacją", unit: "m²", quantity: Math.round(area), unitPrice: 160, sourceFile: "fallback" },
    { category: "[ELEKTRYCZNA] Instalacja elektryczna", description: "Instalacja elektryczna kompletna", unit: "m²", quantity: Math.round(area), unitPrice: 260, sourceFile: "fallback" },
    { category: "[ELEKTRYCZNA] Instalacja elektryczna", description: "Rozdzielnice, tablice, ochrona ppoż.", unit: "kpl.", quantity: 1, unitPrice: Math.round(area * 35), sourceFile: "fallback" },
    { category: "[ZEWNETRZNA] Zagospodarowanie terenu", description: "Parking naziemny", unit: "m²", quantity: Math.round(area * 0.3), unitPrice: 250, sourceFile: "fallback" },
    { category: "[ZEWNETRZNA] Zagospodarowanie terenu", description: "Chodniki i dojścia", unit: "m²", quantity: Math.round(perimeterEst * 2), unitPrice: 180, sourceFile: "fallback" },
    { category: "[ZEWNETRZNA] Przyłącza", description: "Przyłącza mediów komplet", unit: "kpl.", quantity: 1, unitPrice: 45000, sourceFile: "fallback" },
  ];
}

// =====================================================
// INTERNAL QUERIES / MUTATIONS
// =====================================================

export const internalGetProject = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db.get(projectId);
  },
});

export const internalGetProjectFiles = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const internalUpdateStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error")
    ),
    totalCost: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, status, totalCost, errorMessage }) => {
    const patch: Record<string, unknown> = { status };
    if (totalCost !== undefined) patch.totalCost = totalCost;
    if (errorMessage !== undefined) patch.errorMessage = errorMessage;
    if (status === "completed") patch.completedAt = Date.now();
    await ctx.db.patch(projectId, patch);
  },
});

export const internalUpdateFileStatus = internalMutation({
  args: {
    fileId: v.id("projectFiles"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("analyzed"),
      v.literal("error")
    ),
    extractedText: v.optional(v.string()),
    analysisResult: v.optional(v.string()),
  },
  handler: async (ctx, { fileId, status, extractedText, analysisResult }) => {
    const patch: Record<string, unknown> = { status };
    if (extractedText !== undefined) patch.extractedText = extractedText;
    if (analysisResult !== undefined) patch.analysisResult = analysisResult;
    await ctx.db.patch(fileId, patch);
  },
});

export const internalClearLineItems = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const items = await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

export const internalAddLineItem = internalMutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    position: v.number(),
    category: v.string(),
    description: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    sourceFile: v.optional(v.string()),
    confidence: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("lineItems", args);
  },
});
