import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image, 
  Alert, 
  TextInput, 
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService, User } from '../services/api';

const { height, width } = Dimensions.get('window');

interface ImageUploadScreenProps {
  selectedUser: User;
  visible: boolean;
  onClose: () => void;
  currentKeyword: string;
  currentKeywordId: number;
  onUploadSuccess: (imageUri: string) => void;
}

const ImageUploadScreen: React.FC<ImageUploadScreenProps> = ({ 
  selectedUser, 
  visible, 
  onClose, 
  currentKeyword, 
  currentKeywordId,
  onUploadSuccess 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number} | null>(null);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setImageInfo({ width: asset.width, height: asset.height });
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  const handleComplete = async () => {
    if (!selectedImage) {
      Alert.alert('알림', '이미지를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      // 백엔드에 업로드
      const asset = { uri: selectedImage, width: imageInfo?.width || 0, height: imageInfo?.height || 0 };
      await apiService.uploadPhoto(asset, selectedUser.id, currentKeywordId, location);
      
      Alert.alert('성공', '사진이 업로드되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            onUploadSuccess(selectedImage);
            handleClose();
          }
        }
      ]);
    } catch (error) {
      console.error('업로드 실패:', error);
      Alert.alert('오류', '업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImageInfo(null);
    setLocation('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>사진 업로드</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 키워드 표시 */}
          <View style={styles.keywordContainer}>
            <Text style={styles.keywordLabel}>현재 키워드</Text>
            <Text style={styles.keywordText}>{currentKeyword}</Text>
          </View>

          {/* 이미지 선택 영역 */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>사진 선택</Text>
            <TouchableOpacity style={styles.imageSelectButton} onPress={handleImageSelect}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image 
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.changeImageButton} onPress={handleImageSelect}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>변경</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={48} color="#CCCCCC" />
                  <Text style={styles.placeholderText}>사진을 선택해주세요</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 위치 정보 입력 */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>위치 정보</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#666666" />
              <TextInput
                style={styles.locationInput}
                placeholder="사진을 찍은 장소를 입력해주세요"
                placeholderTextColor="#999999"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={[styles.completeButton, (!selectedImage || isLoading) && styles.disabledButton]}
            onPress={handleComplete}
            disabled={!selectedImage || isLoading}
          >
            <Text style={styles.completeButtonText}>
              {isLoading ? '업로드 중...' : '완료'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ImageUploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  keywordContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  keywordLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  keywordText: {
    fontSize: 18,
    fontFamily: 'BookkMyungjo-Bold',
    color: '#000000',
    lineHeight: 26,
  },
  imageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  imageSelectButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  selectedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeImageText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  locationSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completeButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});
