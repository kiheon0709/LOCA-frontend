import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageInfo } from 'expo-image-picker';

const { height, width } = Dimensions.get('window');



const HomeScreen = forwardRef((props, ref) => {
  const [currentKeyword, setCurrentKeyword] = useState<string>('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // 시연용 유저 ID (1-5 중 선택)
  const currentUserId = 1;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // 더미 키워드 목록
  const dummyKeywords = [
    '비 내리는 저녁의 쓸쓸한 골목길',
    '저녁의 노을지는 한적한 공원',
    '퇴근길 버스 정류장',
    '활기찬 놀이터'
  ];

  const randomKeyword = () => {
    const randomIndex = Math.floor(Math.random() * dummyKeywords.length);
    setCurrentKeyword(dummyKeywords[randomIndex]);
  };

  // 컴포넌트 마운트 시 랜덤 키워드 설정
  useEffect(() => {
    randomKeyword();
  }, []);

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? '아침' : hour < 18 ? '낮' : '저녁';
    return `${year}년 ${month}월 ${date}일, ${timeOfDay} 영감`;
  };

  // 이미지 업로드 함수
  const handleImageUpload = async () => {
    try {
      setIsLoading(true);
      
      // 갤러리에서 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 크롭 기능 비활성화하여 원본 이미지 그대로 사용
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedPhoto(asset.uri);
        setImageInfo({ width: asset.width, height: asset.height });
        Alert.alert('성공', '사진이 선택되었습니다!');
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ref를 통해 외부에서 호출할 수 있는 메서드 제공
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (scrollViewRef.current) {
        (scrollViewRef.current as any).scrollTo({ y: 0, animated: true });
      }
    }
  }));

  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      style={styles.container}
      onScroll={handleScroll}
      pagingEnabled={true}
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
    >
      <View style={styles.screen}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.dateButton}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.randomButton} onPress={randomKeyword}>
              <Ionicons name="reload" size={15} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listButton}>
              <Ionicons name="list" size={15} color="#000000" />
              <Text style={styles.listButtonText}>영감 목록</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 메인 콘텐츠 */}
        <View style={[
          styles.mainContent,
          uploadedPhoto ? styles.mainContentWithPhoto : styles.mainContentWithoutPhoto
        ]}>
          {/* 키워드 */}
          <Text style={[
            styles.keywordText,
            uploadedPhoto && styles.keywordTextWithPhoto
          ]}>
            {currentKeyword}
          </Text>
          
          {/* 업로드된 사진 표시 */}
          {uploadedPhoto && imageInfo && (
            <View style={[
              styles.uploadedPhotoContainer,
              {
                width: width * 0.9,
                height: Math.min(
                  (width * 0.9) * (imageInfo.height / imageInfo.width),
                  height * 0.5
                )
              }
            ]}>
              <Image 
                source={{ uri: uploadedPhoto }}
                style={styles.uploadedPhoto}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        
        {/* 이미지 첨부 버튼 - 하단 고정 */}
        <TouchableOpacity 
          style={[styles.imageButtonFixed, isLoading && styles.imageButtonDisabled]}
          onPress={handleImageUpload}
          disabled={isLoading}
        >
          <Ionicons 
            name={isLoading ? "hourglass" : "image"} 
            size={32} 
            color={isLoading ? "#999999" : "#000000"} 
          />
        </TouchableOpacity>
        
        {/* 스크롤 안내 - 화면 하단 고정 */}
        <TouchableOpacity style={styles.scrollHintFixed}>
          <Ionicons name="chevron-up" size={16} color="#666666" />
          <Text style={styles.scrollHintText}>올려서 다른 사람들의 사진 확인하기</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.screen}>
        <View style={styles.secondScreen}>
          <Text style={styles.secondScreenTitle}>다른 사람들의 영감</Text>
          <Text style={styles.secondScreenSubtitle}>키워드로 해석한 다양한 사진들을 확인해보세요</Text>
        </View>
      </View>
    </Animated.ScrollView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    height: height,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 20,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    borderRadius: 5,
    height: 25, // 고정 높이
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  randomButton: {
    width: 40,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  listButtonText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '400',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mainContentWithoutPhoto: {
    justifyContent: 'flex-start',
    paddingTop: height * 0.3,
  },
  mainContentWithPhoto: {
    justifyContent: 'flex-start',
    paddingTop: height * 0.1,
  },
  keywordText: {
    fontSize: 20,
    fontFamily: 'BookkMyungjo-Bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 30,
  },
  keywordTextWithPhoto: {
    marginBottom: 20,
  },
  imageButtonFixed: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    zIndex: 1000,
  },
  imageButtonDisabled: {
    opacity: 0.5,
  },
  uploadedPhotoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
    alignSelf: 'center',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  scrollHintFixed: {
    position: 'absolute',
    bottom: 100, // 네비게이터 바로 위
    alignSelf: 'center',
    height: 25, // 고정 높이
    width: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    borderRadius: 5,
    gap: 8,
  },
  scrollHintText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
  },
  secondScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  secondScreenTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  secondScreenSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
