import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

// Define preset color schemes
const presetThemes = {
  light: {
    theme: "light",
    primaryColor: "#1C2244",
    backgroundColor: "#ffffff",
    layoutType: "full",
    contentBgColor: "#ffffff",
    headerBgColor: "#E1E6FF",
    headerGradient: "#E1E6FF",
    sidebarBgColor: "#E1E6FF",
    footerBgColor: "#E1E6FF",
  },
  blue: {
    theme: "light",
    primaryColor: "#1890ff",
    backgroundColor: "#e6f7ff",
    layoutType: "full",
    contentBgColor: "#f0f5ff",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to left, #1890ff, #096dd9)",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#e6f7ff",
  },
  purple: {
    theme: "light",
    primaryColor: "#722ed1",
    backgroundColor: "#f9f0ff",
    layoutType: "full",
    contentBgColor: "#f5f0fe",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to left, #9254de,rgb(101, 59, 160))",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#f9f0ff",
  },
  green: {
    theme: "light",
    primaryColor: "#52c41a",
    backgroundColor: "#f6ffed",
    layoutType: "full",
    contentBgColor: "#f0fce9",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to left, #73d13d, #52c41a)",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#f6ffed",
  },
  grey: {
    theme: "light",
    primaryColor: "#8c8c8c",
    backgroundColor: "#f5f5f5",
    layoutType: "full",
    contentBgColor: "#f0f2f5",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to left, #bfbfbf, #8c8c8c)",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#f5f5f5",
  },
};

const defaultTheme = presetThemes.light;

