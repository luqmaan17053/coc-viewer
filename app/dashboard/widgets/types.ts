import type { ComponentType } from "react";

export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  type: string;
  displayName: string;
  description: string;
  icon: string;
  defaultConfig: TConfig;
  defaultLayout: {
    lg: { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };
    sm: { w: number; h: number; minW?: number; minH?: number };
  };
  /**
   * If true, clicking this widget in the picker opens the config modal in
   * "create" mode instead of adding immediately. The widget is only added
   * when the user clicks Save in the modal.
   */
  requiresConfigOnAdd?: boolean;
  Widget: ComponentType<WidgetProps<TConfig>>;
  ConfigForm: ComponentType<WidgetConfigFormProps<TConfig>> | null;
}

export interface WidgetProps<TConfig = Record<string, unknown>> {
  id: string;
  config: TConfig;
  editMode: boolean;
  onRemove: () => void;
  onOpenConfig: () => void;
}

export interface WidgetConfigFormProps<TConfig = Record<string, unknown>> {
  initialConfig: TConfig;
  onSave: (newConfig: TConfig) => void;
  onCancel: () => void;
}