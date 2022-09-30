import React from "react";
import { ActionManager } from "../actions/manager";
import { getNonDeletedElements } from "../element";
import { ExcalidrawElement, PointerType } from "../element/types";
import { t } from "../i18n";
import { useDevice } from "../components/App";
import {
  canChangeSharpness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
  hasText,
} from "../scene";
import { SHAPES } from "../shapes";
import { AppState, Zoom } from "../types";
import {
  capitalizeString,
  isTransparent,
  updateActiveTool,
  setCursorForShape,
} from "../utils";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { hasStrokeColor } from "../scene/comparisons";
import { trackEvent } from "../analytics";
import { hasBoundTextElement, isBoundToContainer } from "../element/typeChecks";

export const SelectedShapeActions = ({
  appState,
  elements,
  renderAction,
  activeTool,
  disableAlignItems,
  disableGrouping,
  disableLink,
  disableShortcuts,
  disableVerticalAlignOptions,
  fontSizeOptions,
  hideArrowHeadsOptions,
  hideColorInput,
  hideFontFamily,
  hideLayers,
  hideOpacityInput,
  hideSharpness,
  hideStrokeStyle,
  hideTextAlign,
}: {
  appState: AppState;
  elements: readonly ExcalidrawElement[];
  renderAction: ActionManager["renderAction"];
  activeTool: AppState["activeTool"]["type"];
  disableAlignItems?: boolean;
  disableGrouping?: boolean;
  disableLink?: boolean;
  disableShortcuts?: boolean;
  disableVerticalAlignOptions?: boolean;
  fontSizeOptions?: Array<String>;
  hideArrowHeadsOptions?: boolean;
  hideColorInput?: boolean;
  hideFontFamily?: boolean;
  hideLayers?: boolean;
  hideOpacityInput?: boolean;
  hideSharpness?: boolean;
  hideStrokeStyle?: boolean;
  hideTextAlign?: boolean;
}) => {
  const targetElements = getTargetElements(
    getNonDeletedElements(elements),
    appState,
  );

  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }
  const isEditing = Boolean(appState.editingElement);
  const device = useDevice();
  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  const showFillIcons =
    hasBackground(activeTool) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );
  const showChangeBackgroundIcons =
    hasBackground(activeTool) ||
    targetElements.some((element) => hasBackground(element.type));

  const showLinkIcon =
    targetElements.length === 1 || isSingleElementBoundContainer;

  let commonSelectedType: string | null = targetElements[0]?.type || null;

  for (const element of targetElements) {
    if (element.type !== commonSelectedType) {
      commonSelectedType = null;
      break;
    }
  }

  return (
    <div className="panelColumn">
      {((hasStrokeColor(activeTool) &&
        activeTool !== "image" &&
        commonSelectedType !== "image") ||
        targetElements.some((element) => hasStrokeColor(element.type))) &&
        renderAction("changeStrokeColor", { disableShortcuts, hideColorInput })}
      {showChangeBackgroundIcons &&
        renderAction("changeBackgroundColor", {
          disableShortcuts,
          hideColorInput,
        })}
      {showFillIcons && renderAction("changeFillStyle")}

      {(hasStrokeWidth(activeTool) ||
        targetElements.some((element) => hasStrokeWidth(element.type))) &&
        renderAction("changeStrokeWidth")}

      {(activeTool === "freedraw" ||
        targetElements.some((element) => element.type === "freedraw")) &&
        renderAction("changeStrokeShape")}

      {!hideStrokeStyle &&
        (hasStrokeStyle(activeTool) ||
          targetElements.some((element) => hasStrokeStyle(element.type))) && (
          <>
            {renderAction("changeStrokeStyle")}
            {renderAction("changeSloppiness")}
          </>
        )}

      {!hideSharpness &&
        (canChangeSharpness(activeTool) ||
          targetElements.some((element) =>
            canChangeSharpness(element.type),
          )) && <>{renderAction("changeSharpness")}</>}

      {(hasText(activeTool) ||
        targetElements.some((element) => hasText(element.type))) && (
        <>
          {renderAction("changeFontSize", { fontSizeOptions })}

          {!hideFontFamily && renderAction("changeFontFamily")}

          {!hideTextAlign && renderAction("changeTextAlign")}
        </>
      )}

      {!disableVerticalAlignOptions &&
        targetElements.some(
          (element) =>
            hasBoundTextElement(element) || isBoundToContainer(element),
        ) &&
        renderAction("changeVerticalAlign")}
      {!hideArrowHeadsOptions &&
        (canHaveArrowheads(activeTool) ||
          targetElements.some((element) =>
            canHaveArrowheads(element.type),
          )) && <>{renderAction("changeArrowhead")}</>}

      {!hideOpacityInput && renderAction("changeOpacity")}

      {!hideLayers && (
        <fieldset>
          <legend>{t("labels.layers")}</legend>
          <div className="buttonList">
            {renderAction("sendToBack")}
            {renderAction("sendBackward")}
            {renderAction("bringToFront")}
            {renderAction("bringForward")}
          </div>
        </fieldset>
      )}

      {targetElements.length > 1 &&
        !isSingleElementBoundContainer &&
        !disableAlignItems && (
          <fieldset>
            <legend>{t("labels.align")}</legend>
            <div className="buttonList">
              {
                // swap this order for RTL so the button positions always match their action
                // (i.e. the leftmost button aligns left)
              }
              {isRTL ? (
                <>
                  {renderAction("alignRight")}
                  {renderAction("alignHorizontallyCentered")}
                  {renderAction("alignLeft")}
                </>
              ) : (
                <>
                  {renderAction("alignLeft")}
                  {renderAction("alignHorizontallyCentered")}
                  {renderAction("alignRight")}
                </>
              )}
              {targetElements.length > 2 &&
                renderAction("distributeHorizontally")}
              <div className="iconRow">
                {renderAction("alignTop")}
                {renderAction("alignVerticallyCentered")}
                {renderAction("alignBottom")}
                {targetElements.length > 2 &&
                  renderAction("distributeVertically")}
              </div>
            </div>
          </fieldset>
        )}
      {!isEditing &&
        targetElements.length > 0 &&
        !(device.isMobile && disableGrouping) && (
          <fieldset>
            <legend>{t("labels.actions")}</legend>
            <div className="buttonList">
              {!device.isMobile &&
                renderAction("duplicateSelection", { disableShortcuts })}
              {!device.isMobile && renderAction("deleteSelectedElements")}
              {!disableGrouping && (
                <>
                  {renderAction("group", { disableShortcuts })}
                  {renderAction("ungroup", { disableShortcuts })}
                </>
              )}
              {showLinkIcon && !disableLink && renderAction("hyperlink")}
            </div>
          </fieldset>
        )}
    </div>
  );
};

