"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { searchChanged } from "@/store/ui-slice";

export function SearchField() {
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.ui.search);

  return (
    <form className="top-menu__search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="global-search" className="visually-hidden">
        Поиск
      </label>
      <input
        id="global-search"
        className="top-menu__search-input"
        type="search"
        placeholder="Поиск"
        autoComplete="off"
        value={search}
        onChange={(event) => dispatch(searchChanged(event.target.value))}
      />
    </form>
  );
}
