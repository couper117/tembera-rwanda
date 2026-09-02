"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { updateAvatarAction } from "@/lib/actions/user";
// The same initials the overview shows. Two rules for one thing is how "G"
// and "GU" end up on the same person in two places.
import { initialsOf } from "@/lib/client/account";

/**
 * Changing your profile photo, for real.
 *
 * The whole thing happens in the browser and what leaves it is already the
 * finished square: the file is drawn to a canvas at the position and zoom the
 * reader chose, exported as a JPEG, and sent as a data URI. That is why there
 * is a crop step at all — not for polish, but because a phone photo is three
 * megabytes and portrait, and storing that to render at 96 pixels would be
 * absurd.
 *
 * `capture` on the file input is what gives a phone the camera option; on a
 * desktop the same input is an ordinary file picker, which is why there is one
 * control rather than two that do different things on different devices.
 */

/** What gets stored, and what every avatar renders from. */
const OUTPUT = 256;
/** Enough for a face at 2x on a retina screen; small enough to sit in a row. */
const QUALITY = 0.82;

type Status = "idle" | "saving" | "saved" | "error";

export default function AvatarPicker({
  initial,
  name,
  onChange,
}: {
  initial: string | null;
  /** For the initials fallback and the alt text. */
  name: string;
  onChange?: (next: string | null) => void;
}) {
  const [image, setImage] = useState<string | null>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);


  /** Paint the source into the crop preview at the current zoom and offset. */
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    ctx.clearRect(0, 0, OUTPUT, OUTPUT);

    // Cover: the shorter side fills the square, so there is never a gap
    // whatever the photo's shape.
    const base = Math.max(OUTPUT / img.naturalWidth, OUTPUT / img.naturalHeight);
    const scale = base * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (OUTPUT - w) / 2 + offset.x, (OUTPUT - h) / 2 + offset.y, w, h);
  }, [zoom, offset]);

  useEffect(() => {
    if (editing) paint();
  }, [editing, paint]);

  function pick(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("That file is not an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setEditing(src);
        setStatus("idle");
        setMessage(null);
      };
      img.onerror = () => {
        setStatus("error");
        setMessage("That image could not be read.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUri = canvas.toDataURL("image/jpeg", QUALITY);

    setStatus("saving");
    setMessage(null);
    const result = await updateAvatarAction(dataUri);
    if ("error" in result) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setImage(dataUri);
    onChange?.(dataUri);
    setEditing(null);
    imgRef.current = null;
    setStatus("saved");
    setMessage("Photo updated.");
  }

  async function remove() {
    setStatus("saving");
    const result = await updateAvatarAction(null);
    if ("error" in result) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setImage(null);
    onChange?.(null);
    setEditing(null);
    setStatus("saved");
    setMessage("Photo removed.");
  }

  return (
    <div className="t-avpick">
      <div className="t-avpick__stage">
        {editing ? (
          <>
            {/* Drag to reposition. The canvas IS the crop — what is drawn here
                is byte-for-byte what gets saved, so there is no gap between
                the preview and the result. */}
            <canvas
              ref={canvasRef}
              className="t-avpick__canvas"
              width={OUTPUT}
              height={OUTPUT}
              role="img"
              aria-label="Drag to reposition your photo"
              onPointerDown={(e) => {
                drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
            />
          </>
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${name}'s profile photo`} className="t-avpick__img" />
        ) : (
          <span className="t-avpick__initials" aria-hidden="true">
            {initialsOf(name) || "?"}
          </span>
        )}

        {!editing && (
          <button
            type="button"
            className="t-avpick__badge"
            onClick={() => fileRef.current?.click()}
            aria-label="Change your profile photo"
          >
            <Icon name="image" size={16} />
          </button>
        )}
      </div>

      <div className="t-avpick__controls">
        {editing ? (
          <>
            <label className="t-avpick__zoom">
              <span className="t-small t-muted">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <div className="t-inline t-wrap">
              <button
                type="button"
                className="t-btn t-btn--primary t-btn--sm"
                onClick={save}
                disabled={status === "saving"}
              >
                {status === "saving" ? "Saving…" : "Save photo"}
              </button>
              <button
                type="button"
                className="t-btn t-btn--ghost t-btn--sm"
                onClick={() => {
                  setEditing(null);
                  imgRef.current = null;
                }}
                disabled={status === "saving"}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="t-inline t-wrap">
            <button
              type="button"
              className="t-btn t-btn--secondary t-btn--sm"
              onClick={() => fileRef.current?.click()}
            >
              {image ? "Change photo" : "Add a photo"}
            </button>
            {image && (
              <button
                type="button"
                className="t-btn t-btn--ghost t-btn--sm"
                onClick={remove}
                disabled={status === "saving"}
              >
                Remove
              </button>
            )}
          </div>
        )}

        {message && (
          <p
            className={`t-small ${status === "error" ? "t-avpick__err" : "t-muted"}`}
            role="status"
          >
            {message}
          </p>
        )}
      </div>

      {/* One input for both: `capture` offers the camera on a phone and is
          ignored on a desktop, where it is an ordinary file picker. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="t-visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
