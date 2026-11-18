"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { useAppDispatch, useAppSelector } from "@/store";
import { searchChanged } from "@/store/ui-slice";

export function SearchField() {
  const t = useTranslations("header");
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.ui.search);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={clsx("top-menu__search", open && "top-menu__search--open")}>
      <button
        type="button"
        className={clsx("top-menu__search-toggle", search && "top-menu__search-toggle--active")}
        aria-label={t("search")}
        aria-expanded={open}
        aria-controls="global-search"
        onClick={() => setOpen(true)}
      >
        <i className="bi bi-search" aria-hidden="true" />
      </button>
      <form
        className="top-menu__search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <label htmlFor="global-search" className="visually-hidden">
          {t("search")}
        </label>
        <i className="bi bi-search top-menu__search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          id="global-search"
          className="top-menu__search-input"
          type="search"
          placeholder={t("search")}
          autoComplete="off"
          value={search}
          onChange={(event) => dispatch(searchChanged(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          onBlur={(event) => {
            if (!event.currentTarget.form?.contains(event.relatedTarget)) close();
          }}
        />
        <button
          type="button"
          className="top-menu__search-close"
          aria-label={t("closeSearch")}
          onClick={close}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
