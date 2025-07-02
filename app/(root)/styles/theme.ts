// export const colors = {
//     primary: "#1877F2",
//     accent: {
//       red: "#E60023",
//       yellow: "#FFFC00",
//     },
//     gradient: {
//       start: "#E4405F",
//       end: "#FF9A8B",
//     },
//     background: "#F0F2F5",
//     text: "#1E1E1E",
//     lightText: "#65676B",
//   }
  
//   export const typography = {
//     header: {
//       fontSize: 24,
//       fontWeight: "bold",
//     },
//     subheader: {
//       fontSize: 18,
//       fontWeight: "600",
//     },
//     body: {
//       fontSize: 16,
//     },
//   }
  
  

  export  const theme = {
    background: "#FFFFFF",
    surface: "#F8F9FF",
    primary: "#6366F1",
    secondary: "#A78BFA",
    accent: "#8B5CF6",
    text: "#1F2937",
    textSecondary: "#4B5563",
    border: "#E5E7EB",
    gradient: ["#6366F1", "#8B5CF6", "#A78BFA"],
  }
  

  
  export const lightTheme = {
    background: "#FFFFFF",
    surface: "#F3F4F6",
    primary: "#9333EA",
    secondary: "#A78BFA",
    text: "#1F2937",
    textSecondary: "#4B5563",
    border: "#E5E7EB",
  }
  
  export const darkTheme = {
    background: "#1F2937",
    surface: "#374151",
    primary: "#9333EA",
    secondary: "#A78BFA",
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    border: "#4B5563",
  }
  

  export const COLORS = {
    // Primary (60%)
    primary: {
      DEFAULT: '#2C3E50', // Dark blue for main elements
      light: '#34495E',
      dark: '#243342',
    },
    // Secondary (30%)
    secondary: {
      DEFAULT: '#ECF0F1', // Light gray for backgrounds
      light: '#F4F6F7',
      dark: '#BDC3C7',
    },
    // Accent (10%)
    accent: {
      DEFAULT: '#3498DB', // Blue for interactive elements
      light: '#5DADE2',
      dark: '#2980B9',
    }
  };
    
  const pending = {
    color: COLORS.accent.DEFAULT, // Blue for pending tasks
  };
  export default pending;