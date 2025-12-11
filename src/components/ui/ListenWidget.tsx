"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./ListenWidget.module.css";

/**
 * ListenWidget (refined UX) — removed unexpected `any` types and added safer typing.
 *
 * Key typing changes:
 * - Use a small MediaRecorderStatic type to reference the constructor and isTypeSupported static method.
 * - Use BlobEvent for ondataavailable event parameter.
 * - Avoid casting to `any`; use `unknown` bridge only where necessary.
 */

export type ListenWidgetProps = {
  onClose?: () => void;
  maxRecordingSeconds?: number; // default 120
};

type MediaRecorderStatic = {
  new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
  isTypeSupported?: (mimeType: string) => boolean;
};

export default function ListenWidget({ onClose, maxRecordingSeconds = 120 }: ListenWidgetProps) {
  const [recording, setRecording] = useState(false);
  const [mediaSupported] = useState<boolean>(() => {
    return typeof window !== "undefined" && !!(navigator.mediaDevices && (window as unknown as { MediaRecorder?: MediaRecorderStatic }).MediaRecorder);
  });
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [textFeedback, setTextFeedback] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [consent, setConsent] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
      }
      if (audioURL) {
        try {
          URL.revokeObjectURL(audioURL);
        } catch (err) {
          // non-critical
          // eslint-disable-next-line no-console
          console.warn("revokeObjectURL error", err);
        }
      }
    };
  }, [audioURL]);

  useEffect(() => {
    if (recording && secs >= maxRecordingSeconds) {
      // auto stop at max
      stopRecording();
      setMessage(`Max recording length reached (${maxRecordingSeconds}s).`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, recording, maxRecordingSeconds]);

  const startRecording = async () => {
    setMessage(null);
    if (!mediaSupported) {
      setMessage("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecCtor = (typeof window !== "undefined"
        ? (window as unknown as { MediaRecorder?: MediaRecorderStatic }).MediaRecorder
        : undefined) as MediaRecorderStatic | undefined;

      const mime = (() => {
        try {
          if (mediaRecCtor?.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
          if (mediaRecCtor?.isTypeSupported?.("audio/ogg")) return "audio/ogg";
        } catch (err) {
          // feature-detect errors are non-fatal
          // eslint-disable-next-line no-console
          console.warn("isTypeSupported check failed", err);
        }
        return "audio/webm";
      })();

      if (!mediaRecCtor) {
        setMessage("MediaRecorder not available in this environment.");
        // stop stream tracks if created
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch (stopErr) {
          // eslint-disable-next-line no-console
          console.warn("stop stream error", stopErr);
        }
        return;
      }

      const RecorderCtor = mediaRecCtor;
      const recorder = new RecorderCtor(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];

      // ondataavailable uses BlobEvent
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        try {
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("createObjectURL error", err);
          setAudioURL(null);
        }

        // stop tracks - wrap in try/catch and log any error
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("stop tracks error", err);
        }
      };

      recorder.start();
      setRecording(true);
      setSecs(0);
      timerRef.current = window.setInterval(() => {
        setSecs((s) => s + 1);
      }, 1000) as unknown as number;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("getUserMedia error", err);
      setMessage("Could not access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      recorder.stop();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("stop error", err);
    }
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const discardRecording = () => {
    if (audioURL) {
      try {
        URL.revokeObjectURL(audioURL);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("revokeObjectURL error", err);
      }
    }
    setAudioBlob(null);
    setAudioURL(null);
    setSecs(0);
    setMessage(null);
  };

  const uploadAudio = async () => {
    if (!audioBlob && !textFeedback.trim()) {
      setMessage("Please record or enter a message before sending.");
      return;
    }
    if (!consent) {
      setMessage("Please confirm you consent to submit this recording.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      if (audioBlob) {
        const fd = new FormData();
        fd.append("audio", audioBlob, "recording.webm"); // server should accept/transcode
        fd.append("note", textFeedback);
        fd.append("source", "listen-widget");
        const res = await fetch("/api/feedback", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textFeedback, source: "listen-widget" }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setMessage("Thanks — we received your feedback.");
      discardRecording();
      setTextFeedback("");
      setConsent(false);
      if (onClose) onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("upload error", err);
      setMessage("Upload failed. Try again later.");
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const progressPct = Math.min(100, Math.round((secs / Math.max(1, maxRecordingSeconds)) * 100));

  return (
    <div className={styles.wrapper} role="dialog" aria-modal="true" aria-label="We listen dialog">
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
          <path d="M12 1v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1 }}>
          <div className={styles.title}>We listen</div>
          <div className={styles.subtitle}>Send an audio note or a quick message</div>
        </div>
        <button aria-label="Close" onClick={onClose} className={styles.closeBtn}>
          ×
        </button>
      </div>

      <div className={styles.controls}>
        {mediaSupported ? (
          <>
            <div className={styles.recorder}>
              <div className={styles.recordControls}>
                {!recording && (
                  <button className={styles.recordBtn} onClick={startRecording} aria-pressed="false" aria-label="Start recording" disabled={uploading}>
                    Record
                  </button>
                )}
                {recording && (
                  <button className={styles.stopBtn} onClick={stopRecording} aria-pressed="true" aria-label="Stop recording">
                    Stop
                  </button>
                )}
              </div>

              <div className={styles.timerWrap} aria-live="polite">
                <div className={styles.timer}>{formatTime(secs)}</div>
                <div className={styles.progressBar} aria-hidden>
                  <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                </div>
                <div className={styles.maxLabel}>{maxRecordingSeconds}s</div>
              </div>
            </div>

            <div className={styles.previewRow}>
              {audioURL && (
                <>
                  <audio controls src={audioURL} className={styles.audioPreview} />
                  <button className={styles.discardBtn} onClick={discardRecording} aria-label="Discard recording">
                    Discard
                  </button>
                </>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.uploadBtn} onClick={uploadAudio} disabled={uploading || (!audioBlob && !textFeedback.trim())} aria-disabled={uploading || (!audioBlob && !textFeedback.trim())}>
                {uploading ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.unsupported}>Audio recording not available — use the form below.</div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          uploadAudio();
        }}
        className={styles.form}
      >
        <textarea placeholder="Or type a quick note about your preferences..." value={textFeedback} onChange={(e) => setTextFeedback(e.target.value)} className={styles.textarea} aria-label="Text feedback" />
        <label className={styles.consent}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span className={styles.consentText}>I consent to submit this feedback and understand it may be used to personalize my experience.</span>
        </label>
        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={uploading || (!audioBlob && !textFeedback.trim()) || !consent}>
            {uploading ? "Sending..." : "Send note"}
          </button>
        </div>
      </form>

      {message && (
        <div className={styles.message} role="status">
          {message}
        </div>
      )}
    </div>
  );
}