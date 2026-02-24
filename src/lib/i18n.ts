// ===== i18n: PL / EN =====

export type Locale = "pl" | "en";

export const translations = {
  // --- Header ---
  "header.login": { pl: "Zaloguj", en: "Sign In" },
  "header.signup": { pl: "Wypróbuj za darmo", en: "Try for Free" },
  "header.panel": { pl: "Panel", en: "Dashboard" },

  // --- Sidebar ---
  "sidebar.dashboard": { pl: "Dashboard", en: "Dashboard" },
  "sidebar.settings": { pl: "Ustawienia", en: "Settings" },
  "sidebar.darkMode": { pl: "Tryb ciemny", en: "Dark mode" },
  "sidebar.lightMode": { pl: "Tryb jasny", en: "Light mode" },
  "sidebar.signOut": { pl: "Wyloguj", en: "Sign out" },

  // --- Landing page ---
  "landing.badge": { pl: "Kosztorysy z AI", en: "AI-Powered Cost Estimation" },
  "landing.heroTitle1": { pl: "Kosztorys z PDF", en: "Cost Estimate from PDF" },
  "landing.heroTitle2": { pl: "w 30 minut", en: "in 30 minutes" },
  "landing.heroDesc": {
    pl: "Wrzuć dokumentację budowlaną — sztuczna inteligencja zrobi obmiar i wygeneruje kosztorys. Zamiast 5 dni, dostaniesz wynik w minuty.",
    en: "Upload construction documentation — AI will do the quantity takeoff and generate a cost estimate. Instead of 5 days, you'll get results in minutes.",
  },
  "landing.ctaSignup": { pl: "Wypróbuj za darmo", en: "Try for Free" },
  "landing.ctaLogin": { pl: "Zaloguj się", en: "Sign In" },
  "landing.ctaDashboard": { pl: "Przejdź do panelu", en: "Go to Dashboard" },
  "landing.check1": { pl: "3 wyceny za darmo", en: "3 free estimates" },
  "landing.check2": { pl: "Export do Excela", en: "Excel export" },
  "landing.check3": { pl: "Bez karty kredytowej", en: "No credit card" },
  "landing.howTitle": { pl: "Jak to działa", en: "How It Works" },
  "landing.howSubtitle": {
    pl: "Od PDF do kosztorysu w 3 krokach",
    en: "From PDF to cost estimate in 3 steps",
  },
  "landing.step1Title": { pl: "Wrzuć dokumentację", en: "Upload Documents" },
  "landing.step1Desc": {
    pl: "Przeciągnij rysunki, opisy techniczne, specyfikacje — PDF, DOCX, XLSX.",
    en: "Drag and drop drawings, specifications — PDF, DOCX, XLSX.",
  },
  "landing.step2Title": { pl: "AI analizuje", en: "AI Analyzes" },
  "landing.step2Desc": {
    pl: "GPT-4o czyta dokumentację, identyfikuje elementy i oblicza ilości z cenami referencyjnymi.",
    en: "GPT-4o reads the docs, identifies elements and calculates quantities with reference prices.",
  },
  "landing.step3Title": { pl: "Pobierz kosztorys", en: "Download Estimate" },
  "landing.step3Desc": {
    pl: "Edytuj pozycje, dostosuj ceny i eksportuj gotowy kosztorys do Excela lub PDF.",
    en: "Edit items, adjust prices and export the final estimate to Excel or PDF.",
  },
  "landing.stat1": { pl: "zamiast 5 dni", en: "instead of 5 days" },
  "landing.stat2": { pl: "dokładność AI", en: "AI accuracy" },
  "landing.stat3": { pl: "24/7 dostępny", en: "available 24/7" },
  "landing.stat4": { pl: "export do Excel", en: "Excel export" },
  "landing.ctaTitle": {
    pl: "Zacznij oszczędzać czas już dziś",
    en: "Start saving time today",
  },
  "landing.ctaDesc": {
    pl: "Pierwsze 3 wyceny za darmo. Bez zobowiązań, bez karty kredytowej.",
    en: "First 3 estimates free. No commitment, no credit card.",
  },
  "landing.ctaCreate": { pl: "Stwórz darmowe konto", en: "Create Free Account" },

  // --- Dashboard ---
  "dash.subtitle": { pl: "Twoje kosztorysy AI", en: "Your AI cost estimates" },
  "dash.newEstimate": { pl: "Nowy kosztorys", en: "New Estimate" },
  "dash.empty": { pl: "Brak kosztorysów", en: "No estimates yet" },
  "dash.emptyDesc": {
    pl: "Wrzuć dokumentację (PDF, DOCX, XLSX…), a CostContrl przygotuje kosztorys.",
    en: "Upload documentation (PDF, DOCX, XLSX…) and CostContrl will prepare a cost estimate.",
  },
  "dash.uploadDocs": { pl: "Wrzuć dokumentację", en: "Upload Documentation" },
  "dash.yourEstimates": { pl: "Twoje kosztorysy", en: "Your Estimates" },
  "dash.processing": { pl: "Przetwarzam", en: "Processing" },
  "dash.processingFiles": { pl: "plików", en: "files" },
  "dash.processingDesc": {
    pl: "AI analizuje Twoje dokumenty... to może zająć do 3 minut.",
    en: "AI is analyzing your documents... this may take up to 3 minutes.",
  },
  "dash.cancelConfirm": {
    pl: "Anulować przetwarzanie i usunąć projekt?",
    en: "Cancel processing and delete project?",
  },
  "dash.cancel": { pl: "Anuluj", en: "Cancel" },
  "dash.deleteConfirm": { pl: "Usunąć ten kosztorys?", en: "Delete this estimate?" },
  "dash.error": { pl: "Błąd", en: "Error" },

  // --- Upload card ---
  "upload.title": { pl: "Nowy kosztorys", en: "New Estimate" },
  "upload.projectName": { pl: "Nazwa projektu", en: "Project Name" },
  "upload.projectPlaceholder": {
    pl: "np. Budynek B1 — Gdańsk",
    en: "e.g. Building B1 — Main Street",
  },
  "upload.dropHere": { pl: "Przeciągnij pliki lub kliknij", en: "Drop files or click to browse" },
  "upload.formatsLine1": {
    pl: "<strong>PDF</strong> (rzuty, przekroje) + <strong>DOCX/TXT</strong> (opisy techniczne, PZT) + <strong>XLSX</strong> (zestawienia)",
    en: "<strong>PDF</strong> (floor plans, sections) + <strong>DOCX/TXT</strong> (technical descriptions) + <strong>XLSX</strong> (schedules)",
  },
  "upload.moreDocsHint": {
    pl: "Im więcej dokumentacji wrzucisz, tym dokładniejszy kosztorys ✨",
    en: "The more docs you upload, the more accurate the estimate ✨",
  },
  "upload.filesSelected": { pl: "do analizy:", en: "for analysis:" },
  "upload.creatingProject": { pl: "Tworzę projekt...", en: "Creating project..." },
  "upload.uploadingFiles": { pl: "Wrzucam pliki...", en: "Uploading files..." },
  "upload.noFilesUploaded": {
    pl: "Żaden plik nie został wrzucony pomyślnie",
    en: "No files were uploaded successfully",
  },
  "upload.aiStarting": {
    pl: "— uruchamiam analizę AI...",
    en: "— starting AI analysis...",
  },
  "upload.errorPrefix": { pl: "Błąd", en: "Error" },
  "upload.tryAgain": { pl: "Spróbuj ponownie", en: "Please try again" },
  "upload.formatsLabel": { pl: "Obsługiwane formaty", en: "Supported formats" },
  "upload.analyze": { pl: "Analizuj", en: "Analyze" },
  "upload.andGenerate": { pl: "i generuj kosztorys", en: "and generate estimate" },
  "upload.file": { pl: "plik", en: "file" },
  "upload.files": { pl: "pliki", en: "files" },
  "upload.filesUploaded": { pl: "plików wrzuconych", en: "files uploaded" },

  // --- Estimate page ---
  "est.loading": { pl: "Ładowanie...", en: "Loading..." },
  "est.aiAnalyzing": {
    pl: "AI analizuje Twoje dokumenty...",
    en: "AI is analyzing your documents...",
  },
  "est.aiDesc": {
    pl: "CostContrl czyta dokumentację, identyfikuje elementy i oblicza ilości.",
    en: "CostContrl is reading the docs, identifying elements and calculating quantities.",
  },
  "est.processingMulti": {
    pl: "Przetwarzam {count} plików — to może zająć do 5 minut.",
    en: "Processing {count} files — this may take up to 5 minutes.",
  },
  "est.processingSingle": {
    pl: "To może zająć do 2 minut.",
    en: "This may take up to 2 minutes.",
  },
  "est.totalNet": { pl: "Razem netto", en: "Total net" },
  "est.totalGross": { pl: "Razem brutto (23% VAT)", en: "Total gross (23% VAT)" },
  "est.items": { pl: "Pozycji", en: "Items" },
  "est.categories": { pl: "Kategorii", en: "Categories" },
  "est.addItem": { pl: "Dodaj pozycję", en: "Add Item" },
  "est.moreFiles": { pl: "plików", en: "files" },

  // --- Table headers ---
  "table.no": { pl: "Lp.", en: "No." },
  "table.category": { pl: "Kategoria", en: "Category" },
  "table.description": { pl: "Opis", en: "Description" },
  "table.unit": { pl: "Jedn.", en: "Unit" },
  "table.quantity": { pl: "Ilość", en: "Qty" },
  "table.unitPrice": { pl: "Cena jedn.", en: "Unit Price" },
  "table.value": { pl: "Wartość", en: "Value" },

  // --- Add item form ---
  "form.category": { pl: "Kategoria", en: "Category" },
  "form.description": { pl: "Opis", en: "Description" },
  "form.unit": { pl: "Jednostka", en: "Unit" },
  "form.quantity": { pl: "Ilość", en: "Qty" },
  "form.unitPrice": { pl: "Cena jedn.", en: "Unit Price" },
  "form.add": { pl: "Dodaj", en: "Add" },
  "form.cancel": { pl: "Anuluj", en: "Cancel" },
  "form.newItem": { pl: "Nowa pozycja", en: "New item" },
  "form.other": { pl: "Inne", en: "Other" },
  "form.defaultUnit": { pl: "szt.", en: "pcs" },

  // --- Export ---
  "export.estimate": { pl: "KOSZTORYS", en: "COST ESTIMATE" },
  "export.generated": { pl: "Wygenerowano przez CostContrl AI", en: "Generated by CostContrl AI" },
  "export.netTotal": { pl: "RAZEM NETTO:", en: "TOTAL NET:" },
  "export.vat": { pl: "VAT 23%:", en: "VAT 23%:" },
  "export.grossTotal": { pl: "RAZEM BRUTTO:", en: "TOTAL GROSS:" },
  "export.total": { pl: "RAZEM:", en: "TOTAL:" },
  "export.sheet": { pl: "Kosztorys", en: "Estimate" },
  "export.pdfSubtitle": { pl: "Kosztorys AI", en: "AI Cost Estimate" },
  "export.date": { pl: "Data", en: "Date" },
  "export.itemsLabel": { pl: "Pozycji", en: "Items" },
  "export.categoriesLabel": { pl: "Kategorii", en: "Categories" },
  "export.net": { pl: "Netto:", en: "Net:" },
  "export.gross": { pl: "Brutto:", en: "Gross:" },
  "export.page": { pl: "Strona", en: "Page" },
  "export.unitPriceHeader": { pl: "Cena jedn.", en: "Unit Price" },
  "export.valueHeader": { pl: "Wartość", en: "Value" },

  // --- Auth ---
  "auth.email": { pl: "Email", en: "Email" },
  "auth.password": { pl: "Hasło", en: "Password" },
  "auth.name": { pl: "Imię", en: "Name" },
  "auth.namePlaceholder": { pl: "Twoje imię", en: "Your name" },
  "auth.signIn": { pl: "Zaloguj się", en: "Sign In" },
  "auth.signingIn": { pl: "Logowanie...", en: "Signing in..." },
  "auth.signUp": { pl: "Stwórz konto", en: "Create Account" },
  "auth.creatingAccount": { pl: "Tworzę konto...", en: "Creating account..." },
  "auth.forgotPassword": { pl: "Nie pamiętasz hasła?", en: "Forgot password?" },
  "auth.resetPassword": { pl: "Resetuj hasło", en: "Reset Password" },
  "auth.resetDesc": {
    pl: "Wpisz email, żeby otrzymać kod resetujący",
    en: "Enter your email to receive a reset code",
  },
  "auth.sendCode": { pl: "Wyślij kod", en: "Send Reset Code" },
  "auth.sending": { pl: "Wysyłanie...", en: "Sending..." },
  "auth.backToLogin": { pl: "Powrót do logowania", en: "Back to sign in" },
  "auth.checkEmail": { pl: "Sprawdź email", en: "Check your email" },
  "auth.codeSent": { pl: "Wysłaliśmy kod na", en: "We sent a code to" },
  "auth.resetCode": { pl: "Kod resetujący", en: "Reset Code" },
  "auth.enterCode": { pl: "Wpisz kod", en: "Enter code" },
  "auth.continue": { pl: "Dalej", en: "Continue" },
  "auth.resend": { pl: "Wyślij ponownie", en: "Resend code" },
  "auth.newPassword": { pl: "Nowe hasło", en: "New Password" },
  "auth.setNewPassword": { pl: "Ustaw nowe hasło", en: "Set New Password" },
  "auth.chooseStrong": { pl: "Wybierz silne hasło", en: "Choose a strong password" },
  "auth.resetting": { pl: "Resetowanie...", en: "Resetting..." },
  "auth.resetBtn": { pl: "Zmień hasło", en: "Reset Password" },
  "auth.cancelReset": { pl: "Anuluj", en: "Cancel" },
  "auth.invalidCredentials": { pl: "Nieprawidłowy email lub hasło", en: "Invalid email or password" },
  "auth.resetError": { pl: "Nie udało się wysłać kodu. Spróbuj ponownie.", en: "Could not send reset code. Please try again." },
  "auth.resetExpired": { pl: "Nie udało się zmienić hasła. Kod mógł wygasnąć.", en: "Could not reset password. Code may be expired." },
  "auth.signupError": { pl: "Nie udało się utworzyć konta. Spróbuj ponownie.", en: "Could not create account. Please try again." },
  "auth.verificationCode": { pl: "Kod weryfikacyjny", en: "Verification Code" },
  "auth.verificationSent": { pl: "Wysłaliśmy kod weryfikacyjny na", en: "We sent a verification code to" },
  "auth.verifying": { pl: "Weryfikacja...", en: "Verifying..." },
  "auth.verify": { pl: "Zweryfikuj email", en: "Verify Email" },
  "auth.verifyError": { pl: "Nieprawidłowy lub wygasły kod. Spróbuj ponownie.", en: "Invalid or expired code. Please try again." },
  "auth.backToSignup": { pl: "Powrót do rejestracji", en: "Back to sign up" },
  "auth.minChars": { pl: "Minimum 6 znaków", en: "Must be at least 6 characters" },
  "auth.testUser": { pl: "Kontynuuj jako użytkownik testowy", en: "Continue as Test User" },

  // --- Inline editing ---
  "edit.clickToEdit": { pl: "Kliknij aby edytować", en: "Click to edit" },
  "edit.save": { pl: "Zapisz", en: "Save" },
  "edit.cancel": { pl: "Anuluj", en: "Cancel" },
  "edit.note": { pl: "Notatka", en: "Note" },
  "edit.addNote": { pl: "Dodaj notatkę...", en: "Add note..." },
  "edit.noteTooltip": { pl: "Kliknij aby dodać/edytować notatkę", en: "Click to add/edit note" },
  "edit.enterToSave": { pl: "Enter = zapisz, Esc = anuluj", en: "Enter to save, Esc to cancel" },

  // --- Change history ---
  "history.title": { pl: "Historia zmian", en: "Change History" },
  "history.empty": { pl: "Brak zmian", en: "No changes yet" },
  "history.emptyDesc": {
    pl: "Historia pojawi się po pierwszej edycji.",
    en: "History will appear after first edit.",
  },
  "history.edit": { pl: "Edytowano", en: "Edited" },
  "history.add": { pl: "Dodano", en: "Added" },
  "history.delete": { pl: "Usunięto", en: "Deleted" },
  "history.note": { pl: "Notatka", en: "Note" },
  "history.field.quantity": { pl: "ilość", en: "quantity" },
  "history.field.unitPrice": { pl: "cenę jedn.", en: "unit price" },
  "history.field.description": { pl: "opis", en: "description" },
  "history.field.category": { pl: "kategorię", en: "category" },
  "history.field.unit": { pl: "jednostkę", en: "unit" },
  "history.field.note": { pl: "notatkę", en: "note" },
  "history.from": { pl: "z", en: "from" },
  "history.to": { pl: "na", en: "to" },
  "history.today": { pl: "Dziś", en: "Today" },
  "history.yesterday": { pl: "Wczoraj", en: "Yesterday" },
  "history.showMore": { pl: "Pokaż więcej", en: "Show more" },

  // --- Price templates ---
  "templates.title": { pl: "Cennik referencyjny", en: "Price Templates" },
  "templates.subtitle": {
    pl: "Bazowe ceny materiałów i robocizny",
    en: "Reference material & labor prices",
  },
  "templates.search": { pl: "Szukaj w cenniku...", en: "Search templates..." },
  "templates.allCategories": { pl: "Wszystkie kategorie", en: "All categories" },
  "templates.usePrice": { pl: "Użyj ceny", en: "Use price" },
  "templates.addToEstimate": { pl: "Dodaj do kosztorysu", en: "Add to estimate" },
  "templates.addOwn": { pl: "Dodaj własną pozycję", en: "Add custom template" },
  "templates.source": { pl: "Źródło", en: "Source" },
  "templates.global": { pl: "Cennik ogólny", en: "Global" },
  "templates.user": { pl: "Własne", en: "Custom" },
  "templates.empty": {
    pl: "Brak wyników — spróbuj inną frazę",
    en: "No results — try different keywords",
  },
  "templates.loadTemplates": {
    pl: "Załaduj cennik referencyjny",
    en: "Load reference price list",
  },
  "templates.loadingTemplates": {
    pl: "Ładowanie cennika...",
    en: "Loading templates...",
  },

  // --- GPT-4o Vision ---
  "vision.analyzing": { pl: "Analizuję rysunki...", en: "Analyzing drawings..." },
  "vision.imageFound": {
    pl: "Wykryto rysunki — uruchamiam analizę wizualną",
    en: "Drawings detected — running visual analysis",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export function tReplace(key: TranslationKey, locale: Locale, replacements: Record<string, string | number>): string {
  let text = t(key, locale);
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

export function getDateLocale(locale: Locale): string {
  return locale === "pl" ? "pl-PL" : "en-US";
}

export function getCurrencyLocale(locale: Locale): string {
  return locale === "pl" ? "pl-PL" : "en-US";
}
