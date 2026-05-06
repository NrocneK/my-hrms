"use client";

export function BackButton() {
  return (
    <button onClick={() => history.back()} className="btn-secondary">
      Quay lại
    </button>
  );
}
