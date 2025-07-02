// Font configuration for GeneralSans
export const Fonts = {
  GeneralSans: {
    Extralight: 'GeneralSans-Extralight',
    ExtralightItalic: 'GeneralSans-ExtralightItalic',
    Light: 'GeneralSans-Light',
    LightItalic: 'GeneralSans-LightItalic',
    Regular: 'GeneralSans-Regular',
    Italic: 'GeneralSans-Italic',
    Medium: 'GeneralSans-Medium',
    MediumItalic: 'GeneralSans-MediumItalic',
    Semibold: 'GeneralSans-Semibold',
    SemiboldItalic: 'GeneralSans-SemiboldItalic',
    Bold: 'GeneralSans-Bold',
    BoldItalic: 'GeneralSans-BoldItalic',
  }
};

// Font weight mapping to GeneralSans variants
export const getFontFamily = (weight = 'regular', italic = false) => {
  const suffix = italic ? 'Italic' : '';
  
  switch (weight) {
    case '100':
    case 'thin':
      return Fonts.GeneralSans[`Extralight${suffix}`];
    case '200':
    case 'ultralight':
    case 'extralight':
      return Fonts.GeneralSans[`Extralight${suffix}`];
    case '300':
    case 'light':
      return Fonts.GeneralSans[`Light${suffix}`];
    case '400':
    case 'normal':
    case 'regular':
      return Fonts.GeneralSans[`Regular${suffix}`];
    case '500':
    case 'medium':
      return Fonts.GeneralSans[`Medium${suffix}`];
    case '600':
    case 'semibold':
      return Fonts.GeneralSans[`Semibold${suffix}`];
    case '700':
    case 'bold':
      return Fonts.GeneralSans[`Bold${suffix}`];
    case '800':
    case 'heavy':
    case 'extrabold':
      return Fonts.GeneralSans[`Bold${suffix}`];
    case '900':
    case 'black':
      return Fonts.GeneralSans[`Bold${suffix}`];
    default:
      return Fonts.GeneralSans[`Regular${suffix}`];
  }
};

// Utility function to get complete font style object
export const getTextStyle = (fontSize = 16, fontWeight = 'regular', color = '#FFFFFF', italic = false) => {
  return {
    fontFamily: getFontFamily(fontWeight, italic),
    fontSize,
    color,
    fontWeight: undefined, // Remove fontWeight to avoid conflicts with fontFamily
  };
};

// Common text styles using GeneralSans
export const TextStyles = {
  // Headings
  h1: {
    fontFamily: Fonts.GeneralSans.Bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.GeneralSans.Bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 18,
    lineHeight: 26,
  },
  h6: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Body text
  body1: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: 14,
    lineHeight: 22,
  },
  body3: {
    fontFamily: Fonts.GeneralSans.Light,
    fontSize: 14,
    lineHeight: 22,
  },
  
  // Labels and captions
  label: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: 12,
    lineHeight: 18,
  },
  overline: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.5,
  },
  
  // Interactive elements
  button: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 16,
    lineHeight: 24,
  },
};

export default Fonts; 