export const ShapesSwitcher = ({
  canvas,
  activeTool,
  allowedShapes,
  disableShortcuts,
  setAppState,
  onImageAction,
  appState,
}: {
  canvas: HTMLCanvasElement | null;
  activeTool: AppState["activeTool"];
  allowedShapes: Array<String>;
  disableShortcuts?: boolean;
  setAppState: React.Component<any, AppState>["setState"];
  onImageAction: (data: { pointerType: PointerType | null }) => void;
  appState: AppState;
}) => (
  <>
    {SHAPES.filter(
      (shape) => !allowedShapes.length || allowedShapes.includes(shape.value),
    ).map(({ value, icon, key }, index) => {
      const label = t(`toolBar.${value}`);
      const letter = key && (typeof key === "string" ? key : key[0]);
      const shortcut = letter
        ? `${capitalizeString(letter)} ${t("helpDialog.or")} ${index + 1}`
        : `${index + 1}`;
      const title = disableShortcuts
        ? capitalizeString(label)
        : `${capitalizeString(label)} — ${shortcut}`;
      return (
        <ToolButton
          className="Shape"
          key={value}
          type="radio"
          icon={icon}
          checked={activeTool.type === value}
          name="editor-current-shape"
          title={title}
          disableShortcuts={disableShortcuts}
          keyBindingLabel={`${index + 1}`}
          aria-label={capitalizeString(label)}
          aria-keyshortcuts={shortcut}
          data-testid={value}
          onPointerDown={({ pointerType }) => {
            if (!appState.penDetected && pointerType === "pen") {
              setAppState({
                penDetected: true,
                penMode: true,
              });
            }
          }}
          onChange={({ pointerType }) => {
            if (appState.activeTool.type !== value) {
              trackEvent("toolbar", value, "ui");
            }
            const nextActiveTool = updateActiveTool(appState, {
              type: value,
            });
            setAppState({
              activeTool: nextActiveTool,
              multiElement: null,
              selectedElementIds: {},
            });
            setCursorForShape(canvas, {
              ...appState,
              activeTool: nextActiveTool,
            });
            if (value === "image") {
              onImageAction({ pointerType });
            }
          }}
        />
      );
    })}
  </>
);

export const ZoomActions = ({
  disableShortcuts,
  renderAction,
  zoom,
}: {
  disableShortcuts?: boolean;
  renderAction: ActionManager["renderAction"];
  zoom: Zoom;
}) => (
  <Stack.Col gap={1}>
    <Stack.Row gap={1} align="center">
      {renderAction("zoomOut", { disableShortcuts })}
      {renderAction("zoomIn", { disableShortcuts })}
      {renderAction("resetZoom")}
    </Stack.Row>
  </Stack.Col>
);
