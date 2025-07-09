import { scaleSize } from '../utiles/common';

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
    fontSize: scaleSize(28),
    lineHeight: scaleSize(40),
    color: '#FFFFFF',
  },
  h2: {
    fontFamily: Fonts.GeneralSans.Bold,
    fontSize: scaleSize(22),
    lineHeight: scaleSize(36),
    color: '#FFFFFF',
  },
  h3: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: scaleSize(24),
    lineHeight: scaleSize(32),
    color: '#FFFFFF',
  },
  h4: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: scaleSize(20),
    lineHeight: scaleSize(28),
    color: '#FFFFFF',
  },
  h5: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: scaleSize(18),
    lineHeight: scaleSize(26),
    color: '#FFFFFF',
  },
  h6: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: '#FFFFFF',
  },
  
  // Body text
  body1: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: '#FFFFFF',
  },
  body2: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: scaleSize(14),
    lineHeight: scaleSize(22),
    color: '#FFFFFF',
  },
  body3: {
    fontFamily: Fonts.GeneralSans.Light,
    fontSize: scaleSize(14),
    lineHeight: scaleSize(22),
    color: '#FFFFFF',
  },
  
  // Labels and captions
  label: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    color: '#FFFFFF',
  },
  caption: {
    fontFamily: Fonts.GeneralSans.Regular,
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: '#FFFFFF',
  },
  overline: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: scaleSize(10),
    lineHeight: scaleSize(16),
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  
  // Interactive elements
  button: {
    fontFamily: Fonts.GeneralSans.Semibold,
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: '#FFFFFF',
  },
  link: {
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: '#FFFFFF',
  },
};

export default Fonts; 