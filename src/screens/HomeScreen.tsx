import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image, Alert, PanResponder, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageInfo } from 'expo-image-picker';
import { apiService, User } from '../services/api';
import { colors } from '../styles/colors';

const { height, width } = Dimensions.get('window');

interface HomeScreenProps {
  selectedUser: User;
}

const HomeScreen = forwardRef<any, HomeScreenProps>(({ selectedUser }, ref) => {
  const [currentKeyword, setCurrentKeyword] = useState<string>('');
  const [currentKeywordId, setCurrentKeywordId] = useState<number>(1);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(height)).current; // 시작은 화면 아래
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywords, setKeywords] = useState<{ id: number; keyword: string; category?: string }[]>([]);
  const [isKeywordLoading, setIsKeywordLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // 컴포넌트 마운트 시 연결 상태 확인 및 랜덤 키워드 설정
  useEffect(() => {
    checkConnection();
    getRandomKeyword();
  }, []);

  const checkConnection = async () => {
    try {
      const isConnected = await apiService.checkConnection();
      setConnectionStatus(isConnected);
    } catch (error) {
      console.error('연결 확인 중 오류:', error);
      setConnectionStatus(false);
    }
  };

  const getRandomKeyword = async () => {
    try {
      const keyword = await apiService.getRandomKeyword();
      setCurrentKeyword(keyword.keyword);
      setCurrentKeywordId(keyword.id);
    } catch (error) {
      console.error('랜덤 키워드 조회 실패:', error);
      // 백업 키워드
      const backupKeywords = [
        '비 내리는 저녁의 쓸쓸한 골목길',
        '저녁의 노을지는 한적한 공원',
        '퇴근길 버스 정류장',
        '활기찬 놀이터'
      ];
      const randomIndex = Math.floor(Math.random() * backupKeywords.length);
      setCurrentKeyword(backupKeywords[randomIndex]);
      setCurrentKeywordId(1); // 기본값
    }
  };

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
        
        // 백엔드에 업로드 시도
        try {
          // asset 객체를 직접 전달 (파일 변환 없이)
          await apiService.uploadPhoto(asset, selectedUser.id, currentKeywordId);
          Alert.alert('성공', '사진이 업로드되었습니다!');
        } catch (uploadError) {
          console.error('백엔드 업로드 실패:', uploadError);
          Alert.alert('업로드 완료', '사진이 선택되었습니다! (백엔드 연결 확인 중)');
        }
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

  // Bottom Sheet 열기/닫기 애니메이션
  const openSheet = () => {
    setIsSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: height * 0.1, // 상단 여백 10%
      duration: 250,
      useNativeDriver: false,
    }).start();
    // 초기 키워드 로드
    loadKeywords();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: height,
      duration: 220,
      useNativeDriver: false,
    }).start(() => setIsSheetVisible(false));
  };

  // 드래그 제스처로 닫기
  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // 핸들 영역에서만 드래그 시작 허용
        const { pageY } = evt.nativeEvent;
        const sheetTop = height * 0.1;
        return pageY >= sheetTop && pageY <= sheetTop + 40;
      },
      onMoveShouldSetPanResponder: (evt, gesture) => {
        // 핸들 영역에서만 드래그 허용
        const { pageY } = evt.nativeEvent;
        const sheetTop = height * 0.1;
        return pageY >= sheetTop && pageY <= sheetTop + 40 && Math.abs(gesture.dy) > 3;
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          panY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 1.2) {
          closeSheet();
          panY.setValue(0);
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  // 키워드 목록 로드
  const loadKeywords = async () => {
    try {
      setIsKeywordLoading(true);
      const list = await apiService.getKeywords();
      setKeywords(list);
    } catch (e) {
      console.error('키워드 로드 실패:', e);
    } finally {
      setIsKeywordLoading(false);
    }
  };

  // 키워드 검색 (디바운스)
  const handleKeywordSearchChange = (text: string) => {
    setKeywordQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsKeywordLoading(true);
        if (text.trim().length === 0) {
          const list = await apiService.getKeywords();
          setKeywords(list);
        } else {
          const list = await apiService.searchKeywords(text.trim());
          setKeywords(list);
        }
      } catch (e) {
        console.error('키워드 검색 실패:', e);
      } finally {
        setIsKeywordLoading(false);
      }
    }, 300);
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        onScroll={handleScroll}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        scrollEnabled={!isSheetVisible}
      >
      <View style={styles.screen}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.dateButton}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.randomButton} onPress={getRandomKeyword}>
              <Ionicons name="reload" size={15} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listButton} onPress={openSheet}>
              <Ionicons name="list" size={15} color="#000000" />
              <Text style={styles.listButtonText}>영감 목록</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 연결 상태 표시 (개발용) */}
        {connectionStatus !== null && (
          <View style={styles.connectionStatus}>
            <Text style={styles.statusText}>
              {connectionStatus ? '✅ 서버 연결됨' : '❌ 서버 연결 안됨'}
            </Text>
          </View>
        )}

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

      {/* Bottom Sheet Overlay */}
      {isSheetVisible && (
        <TouchableOpacity activeOpacity={1} onPress={closeSheet} style={styles.overlay} />
      )}

      {/* Bottom Sheet */}
      {isSheetVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              top: Animated.add(sheetAnim, panY),
              height: height * 0.9,
            },
          ]}
        >
          <View style={styles.sheetHandle} {...panResponder.panHandlers} />
          <Text style={styles.sheetTitle}>영감 목록</Text>
          <Text style={styles.sheetSubtitle}>최근 키워드와 사진들을 확인하세요</Text>
          {/* 검색 입력 */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="키워드 검색"
              placeholderTextColor="#999999"
              value={keywordQuery}
              onChangeText={handleKeywordSearchChange}
              returnKeyType="search"
            />
          </View>
          {/* 리스트 - ScrollView 밖으로 이동 */}
          {isKeywordLoading ? (
            <View style={styles.keywordLoadingBox}>
              <ActivityIndicator size="small" color="#666666" />
            </View>
          ) : (
            <View style={styles.keywordListContainer}>
              <FlatList
                data={keywords}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.keywordListContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.keywordItem} onPress={() => {
                    setCurrentKeyword(item.keyword);
                    setCurrentKeywordId(item.id);
                    closeSheet();
                  }}>
                    <Text style={styles.keywordTextItem}>{item.keyword}</Text>
                    {item.category ? (
                      <View style={styles.keywordBadge}><Text style={styles.keywordBadgeText}>{item.category}</Text></View>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
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
  connectionStatus: {
    position: 'absolute',
    top: 100,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1000,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 2000,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    paddingTop: 8,
    paddingHorizontal: 16,
    zIndex: 2001,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DADADA',
    marginVertical: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 12,
  },
  placeholderBox: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 6,
  },
  keywordLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  keywordListContent: {
    paddingBottom: 24,
  },
  keywordListContainer: {
    flex: 1,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  keywordTextItem: {
    fontSize: 14,
    color: '#000000',
  },
  keywordBadge: {
    backgroundColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  keywordBadgeText: {
    fontSize: 10,
    color: '#666666',
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
