import React from "react";
import { ActionManager } from "../actions/manager";
import { AppState } from "../types";

export const BackgroundPickerAndDarkModeToggle = ({
  appState,
  setAppState,
  actionManager,
  showThemeBtn,
  disableShortcuts,
}: {
  actionManager: ActionManager;
  appState: AppState;
  setAppState: React.Component<any, AppState>["setState"];
  showThemeBtn: boolean;
  disableShortcuts?: boolean;
}) => (
  <div style={{ display: "flex" }}>
    {actionManager.renderAction("changeViewBackgroundColor", {
      disableShortcuts,
    })}
    {showThemeBtn && actionManager.renderAction("toggleTheme")}
  </div>
);
