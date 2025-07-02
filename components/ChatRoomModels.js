import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Image Options Modal
export const ImageOptionsModal = ({ 
  visible, 
  onClose, 
  onGallerySelect, 
  onCameraSelect 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View className="flex-1 justify-end items-center bg-black/50">
        <View className="bg-white w-full rounded-t-3xl p-6 shadow-2xl">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
            Choose Image Source
          </Text>
          
          {/* Gallery Option */}
          <TouchableOpacity 
            className="flex-row items-center bg-purple-50 p-4 rounded-xl mb-4 shadow-md"
            onPress={() => {
              onClose();
              onGallerySelect();
            }}
          >
            <View className="bg-purple-100 p-3 rounded-full mr-4">
              <MaterialIcons name="photo-library" size={24} color="#8A4FFF" />
            </View>
            <Text className="text-base text-gray-800 font-semibold">
              Choose from Gallery
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="#8A4FFF" 
              className="ml-auto" 
            />
          </TouchableOpacity>

          {/* Camera Option */}
          <TouchableOpacity 
            className="flex-row items-center bg-purple-50 p-4 rounded-xl shadow-md"
            onPress={() => {
              onClose();
              onCameraSelect();
            }}
          >
            <View className="bg-purple-100 p-3 rounded-full mr-4">
              <MaterialIcons name="camera-alt" size={24} color="#8A4FFF" />
            </View>
            <Text className="text-base text-gray-800 font-semibold">
              Take a Photo
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="#8A4FFF" 
              className="ml-auto" 
            />
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity 
            className="mt-4 bg-gray-100 p-4 rounded-xl items-center"
            onPress={onClose}
          >
            <Text className="text-gray-800 font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Full Image Preview Modal
export const FullImageModal = ({ 
  visible, 
  imageUri, 
  onClose 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/90 justify-center items-center">
        {imageUri && (
          <View className="w-full h-[80%] relative">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="contain"
            />
            
            {/* Close Button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 bg-white/30 p-2 rounded-full"
              onPress={onClose}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Download/Share Options */}
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-4">
              <TouchableOpacity 
                className="bg-white/30 p-3 rounded-full"
                onPress={() => {
                  // Implement download logic
                  console.log('Download image');
                }}
              >
                <MaterialIcons name="download" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-white/30 p-3 rounded-full"
                onPress={() => {
                  // Implement share logic
                  console.log('Share image');
                }}
              >
                <MaterialIcons name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// Block Confirmation Modal
export const BlockConfirmationModal = ({ 
  visible, 
  isBlocked,
  onBlock, 
  onUnblock,
  onClose 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-[85%] rounded-2xl p-6 shadow-2xl">
          <View className="items-center mb-4">
            <View className="bg-red-100 p-4 rounded-full mb-4">
              <MaterialIcons 
                name={isBlocked ? "lock-open" : "block"} 
                size={40} 
                color={isBlocked ? "#10B981" : "#EF4444"} 
              />
            </View>
            
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
              {isBlocked ? 'Unblock User' : 'Block User'}
            </Text>
            
            <Text className="text-base text-gray-600 text-center mb-4">
              {isBlocked 
                ? 'Are you sure you want to unblock this user?' 
                : 'Are you sure you want to block this user?'}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-gray-100 px-6 py-3 rounded-xl w-[45%]"
              onPress={onClose}
            >
              <Text className="text-gray-800 text-center font-bold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`
                px-6 py-3 rounded-xl w-[45%]
                ${isBlocked 
                  ? 'bg-green-500' 
                  : 'bg-red-500'}
              `}
              onPress={isBlocked ? onUnblock : onBlock}
            >
              <Text className="text-white text-center font-bold">
                {isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Camera Modal
export const CameraModal = ({ 
  visible, 
  onClose, 
  onCapture 
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      onCapture(photo.uri);
      onClose();
    }
  };

  if (hasPermission === null) {
    return null;
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">No access to camera</Text>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View className="flex-1">
        <Camera 
          ref={cameraRef}
          className="flex-1"
          type={type}
        >
          <View className="flex-1 bg-transparent justify-between p-4">
            {/* Top Controls */}
            <View className="flex-row justify-between">
              <TouchableOpacity 
                onPress={onClose}
                className="bg-white/30 p-2 rounded-full"
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                )}
                className="bg-white/30 p-2 rounded-full"
              >
                <MaterialIcons name="flip-camera-ios" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Capture Button */}
            <View className="items-center">
              <TouchableOpacity 
                onPress={takePicture}
                className="bg-white w-20 h-20 rounded-full items-center justify-center"
              >
                <View className="bg-purple-500 w-16 h-16 rounded-full" />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    </Modal>
  );
};

export default {
  ImageOptionsModal,
  FullImageModal,
  BlockConfirmationModal,
  CameraModal
};