// Helper to get stored theme or default
const getStoredTheme = (key, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(`theme_${key}`);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving theme setting ${key}:`, error);
    return defaultValue;
  }
};

const createMildColor = (hexColor) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Make it milder by mixing with white (255,255,255)
  const mildFactor = 0.85; 
  const mildR = Math.round(r * mildFactor + 255 * (1 - mildFactor));
  const mildG = Math.round(g * mildFactor + 255 * (1 - mildFactor));
  const mildB = Math.round(b * mildFactor + 255 * (1 - mildFactor));

  // Convert back to hex
  return `#${mildR.toString(16).padStart(2, "0")}${mildG
    .toString(16)
    .padStart(2, "0")}${mildB.toString(16).padStart(2, "0")}`;
};

// Define common color schemes
const commonColorSchemes = [
  {
    name: "Default Light",
    headerBgColor: "#ffffff",
    sidebarBgColor: "#ffffff",
    contentBgColor: "#f9fafb",
    footerBgColor: "#f4e6ff",
    primaryColor: "#8e2de2",
    headerGradient: "linear-gradient(90deg, #722ed1 0%, #9254de 100%)",
  },
  {
    name: "Cool Blue",
    headerBgColor: "#1890ff",
    sidebarBgColor: "#ffffff",
    contentBgColor: "#f0f5ff",
    footerBgColor: "#e6f7ff",
    primaryColor: "#1890ff",
    headerGradient: "linear-gradient(to left, #1890ff, #096dd9)",
  },
  {
    name: "Warm Purple",
    headerBgColor: "#722ed1",
    sidebarBgColor: "ffffff",
    contentBgColor: "#f5f0fe",
    footerBgColor: "#f9f0ff",
    primaryColor: "#722ed1",
    headerGradient: "linear-gradient(to left, #722ed1, #9254de )",
  },
];

// Helper to create a gradient from a color
const createGradientFromColor = (
  hexColor,
  direction = "to right",
  intensity = 20
) => {
  if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) {
    return "linear-gradient(to right, #cccccc, #999999)";
  }
  // Convert hex to RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  // Create a darker shade for the gradient
  const darkR = Math.max(0, r - intensity);
  const darkG = Math.max(0, g - intensity);
  const darkB = Math.max(0, b - intensity);

  const darkHexColor = `#${darkR.toString(16).padStart(2, "0")}${darkG
    .toString(16)
    .padStart(2, "0")}${darkB.toString(16).padStart(2, "0")}`;

  return `linear-gradient(${direction}, ${hexColor}, ${darkHexColor})`;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    getStoredTheme("theme", defaultTheme.theme)
  );
  const [primaryColor, setPrimaryColor] = useState(() =>
    getStoredTheme("primaryColor", defaultTheme.primaryColor)
  );
  const [backgroundColor, setBackgroundColor] = useState(() =>
    getStoredTheme("backgroundColor", defaultTheme.backgroundColor)
  );
  const [layoutType, setLayoutType] = useState(() =>
    getStoredTheme("layoutType", defaultTheme.layoutType)
  );
  const [contentBgColor, setContentBgColor] = useState(() =>
    getStoredTheme("contentBgColor", defaultTheme.contentBgColor)
  );
  const [headerBgColor, setHeaderBgColor] = useState(() =>
    getStoredTheme("headerBgColor", defaultTheme.headerBgColor)
  );
  const [headerGradient, setHeaderGradient] = useState(() =>
    getStoredTheme("headerGradient", defaultTheme.headerGradient)
  );
  const [sidebarBgColor, setSidebarBgColor] = useState(() =>
    getStoredTheme("sidebarBgColor", defaultTheme.sidebarBgColor)
  );
  const [footerBgColor, setFooterBgColor] = useState(() =>
    getStoredTheme("footerBgColor", defaultTheme.footerBgColor)
  );
  const [currentPreset, setCurrentPreset] = useState(() =>
    getStoredTheme("currentPreset", "light")
  );

  // Custom setters that update localStorage
  const updateTheme = (value) => {
    setTheme(value);
    localStorage.setItem("theme_theme", JSON.stringify(value));

    if (value === "dark") {
      updateHeaderBgColor("#001529");
      updateHeaderGradient(null);
    } else {
      updateHeaderBgColor(defaultTheme.headerBgColor);
      updateHeaderGradient(defaultTheme.headerGradient);
    }
  };

  const updatePrimaryColor = (value) => {
    setPrimaryColor(value);
    localStorage.setItem("theme_primaryColor", JSON.stringify(value));
  };

  const updateBackgroundColor = (value) => {
    setBackgroundColor(value);
    localStorage.setItem("theme_backgroundColor", JSON.stringify(value));
  };

  const updateLayoutType = (value) => {
    setLayoutType(value);
    localStorage.setItem("theme_layoutType", JSON.stringify(value));
  };

  const updateContentBgColor = (value) => {
    const mildColor = createMildColor(value);
    setContentBgColor(mildColor);
    localStorage.setItem("theme_contentBgColor", JSON.stringify(mildColor));
  };

  const updateHeaderBgColor = (value) => {
    setHeaderBgColor(value);
    localStorage.setItem("theme_headerBgColor", JSON.stringify(value));
  };

  const updateHeaderGradient = (value) => {
    setHeaderGradient(value);
    localStorage.setItem("theme_headerGradient", JSON.stringify(value));
  };

  const updateSidebarBgColor = (value) => {
    setSidebarBgColor(value);
    localStorage.setItem("theme_sidebarBgColor", JSON.stringify(value));
  };

  const updateFooterBgColor = (value) => {
    setFooterBgColor(value);
    localStorage.setItem("theme_footerBgColor", JSON.stringify(value));
  };

  const updateCurrentPreset = (value) => {
    setCurrentPreset(value);
    localStorage.setItem("theme_currentPreset", JSON.stringify(value));
  };

  // Apply a preset theme
  const applyPresetTheme = (presetName) => {
    if (!presetThemes[presetName]) return;

    const preset = presetThemes[presetName];
    updateTheme(preset.theme);
    updatePrimaryColor(preset.primaryColor);
    updateBackgroundColor(preset.backgroundColor);
    updateLayoutType(preset.layoutType);
    updateContentBgColor(preset.contentBgColor);
    updateHeaderBgColor(preset.headerBgColor);
    updateHeaderGradient(preset.headerGradient);
    updateSidebarBgColor(preset.sidebarBgColor);
    updateFooterBgColor(preset.footerBgColor);
    updateCurrentPreset(presetName);
  };

  // Apply a common color scheme
  const applyCommonColorScheme = (schemeIndex) => {
    if (schemeIndex < 0 || schemeIndex >= commonColorSchemes.length) return;

    const scheme = commonColorSchemes[schemeIndex];
    updateHeaderBgColor(scheme.headerBgColor);
    updateSidebarBgColor(scheme.sidebarBgColor);
    updateContentBgColor(scheme.contentBgColor);
    updateFooterBgColor(scheme.footerBgColor);
    if (scheme.primaryColor) {
      updatePrimaryColor(scheme.primaryColor);
    }
    if (scheme.headerGradient) {
      updateHeaderGradient(scheme.headerGradient);
    }
  };

  const resetTheme = () => {
    applyPresetTheme("light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: updateTheme,
        primaryColor,
        setPrimaryColor: updatePrimaryColor,
        backgroundColor,
        setBackgroundColor: updateBackgroundColor,
        layoutType,
        setLayoutType: updateLayoutType,
        contentBgColor,
        setContentBgColor: updateContentBgColor,
        headerBgColor,
        setHeaderBgColor: updateHeaderBgColor,
        headerGradient,
        setHeaderGradient: updateHeaderGradient,
        sidebarBgColor,
        setSidebarBgColor: updateSidebarBgColor,
        footerBgColor,
        setFooterBgColor: updateFooterBgColor,
        resetTheme,
        createMildColor,
        presetThemes,
        currentPreset,
        applyPresetTheme,
        commonColorSchemes,
        applyCommonColorScheme,
        createGradientFromColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
