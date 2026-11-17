"use client";

import { useTranslations } from "use-intl";
import { useAppDispatch, useAppSelector } from "@/store";
import { searchChanged } from "@/store/ui-slice";

export function SearchField() {
  const t = useTranslations("header");
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.ui.search);

  return (
    <form className="top-menu__search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="global-search" className="visually-hidden">
        {t("search")}
      </label>
      <input
        id="global-search"
        className="top-menu__search-input"
        type="search"
        placeholder={t("search")}
        autoComplete="off"
        value={search}
        onChange={(event) => dispatch(searchChanged(event.target.value))}
      />
    </form>
  );
}
