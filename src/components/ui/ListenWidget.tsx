import React, { useState, useRef } from "react";
import styles from "./ListenWidget.module.css";

/**
 * ListenWidget
 * - Small widget that records audio (MediaRecorder) or accepts text feedback.
 * - Exported named + default so both `import { ListenWidget }` and `import ListenWidget` work.
 */
export type ListenWidgetProps = {
  onClose?: () => void;
};

export function ListenWidget({ onClose }: ListenWidgetProps) {
  const [recording, setRecording] = useState(false);
  const [mediaSupported] = useState<boolean>(() => !!(typeof window !== "undefined" && navigator.mediaDevices && window.MediaRecorder));
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [textFeedback, setTextFeedback] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [secs, setSecs] = useState(0);

  const startRecording = async () => {
    setMessage(null);
    if (!mediaSupported) {
      setMessage("Audio recording not supported.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = (() => {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
        if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
        return "audio/webm";
      })();
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
      setSecs(0);
      timerRef.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    } catch (err) {
      console.error("getUserMedia error", err);
      setMessage("Could not access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      setMessage("No audio to upload.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "recording.webm");
      fd.append("source", "listen-widget");
      fd.append("note", textFeedback ?? "");
      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Thank you — feedback received.");
      setAudioBlob(null);
      setAudioURL(null);
      setTextFeedback("");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Try again later.");
    } finally {
      setUploading(false);
    }
  };

  const submitText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textFeedback?.trim()) {
      setMessage("Please write something or record audio.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ text: textFeedback, source: "listen-widget" }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Thank you — feedback received.");
      setTextFeedback("");
    } catch (err) {
      console.error(err);
      setMessage("Submit failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.wrapper} aria-live="polite">
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
          <path d="M12 1v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <div className={styles.title}>We listen</div>
          <div className={styles.subtitle}>Send an audio note or a quick message</div>
        </div>
        <button aria-label="Close" onClick={onClose} className={styles.closeBtn}>×</button>
      </div>

      <div className={styles.controls}>
        {mediaSupported ? (
          <>
            <div className={styles.recorder}>
              {!recording && (
                <button className={styles.recordBtn} onClick={startRecording}>Record</button>
              )}
              {recording && (
                <button className={styles.stopBtn} onClick={stopRecording}>Stop ({secs}s)</button>
              )}
              {audioURL && <audio controls src={audioURL} className={styles.audioPreview} />}
            </div>

            <div className={styles.actions}>
              <button className={styles.uploadBtn} onClick={uploadAudio} disabled={uploading || !audioBlob}>
                {uploading ? "Uploading..." : "Upload audio"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.unsupported}>Audio not available — use the form below.</div>
        )}
      </div>

      <form onSubmit={submitText} className={styles.form}>
        <textarea placeholder="Or type a quick note..." value={textFeedback} onChange={(e) => setTextFeedback(e.target.value)} className={styles.textarea} />
        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={uploading}>
            {uploading ? "Sending..." : "Send note"}
          </button>
        </div>
      </form>

      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
}

export default ListenWidget;