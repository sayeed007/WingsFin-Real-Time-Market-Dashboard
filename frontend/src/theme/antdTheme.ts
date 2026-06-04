import type { ThemeConfig } from 'antd'

import { brandTokens, fontTokens } from './designTokens'

export const antdTheme: ThemeConfig = {
  cssVar: {
    prefix: 'wf',
  },
  token: {
    borderRadius: 8,
    boxShadow: brandTokens.shadow,
    colorBgBase: brandTokens.surface,
    colorBgContainer: brandTokens.surface,
    colorBgLayout: brandTokens.layout,
    colorBorder: brandTokens.border,
    colorBorderSecondary: brandTokens.border,
    colorError: brandTokens.danger,
    colorFillAlter: brandTokens.surfaceSoft,
    colorPrimary: brandTokens.green,
    colorPrimaryHover: brandTokens.greenHover,
    colorPrimaryActive: brandTokens.greenDeep,
    colorText: brandTokens.ink,
    colorTextDescription: brandTokens.text,
    colorTextHeading: brandTokens.ink,
    controlOutline: brandTokens.controlOutline,
    controlHeight: 42,
    controlHeightLG: 48,
    fontFamily: fontTokens.sans,
    fontSize: 15,
  },
  components: {
    Alert: {
      borderRadiusLG: 8,
    },
    Button: {
      fontWeight: 800,
    },
    Card: {
      bodyPadding: 22,
      bodyPaddingSM: 14,
      borderRadiusLG: 8,
      boxShadowTertiary: brandTokens.shadow,
    },
    Select: {
      fontWeightStrong: 800,
      optionSelectedFontWeight: 800,
    },
    Statistic: {
      titleFontSize: 12,
    },
  },
}
