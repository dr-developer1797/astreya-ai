"use client";

import { useState, useCallback } from "react";

export function useFormState(initial = {}) {
  const [form, setForm] = useState(initial);
  const setF = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  return [form, setF, setForm];
}
