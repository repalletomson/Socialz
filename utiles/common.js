import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~375x812 device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scaleSize = size => (width / guidelineBaseWidth) * size;
export const verticalScale = size => (height / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) => size + (scaleSize(size) - size) * factor;

export const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export  const getRoomId=(userId1,userId2)=>{
    const sortedIds=[userId1,userId2].sort();
    const roomId=sortedIds.join('-')
    return roomId
  };
