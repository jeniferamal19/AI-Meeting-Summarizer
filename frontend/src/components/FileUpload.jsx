import { useRef, useState } from "react";
import { UploadCloud, FileAudio, X, AlertCircle } from "lucide-react";

const DEFAULT_FORMATS = ["mp3", "wav", "m4a", "mp4", "webm", "ogg"];

function formatBytes(bytes) {
  if (bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

/**
 * Self-contained file picker: handles drag/drop, validation, and the
 * selected-file preview. Calls onSubmit(file) once the user confirms.
 */
export default function FileUpload({
  onSubmit,
  maxSizeMB = 25,
  acceptedFormats = DEFAULT_FORMATS,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function validate(file) {
    const ext = getExtension(file.name);
    if (!acceptedFormats.includes(ext)) {
      return `".${ext}" isn't supported. Use ${acceptedFormats.join(", ")}.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `That file is ${formatBytes(file.size)}. The limit is ${maxSizeMB} MB.`;
    }
    return "";
  }

  function handleFile(file) {
    if (!file) return;
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError("");
    setSelectedFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleDrag(e, isOver) {
    e.preventDefault();
    setDragActive(isOver);
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0]);
  }

  function removeFile() {
    setSelectedFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit() {
    if (selectedFile) onSubmit(selectedFile);
  }

  return (
    <div>
      {selectedFile && (
        <div className="file-chip">
          <div className="file-chip__icon">
            <FileAudio size={18} />
          </div>
          <div className="file-chip__meta">
            <div className="file-chip__name">{selectedFile.name}</div>
            <div className="file-chip__size">{formatBytes(selectedFile.size)}</div>
          </div>
          <button
            type="button"
            className="file-chip__remove"
            onClick={removeFile}
            aria-label="Remove selected file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {!selectedFile && (
        <div
          className={`upload-zone ${dragActive ? "upload-zone--active" : ""} ${
            error ? "upload-zone--error" : ""
          }`}
          onDragOver={(e) => handleDrag(e, true)}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
        >
          <div className="upload-zone__icon">
            <UploadCloud size={24} />
          </div>
          <h2 className="upload-zone__title">Drop your meeting recording here</h2>
          <p className="upload-zone__hint">
            or{" "}
            <button
              type="button"
              className="upload-zone__browse"
              onClick={() => inputRef.current?.click()}
            >
              browse your files
            </button>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFormats.map((f) => `.${f}`).join(",")}
            onChange={handleInputChange}
            style={{ display: "none" }}
          />
          <div className="upload-zone__formats">
            {acceptedFormats.join(" · ").toUpperCase()} — up to {maxSizeMB}MB
          </div>
          {error && (
            <div className="upload-zone__error">
              <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
              {error}
            </div>
          )}
        </div>
      )}

      {selectedFile && (
        <button type="button" className="btn btn--primary btn--block" onClick={handleSubmit}>
          Summarize meeting
        </button>
      )}
    </div>
  );
}
