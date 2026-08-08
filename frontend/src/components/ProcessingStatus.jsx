import Waveform from "./Waveform";

const STEPS = [
  { key: "uploading", label: "Upload" },
  { key: "transcribing", label: "Transcribe" },
  { key: "summarizing", label: "Summarize" },
];

const COPY = {
  uploading: {
    label: "Uploading recording…",
    sublabel: "Sending your audio file to the server",
  },
  transcribing: {
    label: "Transcribing audio…",
    sublabel: "Listening closely and converting speech to text",
  },
  summarizing: {
    label: "Extracting the takeaways…",
    sublabel: "Pulling out decisions, action items, and topics",
  },
};

/**
 * stage: "uploading" | "transcribing" | "summarizing"
 * progress: optional 0-100 upload percentage, shown only during "uploading"
 */
export default function ProcessingStatus({ stage = "uploading", progress }) {
  const currentIndex = STEPS.findIndex((s) => s.key === stage);
  const copy = COPY[stage] ?? COPY.uploading;

  return (
    <div className="processing">
      <Waveform active bars={7} />
      <h2 className="processing__label">{copy.label}</h2>
      <p className="processing__sublabel">
        {stage === "uploading" && typeof progress === "number"
          ? `${copy.sublabel} (${progress}%)`
          : copy.sublabel}
      </p>

      <div className="processing__steps">
        {STEPS.map((step, i) => {
          const state =
            i < currentIndex ? "done" : i === currentIndex ? "current" : "pending";
          return (
            <div key={step.key} className={`processing__step processing__step--${state}`}>
              <span className="processing__step-dot" />
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
