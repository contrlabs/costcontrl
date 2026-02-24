import { useMutation, useQuery } from "convex/react";
import { Gauge, Plus, Upload, FileText, Loader2, Trash2, Files, FileSpreadsheet } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function DashboardPage() {
  const projects = useQuery(api.projects.list) ?? [];
  const [showUpload, setShowUpload] = useState(false);
  const { t } = useLanguage();

  const activeProject = projects.find(
    (p) => p.status === "processing" || p.status === "uploading"
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const errorProjects = projects.filter((p) => p.status === "error");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <img src="/contrlabs-cube.png" alt="CostContrl" className="size-6" />
            CostContrl
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dash.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-[#102947] hover:bg-[#1a3a5c]"
        >
          <Plus className="size-4" />
          {t("dash.newEstimate")}
        </Button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <UploadCard onClose={() => setShowUpload(false)} />
      )}

      {/* Active processing */}
      {activeProject && (
        <ActiveProjectCard project={activeProject} />
      )}

      {/* Projects list */}
      {completedProjects.length === 0 &&
        errorProjects.length === 0 &&
        !activeProject &&
        !showUpload && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <img src="/contrlabs-cube.png" alt="CostContrl" className="size-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {t("dash.empty")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("dash.emptyDesc")}
              </p>
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-[#102947] hover:bg-[#1a3a5c]"
              >
                <Upload className="size-4" />
                {t("dash.uploadDocs")}
              </Button>
            </CardContent>
          </Card>
        )}

      {(completedProjects.length > 0 || errorProjects.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("dash.yourEstimates")}</h2>
          {[...completedProjects, ...errorProjects].map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveProjectCard({ project }: { project: { _id: Id<"projects">; name: string; fileCount?: number } }) {
  const deleteProject = useMutation(api.projects.remove);
  const [cancelling, setCancelling] = useState(false);
  const { t } = useLanguage();

  return (
    <Card className="border-[#102947]/20 bg-[#102947]/5 dark:bg-[#102947]/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 text-[#102947] dark:text-slate-300 animate-spin" />
            <div>
              <p className="font-medium">
                {t("dash.processing")}: {project.name}
                {project.fileCount && project.fileCount > 1
                  ? ` (${project.fileCount} ${t("dash.processingFiles")})`
                  : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("dash.processingDesc")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-500 shrink-0"
            disabled={cancelling}
            onClick={async () => {
              if (!confirm(t("dash.cancelConfirm"))) return;
              setCancelling(true);
              await deleteProject({ projectId: project._id });
            }}
          >
            {cancelling ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            <span className="ml-1">{t("dash.cancel")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadCard({ onClose }: { onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileStatuses, setFileStatuses] = useState<Record<number, "pending" | "uploading" | "done" | "error">>({});
  const [uploadedCount, setUploadedCount] = useState(0);
  const createProject = useMutation(api.projects.create);
  const addFile = useMutation(api.projects.addFile);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const { t, locale } = useLanguage();

  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt", ".rtf", ".odt", ".ods"];
  const ALLOWED_LABEL = "PDF, DOCX, XLSX, TXT, RTF, ODT";

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => {
      const name = f.name.toLowerCase();
      return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    });
    if (validFiles.length === 0) {
      alert(`${t("upload.formatsLabel")}: ${ALLOWED_LABEL}`);
      return;
    }
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (!projectName && validFiles.length > 0) {
      const name = validFiles[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setProjectName(name);
    }
  }, [projectName, t]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    fileIndex: number,
    projectId: string,
  ): Promise<string | null> => {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 90_000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        setFileStatuses((prev) => ({ ...prev, [fileIndex]: "uploading" }));

        const uploadUrl = await generateUploadUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Upload HTTP ${response.status}`);

        const { storageId } = await response.json();
        await addFile({
          projectId: projectId as any,
          fileName: file.name,
          fileId: storageId,
        });

        setFileStatuses((prev) => ({ ...prev, [fileIndex]: "done" }));
        setUploadedCount((prev) => prev + 1);
        return storageId;
      } catch (err) {
        console.warn(`Upload attempt ${attempt + 1} failed for ${file.name}:`, err);
        if (attempt === MAX_RETRIES - 1) {
          setFileStatuses((prev) => ({ ...prev, [fileIndex]: "error" }));
          return null;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return null;
  }, [generateUploadUrl, addFile]);

  const uploadFilesParallel = useCallback(async (
    files: File[],
    projectId: string,
    concurrency: number = 3,
  ): Promise<string[]> => {
    const results: (string | null)[] = new Array(files.length).fill(null);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < files.length) {
        const i = nextIndex++;
        results[i] = await uploadSingleFile(files[i], i, projectId);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
    await Promise.all(workers);
    return results.filter((id): id is string => id !== null);
  }, [uploadSingleFile]);

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadedCount(0);
    const initStatuses: Record<number, "pending"> = {};
    selectedFiles.forEach((_, i) => { initStatuses[i] = "pending"; });
    setFileStatuses(initStatuses);

    try {
      const name = projectName || selectedFiles[0].name.replace(/\.[^.]+$/, "");

      setUploadProgress(t("upload.creatingProject"));
      const projectId = await createProject({
        name,
        fileName: selectedFiles.length === 1
          ? selectedFiles[0].name
          : `${selectedFiles.length} ${locale === "pl" ? "plików" : "files"}`,
      });

      setUploadProgress(t("upload.uploadingFiles"));
      const fileIds = await uploadFilesParallel(selectedFiles, projectId as string, 3);

      if (fileIds.length === 0) {
        throw new Error(t("upload.noFilesUploaded"));
      }

      setUploadProgress(`✅ ${fileIds.length}/${selectedFiles.length} ${t("upload.filesUploaded")} ${t("upload.aiStarting")}`);
      const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
      const siteUrl = convexUrl.replace(".convex.cloud", ".convex.site");
      await fetch(`${siteUrl}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileId: fileIds[0],
        }),
      });

      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      alert(`${t("upload.errorPrefix")}: ${error instanceof Error ? error.message : t("upload.tryAgain")}`);
    } finally {
      setUploading(false);
      setUploadProgress("");
      setFileStatuses({});
    }
  }, [selectedFiles, projectName, createProject, uploadFilesParallel, onClose, t, locale]);

  const fileCountLabel = selectedFiles.length === 1
    ? `1 ${t("upload.file")}`
    : `${selectedFiles.length} ${t("upload.files")}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{t("upload.title")}</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project name */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            {t("upload.projectName")}
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t("upload.projectPlaceholder")}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#102947] bg-background"
          />
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
            ${dragOver ? "border-[#102947] bg-[#102947]/5 dark:bg-[#102947]/20" : "border-muted-foreground/25 hover:border-[#102947]/40"}
            ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => {
            if (uploading) return;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.docx,.doc,.xlsx,.xls,.txt,.rtf,.odt,.ods";
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) addFiles(files);
            };
            input.click();
          }}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="size-10 text-[#102947] dark:text-slate-300 animate-spin mx-auto" />
              <p className="text-sm font-medium">{uploadProgress}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="size-8 text-[#102947] mx-auto" />
              <div>
                <p className="font-medium">{t("upload.dropHere")}</p>
                <p
                  className="text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: t("upload.formatsLine1") }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("upload.moreDocsHint")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Files className="size-4 text-[#102947] dark:text-slate-300" />
              {uploading
                ? `${uploadedCount}/${selectedFiles.length} ${t("upload.filesUploaded")}`
                : `${fileCountLabel} ${t("upload.filesSelected")}`}
            </p>
            {uploading && selectedFiles.length > 1 && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#102947] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, (uploadedCount / selectedFiles.length) * 100)}%` }}
                />
              </div>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, idx) => {
                const status = fileStatuses[idx];
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors ${
                      status === "done" ? "bg-green-50 dark:bg-green-950/20"
                      : status === "error" ? "bg-red-50 dark:bg-red-950/20"
                      : status === "uploading" ? "bg-[#102947]/5 dark:bg-[#102947]/20"
                      : "bg-muted/50"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {status === "done" ? (
                        <span className="size-3.5 shrink-0 text-green-600">✓</span>
                      ) : status === "error" ? (
                        <span className="size-3.5 shrink-0 text-red-500">✗</span>
                      ) : status === "uploading" ? (
                        <Loader2 className="size-3.5 shrink-0 text-[#102947] dark:text-slate-300 animate-spin" />
                      ) : file.name.toLowerCase().match(/\.xlsx?$/) ? (
                        <FileSpreadsheet className="size-3.5 text-green-600 shrink-0" />
                      ) : (
                        <FileText className={`size-3.5 shrink-0 ${file.name.toLowerCase().endsWith(".pdf") ? "text-[#102947] dark:text-slate-300" : "text-blue-600"}`} />
                      )}
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`})
                      </span>
                    </span>
                    {!uploading && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="text-muted-foreground hover:text-red-500 ml-2 shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit button */}
        {selectedFiles.length > 0 && !uploading && (
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#102947] hover:bg-[#1a3a5c]"
            size="lg"
          >
            <Gauge className="size-4" />
            {t("upload.analyze")} {fileCountLabel} {t("upload.andGenerate")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    _id: Id<"projects">;
    name: string;
    fileName: string;
    status: string;
    totalCost?: number;
    createdAt: number;
    errorMessage?: string;
    fileCount?: number;
  };
}) {
  const deleteProject = useMutation(api.projects.remove);
  const [deleting, setDeleting] = useState(false);
  const { t, currencyLocale, dateLocale } = useLanguage();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: "PLN",
    }).format(amount);

  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Link
            to={`/estimate/${project._id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div
              className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                project.status === "completed"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {project.fileCount && project.fileCount > 1 ? (
                <Files className={`size-5 ${project.status === "completed" ? "text-green-600" : "text-red-500"}`} />
              ) : (
                <FileText className={`size-5 ${project.status === "completed" ? "text-green-600" : "text-red-500"}`} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{project.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(project.createdAt)}
                {project.fileCount && project.fileCount > 1
                  ? ` · ${project.fileCount} ${t("dash.processingFiles")}`
                  : ""}
                {project.status === "error" && (
                  <span className="text-red-500 ml-2">
                    {t("dash.error")}: {project.errorMessage}
                  </span>
                )}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            {project.totalCost !== undefined && (
              <span className="font-semibold text-[#102947] dark:text-slate-300">
                {formatCurrency(project.totalCost)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-red-500"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!confirm(t("dash.deleteConfirm"))) return;
                setDeleting(true);
                await deleteProject({ projectId: project._id });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
