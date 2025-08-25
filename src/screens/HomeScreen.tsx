import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image, Alert, PanResponder, TextInput, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageInfo } from 'expo-image-picker';
import { apiService, User, Photo, getImageUrl } from '../services/api';
import { colors } from '../styles/colors';
import ImageUploadScreen from './ImageUploadScreen';

const { height, width } = Dimensions.get('window');

interface HomeScreenProps {
  selectedUser: User;
}

const HomeScreen = forwardRef<any, HomeScreenProps>(({ selectedUser }, ref) => {
  const [currentKeyword, setCurrentKeyword] = useState<string>('');
  const [currentKeywordId, setCurrentKeywordId] = useState<number>(1);
  const [isTodayKeyword, setIsTodayKeyword] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'latest' | 'popular'>('popular');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(height)).current; // 시작은 화면 아래
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywords, setKeywords] = useState<{ id: number; keyword: string; category?: string }[]>([]);
  const [isKeywordLoading, setIsKeywordLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isImageUploadVisible, setIsImageUploadVisible] = useState(false);
  const [keywordPhotos, setKeywordPhotos] = useState<Photo[]>([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);
  const [allKeywordPhotos, setAllKeywordPhotos] = useState<Photo[]>([]);
  const [isAllPhotosLoading, setIsAllPhotosLoading] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<number>>(new Set());

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // 컴포넌트 마운트 시 연결 상태 확인 및 시간 기반 키워드 설정
  useEffect(() => {
    getCurrentTimeBasedKeyword();
  }, []);





  const getCurrentTimeBasedKeyword = async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const isMorning = hour >= 7 && hour < 19; // 7시~19시는 아침, 19시~7시는 저녁
      
      // 시간대별로 다른 키워드 가져오기
      const keyword = await apiService.getTimeBasedKeyword(isMorning);
      console.log('시간 기반 키워드 결과:', keyword);
      setCurrentKeyword(keyword.keyword);
      setCurrentKeywordId(keyword.id);
      setIsTodayKeyword(true);
      // 키워드 변경 시 해당 키워드의 사진들 로드
      loadKeywordPhotos(keyword.id);
      loadAllKeywordPhotos(keyword.id);
    } catch (error) {
      console.error('시간 기반 키워드 조회 실패:', error);
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
      setIsTodayKeyword(true);
      loadKeywordPhotos(1);
      loadAllKeywordPhotos(1);
    }
  };

  const getRandomKeyword = async () => {
    try {
      const keyword = await apiService.getRandomKeyword();
      console.log('랜덤 키워드 결과:', keyword);
      setCurrentKeyword(keyword.keyword);
      setCurrentKeywordId(keyword.id);
      setIsTodayKeyword(false);
      setUploadedPhoto(null); // 키워드 변경 시 업로드된 사진 초기화
      // 키워드 변경 시 해당 키워드의 사진들 로드
      loadKeywordPhotos(keyword.id);
      loadAllKeywordPhotos(keyword.id);
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
      setIsTodayKeyword(false);
      setUploadedPhoto(null); // 키워드 변경 시 업로드된 사진 초기화
      loadKeywordPhotos(1);
      loadAllKeywordPhotos(1);
    }
  };

  // 현재 유저가 현재 키워드에 올린 사진들 로드
  const loadKeywordPhotos = async (keywordId: number) => {
    try {
      setIsPhotosLoading(true);
      console.log('loadKeywordPhotos 호출:', { keywordId, userId: selectedUser.id });
      const photos = await apiService.getPhotos(keywordId, selectedUser.id);
      console.log('loadKeywordPhotos 결과:', photos);
      console.log('첫 번째 사진 데이터:', photos[0]);
      setKeywordPhotos(photos);
    } catch (error) {
      console.error('키워드 사진 로드 실패:', error);
      setKeywordPhotos([]);
    } finally {
      setIsPhotosLoading(false);
    }
  };

  // 현재 키워드의 모든 유저 사진들 로드 (내 사진 제외)
  const loadAllKeywordPhotos = async (keywordId?: number) => {
    try {
      setIsAllPhotosLoading(true);
      const targetKeywordId = keywordId || currentKeywordId;
      const photos = await apiService.getPhotos(targetKeywordId, undefined);
      // 현재 유저의 사진 제외
      const otherUsersPhotos = photos.filter(photo => photo.user_id !== selectedUser.id);
      setAllKeywordPhotos(otherUsersPhotos);
    } catch (error) {
      console.error('전체 키워드 사진 로드 실패:', error);
      setAllKeywordPhotos([]);
    } finally {
      setIsAllPhotosLoading(false);
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

  // 이미지 업로드 Modal 열기
  const handleImageUpload = () => {
    setIsImageUploadVisible(true);
  };

  // 이미지 업로드 성공 처리
  const handleUploadSuccess = (imageUri: string) => {
    setUploadedPhoto(imageUri);
    // 업로드 성공 시 현재 키워드의 사진들 새로고침
    loadKeywordPhotos(currentKeywordId);
    loadAllKeywordPhotos(currentKeywordId);
  };

  // 좋아요 토글 처리
  const handleLikeToggle = async (photoId: number) => {
    try {
      const isLiked = likedPhotos.has(photoId);
      
      if (isLiked) {
        // 좋아요 취소
        await apiService.unlikePhoto(photoId, selectedUser.id);
        setLikedPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
      } else {
        // 좋아요 추가
        await apiService.likePhoto(photoId, selectedUser.id);
        setLikedPhotos(prev => new Set(prev).add(photoId));
      }
      
      // 좋아요 수 업데이트를 위해 사진 목록 새로고침
      loadAllKeywordPhotos(currentKeywordId);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  };

  // 사진 삭제 처리
  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert(
      '사진 삭제',
      '이 사진을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deletePhoto(photoId);
              
              // 삭제 성공 시 사진 목록 새로고침
              await loadKeywordPhotos(currentKeywordId);
              await loadAllKeywordPhotos(currentKeywordId);
              
              // 상태 즉시 업데이트를 위한 강제 리렌더링
              setKeywordPhotos(prev => [...prev]);
              setAllKeywordPhotos(prev => [...prev]);
              
              // uploadedPhoto 상태도 초기화 (키워드 중앙 정렬을 위해)
              setUploadedPhoto(null);
              setImageInfo(null);
              
            } catch (error) {
              console.error('사진 삭제 실패:', error);
              Alert.alert('삭제 실패', '사진을 삭제하는 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'latest' ? 'popular' : 'latest');
  };

  const getSortedPhotos = () => {
    if (sortOrder === 'latest') {
      return [...allKeywordPhotos].sort((a, b) => 
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    } else {
      return [...allKeywordPhotos].sort((a, b) => b.like_count - a.like_count);
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
        bounces={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={(event) => {
          const currentY = event.nativeEvent.contentOffset.y;
          if (currentY <= 0) {
            // 메인화면에서 위로 스크롤 시도 시 차단
            (scrollViewRef.current as any)?.scrollTo({ y: 0, animated: false });
          }
        }}
      >
      <View style={styles.screen}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={isTodayKeyword ? undefined : getCurrentTimeBasedKeyword}
          >
            <Text style={styles.dateText}>
              {isTodayKeyword ? getCurrentDate() : '← 오늘의 키워드로'}
            </Text>
          </TouchableOpacity>
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

        {/* 메인 콘텐츠 */}
        <View style={[
          styles.mainContent,
          (uploadedPhoto || keywordPhotos.length > 0) ? styles.mainContentWithPhoto : styles.mainContentWithoutPhoto
        ]}>
          {/* 키워드 */}
          <Text style={[
            styles.keywordText,
            (uploadedPhoto || keywordPhotos.length > 0) && styles.keywordTextWithPhoto
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

          {/* 현재 유저가 현재 키워드에 올린 사진들 */}
          {keywordPhotos.length > 0 && (
            <View style={styles.userPhotosContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.userPhotosScrollContent}
                snapToInterval={width}
                decelerationRate="fast"
                snapToAlignment="center"
              >
                {keywordPhotos.map((photo) => {
                  // 이미지 URL 처리
                  const imageUrl = getImageUrl(photo.image_path);
                  
                  // 업로드 시간 포맷팅
                  const uploadDate = new Date(photo.uploaded_at);
                  const formattedDate = `${uploadDate.getFullYear()}.${String(uploadDate.getMonth() + 1).padStart(2, '0')}.${String(uploadDate.getDate()).padStart(2, '0')}`;
                  const formattedTime = `${uploadDate.getHours() > 12 ? '오후' : '오전'} ${uploadDate.getHours() % 12 || 12}:${String(uploadDate.getMinutes()).padStart(2, '0')}`;
                  
                  return (
                    <View key={photo.id} style={[
                      styles.userPhotoItem,
                      {
                        width: width - 40,
                        height: height * 0.5
                      }
                    ]}>
                      <Image 
                        source={{ uri: imageUrl }}
                        style={styles.userPhoto}
                        resizeMode="cover"
                        onLoad={() => console.log('이미지 로드 성공:', photo.id, imageUrl)}
                        onError={(error) => console.log('이미지 로드 실패:', photo.id, imageUrl, error)}
                      />
                      {/* 삭제 버튼 */}
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeletePhoto(photo.id)}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </TouchableOpacity>
                      
                      {/* 위치 및 시간 정보 */}
                      <View style={styles.photoInfoContainer}>
                        <View style={styles.photoInfoLeft}>
                          {photo.location ? (
                            <View style={styles.locationInfo}>
                              <Ionicons name="location" size={12} color="#666666" />
                              <Text style={styles.locationText}>{photo.location}</Text>
                            </View>
                          ) : (
                            <View style={styles.locationInfo}>
                              <Ionicons name="location" size={12} color="#CCCCCC" />
                              <Text style={styles.locationTextDisabled}>위치 정보 없음</Text>
                            </View>
                          )}
                          <View style={styles.timeInfo}>
                            <Ionicons name="time" size={12} color="#666666" />
                            <Text style={styles.timeText}>{formattedDate} {formattedTime}</Text>
                          </View>
                        </View>
                        
                        {/* 좋아요 수 표시 - 내가 올린 사진이므로 좋아요 버튼 없이 수만 표시 */}
                        <View style={styles.likeCountDisplay}>
                          <Ionicons name="heart" size={14} color="#FF6B6B" />
                          <Text style={styles.likeCountText}>{photo.like_count}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}


        </View>
        
        {/* 이미지 첨부 버튼 - 하단 고정 */}
        <TouchableOpacity 
          style={styles.imageButtonFixed}
          onPress={handleImageUpload}
        >
          <View style={styles.imageButtonInner}>
            <Ionicons 
              name="camera" 
              size={24} 
              color="#000000" 
            />
          </View>
        </TouchableOpacity>
        
        {/* 스크롤 안내 - 화면 하단 고정 */}
        <TouchableOpacity style={styles.scrollHintFixed}>
          <Ionicons name="chevron-up" size={16} color="#666666" />
          <Text style={styles.scrollHintText}>올려서 다른 사람들의 사진 확인하기</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.secondScreenScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEnabled={allKeywordPhotos.length > 0}
      >
        <View style={styles.secondScreen}>
          {/* 키워드 제목 */}
          <Text style={styles.secondScreenTitle}>{currentKeyword}</Text>
          
          {/* 통계 및 정렬 */}
          <View style={styles.statsContainer}>
            <View style={styles.statsButton}>
              <Text style={styles.statsText}>총 {allKeywordPhotos.length}장의 사진</Text>
            </View>
            <TouchableOpacity style={styles.sortButton} onPress={handleSortToggle}>
              <Ionicons name="swap-vertical" size={15} color="#000000" />
              <Text style={styles.sortText}>{sortOrder === 'latest' ? '최신순' : '인기순'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* 다른 유저들의 사진들 */}
          {allKeywordPhotos.length > 0 ? (
            <View style={styles.allPhotosContainer}>
              {getSortedPhotos().map((photo) => {
                const imageUrl = getImageUrl(photo.image_path);
                
                // 업로드 시간 포맷팅
                const uploadDate = new Date(photo.uploaded_at);
                const formattedDate = `${uploadDate.getFullYear()}.${String(uploadDate.getMonth() + 1).padStart(2, '0')}.${String(uploadDate.getDate()).padStart(2, '0')}`;
                const formattedTime = `${uploadDate.getHours() > 12 ? '오후' : '오전'} ${uploadDate.getHours() % 12 || 12}:${String(uploadDate.getMinutes()).padStart(2, '0')}`;
                
                return (
                  <View key={photo.id} style={styles.allPhotoItem}>
                    <Image 
                      source={{ uri: imageUrl }}
                      style={styles.allPhoto}
                      resizeMode="cover"
                    />
                   
                    {/* 사진 정보 */}
                    <View style={styles.allPhotoInfoContainer}>
                      <View style={styles.photoInfoLeft}>
                        <View style={styles.userInfo}>
                          <Ionicons name="person" size={12} color="#666666" />
                          <Text style={styles.userText}>{photo.user_nickname}</Text>
                        </View>
                        
                        {photo.location ? (
                          <View style={styles.locationInfo}>
                            <Ionicons name="location" size={12} color="#666666" />
                            <Text style={styles.locationText}>{photo.location}</Text>
                          </View>
                        ) : (
                          <View style={styles.locationInfo}>
                            <Ionicons name="location" size={12} color="#CCCCCC" />
                            <Text style={styles.locationTextDisabled}>위치 정보 없음</Text>
                          </View>
                        )}
                        
                        <View style={styles.timeInfo}>
                          <Ionicons name="time" size={12} color="#666666" />
                          <Text style={styles.timeText}>{formattedDate} {formattedTime}</Text>
                        </View>
                      </View>
                      
                      {/* 좋아요 버튼 - 내가 올린 사진이 아닐 때만 표시 */}
                      {photo.user_id !== selectedUser.id && (
                        <TouchableOpacity 
                          style={styles.likeButton}
                          onPress={() => handleLikeToggle(photo.id)}
                        >
                          <Ionicons 
                            name={likedPhotos.has(photo.id) ? "heart" : "heart-outline"} 
                            size={16} 
                            color={likedPhotos.has(photo.id) ? "#FF6B6B" : "#666666"} 
                          />
                          <Text style={[
                            styles.likeCount,
                            { color: likedPhotos.has(photo.id) ? "#FF6B6B" : "#666666" }
                          ]}>
                            {photo.like_count}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyAllPhotos}>
              <Ionicons name="images-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyAllPhotosText}>아직 다른 사람들이 올린 사진이 없어요</Text>
              <Text style={styles.emptyAllPhotosSubtext}>첫 번째로 사진을 올려보세요!</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
                    setIsTodayKeyword(false);
                    setUploadedPhoto(null); // 키워드 변경 시 업로드된 사진 초기화
                    // 키워드 변경 시 해당 키워드의 사진들 로드
                    loadKeywordPhotos(item.id);
                    loadAllKeywordPhotos(item.id);
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

      {/* ImageUploadScreen Modal */}
      <ImageUploadScreen
        selectedUser={selectedUser}
        visible={isImageUploadVisible}
        onClose={() => setIsImageUploadVisible(false)}
        currentKeyword={currentKeyword}
        currentKeywordId={currentKeywordId}
        onUploadSuccess={handleUploadSuccess}
      />
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  mainContentWithoutPhoto: {
    justifyContent: 'center',
    paddingTop: 0,
    marginTop: -height * 0.25,
  },
  mainContentWithPhoto: {
    justifyContent: 'flex-start',
    paddingTop: height * 0.05,
  },
  keywordText: {
    fontSize: 20,
    fontFamily: 'BookkMyungjo-Bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  keywordTextWithPhoto: {
    marginBottom: 30,
  },
  imageButtonFixed: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  imageButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  secondScreenScrollView: {
    height: height,
  },
  secondScreen: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 100,
  },
  secondScreenTitle: {
    fontSize: 20,
    fontFamily: 'BookkMyungjo-Bold',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statsButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    borderRadius: 5,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '400',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 8,
    minWidth: 80,
  },
  sortText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '400',
  },
  allPhotosContainer: {
    paddingHorizontal: 0,
    paddingBottom: 50,
  },
  allPhotosScrollView: {
    flex: 1,
  },
  allPhotosScrollContent: {
    paddingBottom: 150,
  },
  secondScreenSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // 갤러리 관련 스타일
  galleryContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  galleryScrollContent: {
    paddingHorizontal: 20,
  },
  photoItem: {
    width: 120,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryPhoto: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  photoInfo: {
    padding: 8,
  },
  photoLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  photoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyGalleryText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyGallerySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  // 유저 사진 관련 스타일
  userPhotosContainer: {
    marginTop: 0,
    marginBottom: 0,
  },
  userPhotosScrollContent: {
    paddingHorizontal: 0,
  },
  userPhotoItem: {
    width: width - 40,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userPhoto: {
    width: '100%',
    height: '85%',
    borderRadius: 12,
  },
  photoInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeCountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCountText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  locationTextDisabled: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  allPhotoItem: {
    width: width - 40,
    height: height * 0.5,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  allPhotoInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoInfoLeft: {
    flex: 1,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  emptyAllPhotos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: height * 0.6,
  },
  emptyAllPhotosText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyAllPhotosSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
  },
  allPhoto: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
