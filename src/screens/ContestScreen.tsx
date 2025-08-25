import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Alert,
  Image,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { apiService, Contest, User, getImageUrl } from '../services/api';

const { width, height } = Dimensions.get('window');

type TabType = 'all' | 'my' | 'applied';

interface ContestScreenProps {
  selectedUser: User;
}

export default function ContestScreen({ selectedUser }: ContestScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  
  // 공모 참여 모달 상태
  const [isParticipateModalVisible, setIsParticipateModalVisible] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number} | null>(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // 내 공모 사진 보기 모달 상태
  const [isPhotoViewModalVisible, setIsPhotoViewModalVisible] = useState(false);
  const [contestPhotos, setContestPhotos] = useState<Array<{ id: number; user_id: number; user_nickname: string; image_path: string; location?: string; submitted_at: string; description?: string }>>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  
  // 사진 상세 팝업 모달 상태
  const [isPhotoDetailModalVisible, setIsPhotoDetailModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  // 지원한 공모(내 제출 사진) 팝업 상태
  const [isAppliedPhotoModalVisible, setIsAppliedPhotoModalVisible] = useState(false);
  const [appliedPhoto, setAppliedPhoto] = useState<any>(null);

  // 공모 목록 상태
  const [allContests, setAllContests] = useState<Contest[]>([]);
  const [myContests, setMyContests] = useState<Contest[]>([]);
  const [appliedContests, setAppliedContests] = useState<Contest[]>([]);
  const [isLoadingContests, setIsLoadingContests] = useState(false);
  const [contestError, setContestError] = useState<string | null>(null);
  
  // 공모 생성 폼 상태
  const [contestTitle, setContestTitle] = useState('');
  const [contestDescription, setContestDescription] = useState('');
  const [contestReward, setContestReward] = useState('');
  const [rewardError, setRewardError] = useState('');
  
  // 현재 보유 포인트
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [contestDeadline, setContestDeadline] = useState('');

  // 유저 맵 (id -> nickname)
  const [userNicknameById, setUserNicknameById] = useState<Record<number, string>>({});

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  // 오늘 날짜 (시간 제외)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 내일 날짜 (더 확실한 제한을 위해)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  

  
  // 선택된 날짜 초기값을 내일로 설정
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });



  const tabs = [
    { id: 'all', title: '전체 공모' },
    { id: 'my', title: '내 공모' },
    { id: 'applied', title: '지원한 공모' }
  ];

  const handleOpenCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
    // 폼 초기화
    setContestTitle('');
    setContestDescription('');
    setContestReward('');
    setContestDeadline('');
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('날짜 변경 이벤트:', event.type, date);
    setIsDatePickerVisible(false);
    if (date) {
      setSelectedDate(date);
      // 날짜를 YYYY.MM.DD 형식으로 변환
      const formattedDate = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '.');
      setContestDeadline(formattedDate);
    }
  };

  // 공모 참여 모달 관련 함수들
  const handleOpenParticipateModal = (contest: Contest) => {
    setSelectedContest(contest);
    // 전체 공모에서만 참여 모달, 내 공모에서는 사진 보기 모달
    if (activeTab === 'my') {
      setIsPhotoViewModalVisible(true);
      setIsLoadingPhotos(true);
      apiService.getContestPhotos(contest.id)
        .then((photos) => setContestPhotos(photos))
        .catch((e) => {
          console.error('공모 사진 조회 실패:', e);
          Alert.alert('오류', '공모 사진을 불러오는데 실패했습니다.');
        })
        .finally(() => setIsLoadingPhotos(false));
    } else {
      setIsParticipateModalVisible(true);
    }
  };

  const handleCloseParticipateModal = () => {
    setIsParticipateModalVisible(false);
    setSelectedContest(null);
    setSelectedImage(null);
    setImageInfo(null);
    setLocation('');
    setDescription('');
  };

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setImageInfo({ width: asset.width, height: asset.height });
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
    }
  };

  const handleSubmitContestPhoto = async () => {
    if (!selectedImage || !selectedContest) {
      Alert.alert('알림', '이미지를 선택해주세요.');
      return;
    }

    try {
      setIsUploading(true);
      
      await apiService.uploadContestPhoto(
        selectedContest.id,
        selectedImage,
        selectedUser.id,
        location,
        description
      );

      Alert.alert('성공', '공모에 사진이 제출되었습니다!', [
        { text: '확인', onPress: handleCloseParticipateModal }
      ]);
    } catch (error) {
      console.error('공모 사진 업로드 실패:', error);
      Alert.alert('오류', '사진 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClosePhotoViewModal = () => {
    setIsPhotoViewModalVisible(false);
    setContestPhotos([]);
    setSelectedContest(null);
  };

  // 공모 사진 렌더링 함수
  const renderContestPhoto = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: getImageUrl(item.image_path) }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // 사진 클릭 핸들러
  const handlePhotoPress = (photo: any) => {
    setSelectedPhoto(photo);
    setIsPhotoDetailModalVisible(true);
  };

  // 사진 상세 모달 닫기
  const handleClosePhotoDetailModal = () => {
    setIsPhotoDetailModalVisible(false);
    setSelectedPhoto(null);
  };

  // 사진 채택하기
  const handleAdoptPhoto = async (photoId: number) => {
    try {
      if (!selectedContest) {
        Alert.alert('오류', '공모 정보를 찾을 수 없습니다.');
        return;
      }

      await apiService.selectContestPhoto(selectedContest.id, photoId, selectedUser.id);
      
      Alert.alert('성공', '사진이 채택되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            handleClosePhotoDetailModal();
            // 공모 목록 새로고침
            loadContests();
          }
        }
      ]);
    } catch (error) {
      console.error('사진 채택 실패:', error);
      Alert.alert('오류', '사진 채택에 실패했습니다.');
    }
  };

  // 공모 삭제하기
  const handleDeleteContest = async (contest: Contest) => {
    Alert.alert(
      '공모 삭제',
      '정말로 이 공모를 삭제하시겠습니까?\n삭제된 공모는 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteContest(contest.id, selectedUser.id);
              Alert.alert('성공', '공모가 삭제되었습니다.');
              // 공모 목록 새로고침
              loadContests();
            } catch (error) {
              console.error('공모 삭제 실패:', error);
              Alert.alert('오류', '공모 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // 날짜 선택기 애니메이션
  useEffect(() => {
    if (isDatePickerVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isDatePickerVisible]);

  // 공모 목록 로딩 함수
  const loadContests = async () => {
    try {
      setIsLoadingContests(true);
      setContestError(null);
      
      const [allContestsData, myContestsData, appliedContestsData] = await Promise.all([
        apiService.getContests('active'),
        apiService.getMyContests(selectedUser.id),
        apiService.getAppliedContests(selectedUser.id)
      ]);
      
      setAllContests(allContestsData);
      setMyContests(myContestsData);
      setAppliedContests(appliedContestsData);
    } catch (error) {
      console.error('공모 목록 로딩 실패:', error);
      setContestError('공모 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingContests(false);
    }
  };

  // 사용자 포인트 로딩
  useEffect(() => {
    const loadUserPoints = async () => {
          try {
      setIsLoadingPoints(true);
      const points = await apiService.getUserPoints(selectedUser.id);
      setCurrentPoints(points);
      } catch (error) {
        console.error('포인트 로딩 실패:', error);
        Alert.alert('오류', '포인트 정보를 불러오는데 실패했습니다.');
        setCurrentPoints(0);
      } finally {
        setIsLoadingPoints(false);
      }
    };

    loadUserPoints();
  }, []);

  // 공모 목록 로딩
  useEffect(() => {
    loadContests();
  }, []);

  // 유저 닉네임 로드 (전체 공모 탭 표시용)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await apiService.getUsers();
        const map: Record<number, string> = {};
        users.forEach(u => { map[u.id] = u.nickname; });
        setUserNicknameById(map);
      } catch (e) {
        console.error('유저 목록 로딩 실패:', e);
      }
    };
    loadUsers();
  }, []);

  // 탭 변경 시 데이터 새로고침
  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'my' || activeTab === 'applied') {
      loadContests();
    }
  }, [activeTab]);

  // 공모 생성 함수
  const handleCreateContest = async () => {
    // 폼 검증
    if (!contestTitle.trim()) {
      Alert.alert('오류', '공모 제목을 입력해주세요.');
      return;
    }
    
    if (!contestDescription.trim()) {
      Alert.alert('오류', '공모 설명을 입력해주세요.');
      return;
    }
    
    if (!contestReward) {
      Alert.alert('오류', '리워드 포인트를 입력해주세요.');
      return;
    }
    
    if (!contestDeadline) {
      Alert.alert('오류', '공모 기한을 선택해주세요.');
      return;
    }
    
    if (rewardError) {
      Alert.alert('오류', '리워드 포인트를 올바르게 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const contestData = {
        title: contestTitle.trim(),
        description: contestDescription.trim(),
        points: parseInt(contestReward),
        deadline: selectedDate.toISOString()
      };
      
      await apiService.createContest(contestData, selectedUser.id);
      
      Alert.alert('성공', '공모가 성공적으로 생성되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            // 모달 닫기 및 폼 초기화
            setIsCreateModalVisible(false);
            setContestTitle('');
            setContestDescription('');
            setContestReward('');
            setContestDeadline('');
            setRewardError('');
            // 공모 목록 새로고침
            loadContests();
          }
        }
      ]);
      
    } catch (error) {
      console.error('공모 생성 실패:', error);
      Alert.alert('오류', '공모 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공모 카드 컴포넌트
  const renderContestCard = (contest: Contest) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'active':
          return '진행중';
        case 'completed':
          return '마감';
        case 'cancelled':
          return '취소';
        default:
          return '알 수 없음';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return '#4CAF50';
        case 'completed':
          return '#F44336';
        case 'cancelled':
          return '#F44336';
        default:
          return '#999999';
      }
    };

    // 현재 유저가 올린 공모인지, 마감 여부 확인
    const isMyContest = contest.user_id === selectedUser.id;
    const isCompleted = contest.status !== 'active';
    const isDisabled = isCompleted || (activeTab === 'all' && isMyContest);

    return (
      <TouchableOpacity 
        style={[
          styles.contestCard,
          isDisabled && styles.disabledContestCard
        ]}
        activeOpacity={isDisabled ? 1 : 0.7}
        onPress={() => {
          if (activeTab === 'applied') {
            openAppliedPhotoModal(contest);
            return;
          }
          if (!isDisabled) {
            // 공모 참여 모달 열기
            handleOpenParticipateModal(contest);
          }
        }}
      >
        <View style={styles.contestHeader}>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.contestTitle, 
              isDisabled && styles.disabledContestTitle
            ]} numberOfLines={2}>
              {contest.title}
            </Text>
            {isDisabled && (
              <View style={styles.myContestBadge}>
                <Text style={styles.myContestBadgeText}>내 공모</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contest.status) }]}>
              <Text style={styles.statusText}>{getStatusText(contest.status)}</Text>
            </View>
            {/* 전체 공모 탭에서만 업로더 표시 */}
            {activeTab === 'all' && (
              <Text style={styles.uploaderText}>올린 사람: {userNicknameById[contest.user_id] || `유저 ${contest.user_id}`}</Text>
            )}
          </View>
        </View>
        
        <Text style={[
          styles.contestDescription,
          isDisabled && styles.disabledContestDescription
        ]} numberOfLines={3}>
          {contest.description}
        </Text>
        
        <View style={styles.contestFooter}>
          <View style={styles.contestInfo}>
            <Text style={styles.pointsText}>+{contest.points}p</Text>
          </View>
          
          <View style={styles.contestInfo}>
            <Ionicons name="people" size={14} color="#666666" />
            <Text style={styles.photoCountText}>{contest.photo_count}명 참여</Text>
          </View>
          
          <View style={styles.contestInfo}>
            <Ionicons name="time" size={14} color="#666666" />
            <Text style={styles.deadlineText}>
              마감: {formatDate(contest.deadline)}
            </Text>
          </View>
        </View>

        {/* 내 공모 탭에서 마감된 공모에만 삭제 버튼 표시 */}
        {activeTab === 'my' && isCompleted && (
          <View style={styles.deleteButtonContainer}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteContest(contest)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#FF4444" />
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    if (isLoadingContests) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>공모 목록을 불러오는 중...</Text>
        </View>
      );
    }

    if (contestError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{contestError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContests}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'all':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {allContests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>진행중인 공모가 없습니다</Text>
              </View>
            ) : (
              (() => {
                const activeFirstAll = [
                  ...allContests.filter(c => c.status === 'active'),
                  ...allContests.filter(c => c.status !== 'active'),
                ];
                return activeFirstAll.map((contest) => (
                  <View key={contest.id} style={styles.contestCardWrapper}>
                    {renderContestCard(contest)}
                  </View>
                ));
              })()
            )}
          </ScrollView>
        );
      case 'my':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {myContests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>내가 올린 공모가 없습니다</Text>
              </View>
            ) : (
              (() => {
                const activeFirstMy = [
                  ...myContests.filter(c => c.status === 'active'),
                  ...myContests.filter(c => c.status !== 'active'),
                ];
                return activeFirstMy.map((contest) => (
                  <View key={contest.id} style={styles.contestCardWrapper}>
                    {renderContestCard(contest)}
                  </View>
                ));
              })()
            )}
          </ScrollView>
        );
      case 'applied':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {appliedContests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>지원한 공모가 없습니다</Text>
              </View>
            ) : (
              (() => {
                const activeFirstApplied = [
                  ...appliedContests.filter(c => c.status === 'active'),
                  ...appliedContests.filter(c => c.status !== 'active'),
                ];
                return activeFirstApplied.map((contest) => (
                  <View key={contest.id} style={styles.contestCardWrapper}>
                    {renderContestCard(contest)}
                  </View>
                ));
              })()
            )}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  // 내가 올린 사진(지원한 공모용) 불러와서 팝업 열기
  const openAppliedPhotoModal = async (contest: Contest) => {
    try {
      setSelectedContest(contest);
      // 해당 공모의 사진들 중 현재 사용자 제출만 필터
      const photos = await apiService.getContestPhotos(contest.id);
      const mine = photos.find(p => p.user_id === selectedUser.id);
      if (!mine) {
        Alert.alert('알림', '이 공모에 제출한 사진을 찾을 수 없습니다.');
        return;
      }
      setAppliedPhoto(mine);
      setIsAppliedPhotoModalVisible(true);
    } catch (e) {
      console.error('지원 사진 조회 실패:', e);
      Alert.alert('오류', '지원한 사진을 불러오는데 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id as TabType)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      {renderTabContent()}

      {/* 플로팅 액션 버튼 */}
                  <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleOpenCreateModal}
              activeOpacity={0.3}
            >
        <Ionicons name="add" size={24} color="#000000" />
        <Text style={styles.floatingButtonText}>공모 올리기</Text>
      </TouchableOpacity>

      {/* 공모 생성 모달 */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseCreateModal}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>공모 올리기</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 콘텐츠 */}
          <View style={styles.modalContent}>
            {/* 제목 입력 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>제목</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="공모 제목을 입력하세요"
                placeholderTextColor="#999999"
                value={contestTitle}
                onChangeText={setContestTitle}
                maxLength={50}
              />
            </View>

            {/* 설명 입력 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>자세한 설명</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="공모에 대한 자세한 설명을 입력하세요"
                placeholderTextColor="#999999"
                value={contestDescription}
                onChangeText={setContestDescription}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* 리워드 입력 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>리워드</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardInputContainer}>
                  <View style={styles.rewardInputWrapper}>
                    <TextInput
                      style={styles.rewardInput}
                      placeholder="포인트 입력"
                      placeholderTextColor="#999999"
                      value={contestReward}
                      onChangeText={(text) => {
                        // 숫자만 입력 가능
                        const numericValue = text.replace(/[^0-9]/g, '');
                        setContestReward(numericValue);
                        
                        // 100원 단위 검증
                        if (numericValue && parseInt(numericValue) % 100 !== 0) {
                          setRewardError('100p 단위로 입력해주세요');
                        } else if (numericValue && parseInt(numericValue) > currentPoints) {
                          setRewardError(`보유 포인트(${currentPoints}p)를 초과할 수 없습니다`);
                        } else {
                          setRewardError('');
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    {contestReward && <Text style={styles.rewardSuffix}>p</Text>}
                  </View>
                </View>
                <Text style={styles.currentPoints}>
                  {isLoadingPoints ? '로딩 중...' : `보유: ${currentPoints}p`}
                </Text>
              </View>
              {rewardError ? (
                <Text style={styles.rewardError}>{rewardError}</Text>
              ) : (
                <Text style={styles.rewardHint}>100p 단위로 입력하세요</Text>
              )}
            </View>

            {/* 기한 선택 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>공모 기한</Text>
              <TouchableOpacity
                style={styles.deadlineSelector}
                onPress={() => {
                  console.log('날짜 선택기 클릭됨');
                  setIsDatePickerVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.deadlineSelectorText,
                  !contestDeadline && styles.placeholderText
                ]}>
                  {contestDeadline || '기한을 선택하세요'}
                </Text>
                <Ionicons name="calendar" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

                         {/* 날짜 선택기 (모달 내부) */}
             {isDatePickerVisible && Platform.OS === 'android' && (
               <DateTimePicker
                 value={selectedDate}
                 mode="date"
                 display="default"
                 onChange={handleDateChange}
                 minimumDate={tomorrow}
                 locale="ko-KR"
               />
             )}

            {/* iOS용 날짜 선택 (모달 내부) */}
            {isDatePickerVisible && Platform.OS === 'ios' && (
              <View style={styles.datePickerOverlay}>
                <Animated.View 
                  style={[
                    styles.datePickerContainer,
                    { transform: [{ translateY: slideAnim }] }
                  ]}
                >
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                      <Text style={styles.datePickerCancelText}>취소</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>날짜 선택</Text>
                    <TouchableOpacity onPress={() => {
                      handleDateChange({ type: 'set' }, selectedDate);
                    }}>
                      <Text style={styles.datePickerDoneText}>완료</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    minimumDate={tomorrow}
                    style={styles.iosDatePicker}
                    locale="ko-KR"
                  />
                </Animated.View>
              </View>
            )}

            {/* 완료 버튼 */}
            <View style={styles.submitButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPress={handleCreateContest}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? '생성 중...' : '공모 올리기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 공모 참여 모달 */}
      <Modal
        visible={isParticipateModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseParticipateModal}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>공모 참여하기</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 콘텐츠 */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* 공모 정보 */}
            {selectedContest && (
              <>
                {/* 제목과 설명 컨테이너 */}
                <View style={styles.contestInfoSection}>
                  <Text style={styles.contestInfoTitle}>{selectedContest.title}</Text>
                  <Text style={styles.contestInfoDescription}>{selectedContest.description}</Text>
                </View>
                
                {/* 정보 카드들 */}
                <View style={styles.contestInfoCards}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>포인트</Text>
                    <Text style={[styles.infoCardValue, { color: '#F39C12' }]}>+{selectedContest.points}p</Text>
                  </View>
                  
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>참여자</Text>
                    <Text style={styles.infoCardValue}>{selectedContest.photo_count}명</Text>
                  </View>
                  
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>마감일</Text>
                    <Text style={styles.infoCardValue}>
                      {new Date(selectedContest.deadline).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>올린 유저</Text>
                    <Text style={styles.infoCardValue}>유저 {selectedContest.user_id}</Text>
                  </View>
                </View>
              </>
            )}

            {/* 사진 선택 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>사진 선택</Text>
              <TouchableOpacity 
                style={styles.imageSelectButton}
                onPress={handleSelectImage}
                activeOpacity={0.7}
              >
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImage }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.changeImageButton}
                      onPress={handleSelectImage}
                    >
                      <Text style={styles.changeImageText}>사진 변경</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageSelectPlaceholder}>
                    <Ionicons name="camera" size={32} color="#CCCCCC" />
                    <Text style={styles.imageSelectText}>사진을 선택해주세요</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* 위치 정보 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>위치 정보</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="사진을 찍은 위치를 입력하세요"
                placeholderTextColor="#999999"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* 제출 버튼 */}
            <View style={styles.submitButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedImage || !location.trim() || isUploading) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmitContestPhoto}
                disabled={!selectedImage || !location.trim() || isUploading}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>
                  {isUploading ? '업로드 중...' : '공모에 참여하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 공모 사진 조회 모달 (내 공모 탭) */}
      <Modal
        visible={isPhotoViewModalVisible}
        animationType="slide"
     >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClosePhotoViewModal}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>내 공모</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 공모 제목 */}
          <View style={styles.modalContestTitleContainer}>
            <Text style={styles.modalContestTitle}>{selectedContest?.title}</Text>
          </View>

          {/* 공모 설명 */}
          <View style={styles.modalContestDescriptionContainer}>
            <Text style={styles.modalContestDescription}>{selectedContest?.description}</Text>
          </View>

          {/* 공모 정보 (참여자 수, 리워드, 마감일) */}
          <View style={styles.modalContestInfoContainer}>
            <View style={styles.modalContestInfoItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.modalContestInfoText}>{selectedContest?.photo_count || 0}명 참여</Text>
            </View>
            <View style={styles.modalContestInfoItem}>
              <Ionicons name="add" size={16} color="#F39C12" />
              <Text style={[styles.modalContestInfoText, styles.rewardText]}>+{selectedContest?.points || 0}p</Text>
            </View>
            <View style={styles.modalContestInfoItem}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.modalContestInfoText}>
                {selectedContest?.deadline ? new Date(selectedContest.deadline).toLocaleDateString('ko-KR') : '마감일 없음'}
              </Text>
            </View>
          </View>

          {isLoadingPhotos ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>사진을 불러오는 중...</Text>
            </View>
          ) : contestPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>아직 참여한 사진이 없습니다</Text>
            </View>
          ) : (
            <FlatList
              data={contestPhotos}
              renderItem={renderContestPhoto}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.photoGrid}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* 사진 상세 팝업 - 내 공모 모달 내부에 포함 */}
          {isPhotoDetailModalVisible && selectedPhoto && (
            <View style={styles.photoDetailOverlay}>
              <TouchableOpacity 
                style={styles.photoDetailBackground}
                onPress={handleClosePhotoDetailModal}
                activeOpacity={1}
              >
                <View style={styles.photoDetailContent}>
                  <TouchableOpacity 
                    style={styles.photoDetailCloseButton}
                    onPress={handleClosePhotoDetailModal}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.photoDetailImageContainer}>
                    <Image 
                      source={{ uri: getImageUrl(selectedPhoto.image_path) }}
                      style={styles.photoDetailImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <View style={styles.photoDetailInfo}>
                    <View style={styles.photoDetailInfoRow}>
                      <Text style={styles.photoDetailLocation}>
                        {selectedPhoto.location || '위치 정보 없음'}
                      </Text>
                    </View>
                    
                    <View style={styles.photoDetailInfoRow}>
                      <Text style={styles.photoDetailUser}>
                        {selectedPhoto.user_nickname || '알 수 없는 사용자'}
                      </Text>
                      <Text style={styles.photoDetailDate}>
                        {formatDate(selectedPhoto.submitted_at)}
                      </Text>
                    </View>

                    {selectedPhoto.description && (
                      <View style={styles.photoDetailDescriptionContainer}>
                        <Text style={styles.photoDetailDescription}>
                          {selectedPhoto.description}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 채택하기 버튼 */}
                  <View style={styles.adoptButtonContainer}>
                    <TouchableOpacity 
                      style={styles.adoptButton}
                      onPress={() => handleAdoptPhoto(selectedPhoto.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.adoptButtonText}>채택하기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* 지원한 공모 사진 모달 */}
      <Modal
        visible={isAppliedPhotoModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsAppliedPhotoModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>지원한 공모</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 공모 정보 */}
          {selectedContest && (
            <>
              <View style={styles.contestInfoSection}>
                <Text style={styles.contestInfoTitle}>{selectedContest.title}</Text>
                <Text style={styles.contestInfoDescription}>{selectedContest.description}</Text>
              </View>

              <View style={styles.contestInfoCards}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>포인트</Text>
                  <Text style={[styles.infoCardValue, { color: '#F39C12' }]}>+{selectedContest.points}p</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>참여자</Text>
                  <Text style={styles.infoCardValue}>{selectedContest.photo_count}명</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>마감일</Text>
                  <Text style={styles.infoCardValue}>
                    {new Date(selectedContest.deadline).toLocaleDateString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>올린 유저</Text>
                  <Text style={styles.infoCardValue}>유저 {selectedContest.user_id}</Text>
                </View>
              </View>
            </>
          )}

          {/* 사진 정보 */}
          {appliedPhoto && (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>사진</Text>
                <TouchableOpacity 
                  style={styles.imageSelectButton}
                  onPress={() => handleSelectImage} // 이미지 변경은 현재 모달에서 지원하지 않음
                >
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: getImageUrl(appliedPhoto.image_path) }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.changeImageButton}
                      onPress={() => handleSelectImage}
                    >
                      <Text style={styles.changeImageText}>사진 변경</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>위치 정보</Text>
                <TextInput
                  style={styles.locationInput}
                  placeholder="사진을 찍은 위치를 입력하세요"
                  placeholderTextColor="#999999"
                  value={appliedPhoto.location || ''}
                  onChangeText={(text) => {
                    // 위치 정보는 수정할 수 없으므로 무시
                  }}
                  editable={false}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>제출 시간</Text>
                <Text style={styles.infoCardValue}>{formatDate(appliedPhoto.submitted_at)}</Text>
              </View>

              {appliedPhoto.description && (
                <View style={styles.inputSection}>
                  <Text style={styles.sectionTitle}>설명</Text>
                  <Text style={styles.infoCardValue}>{appliedPhoto.description}</Text>
                </View>
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* 내가 지원한 공모 - 내 제출 사진 팝업 */}
      <Modal
        visible={isAppliedPhotoModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsAppliedPhotoModalVisible(false)}
      >
        <View style={styles.photoDetailModalOverlay}>
          <View style={styles.photoDetailModalBackground}>
            <View style={styles.photoDetailModalContent}>
              <TouchableOpacity 
                style={styles.photoDetailCloseButton}
                onPress={() => setIsAppliedPhotoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              {appliedPhoto && (
                <>
                  <View style={styles.photoDetailImageContainer}>
                    <Image 
                      source={{ uri: getImageUrl(appliedPhoto.image_path) }}
                      style={styles.photoDetailImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.photoDetailInfo}>
                    <View style={styles.photoDetailInfoRow}>
                      <Text style={styles.photoDetailLocation}>
                        {appliedPhoto.location || '위치 정보 없음'}
                      </Text>
                    </View>
                    <View style={styles.photoDetailInfoRow}>
                      <Text style={styles.photoDetailUser}>
                        {appliedPhoto.user_nickname || '나'}
                      </Text>
                      <Text style={styles.photoDetailDate}>
                        {formatDate(appliedPhoto.submitted_at)}
                      </Text>
                    </View>
                    {appliedPhoto.description ? (
                      <View style={styles.photoDetailDescriptionContainer}>
                        <Text style={styles.photoDetailDescription}>{appliedPhoto.description}</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'BookkMyungjo-Bold',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'BookkMyungjo-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'BookkMyungjo-Bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'BookkMyungjo-Bold',
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'BookkMyungjo-Bold',
  },
  contestCardWrapper: {
    marginBottom: 16,
  },
  contestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  disabledContestCard: {
    backgroundColor: '#F8F8F8',
    opacity: 0.6,
    borderColor: '#E0E0E0',
  },
  contestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  contestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  disabledContestTitle: {
    color: '#999',
  },
  myContestBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  myContestBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'BookkMyungjo-Bold',
  },
  uploaderText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'BookkMyungjo-Light',
  },
  contestDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'BookkMyungjo-Light',
  },
  disabledContestDescription: {
    color: '#999',
  },
  contestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F39C12',
    fontFamily: 'BookkMyungjo-Bold',
  },
  photoCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'BookkMyungjo-Light',
  },
  deadlineText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'BookkMyungjo-Light',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  floatingButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'BookkMyungjo-Bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 1,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    fontFamily: 'BookkMyungjo-Bold',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontFamily: 'BookkMyungjo-Bold',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 150,
    maxHeight: 300,
    fontFamily: 'BookkMyungjo-Bold',
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  rewardInputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    width: '30%',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPoints: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Pretendard-Regular',
  },
  rewardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
    fontFamily: 'BookkMyungjo-Bold',
  },
  rewardSuffix: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'BookkMyungjo-Bold',
  },

  rewardHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    fontFamily: 'Pretendard-Regular',
  },
  rewardError: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 8,
    fontFamily: 'Pretendard-Regular',
  },
  submitButtonContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  placeholderText: {
    color: '#999999',
  },
  deadlineSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineSelectorText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },

  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'BookkMyungjo-Bold',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  iosDatePicker: {
    backgroundColor: '#FFFFFF',
  },
  contestInfoSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contestInfoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'BookkMyungjo-Light',
  },
  infoCardValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  contestInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'BookkMyungjo-Bold',
  },
  contestInfoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'BookkMyungjo-Light',
  },
  contestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contestInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F39C12',
    fontFamily: 'BookkMyungjo-Bold',
  },
  imageSelectButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  selectedImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
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
  imageSelectPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imageSelectText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
    fontFamily: 'BookkMyungjo-Light',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontFamily: 'BookkMyungjo-Bold',
  },
  photoGrid: {
    paddingHorizontal: 10,
  },

  photoImage: {
    width: '100%',
    height: '100%',
  },

  // 공모 제목 컨테이너
  modalContestTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  // 아카이브 스타일과 동일한 사진 아이템
  photoItem: {
    width: (width - 40) / 2,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  // 공모 설명 컨테이너
  modalContestDescriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalContestDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'BookkMyungjo-Light',
  },
  // 공모 정보 컨테이너
  modalContestInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  modalContestInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalContestInfoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'BookkMyungjo-Bold',
  },
  rewardText: {
    color: '#F39C12',
  },
  // 사진 상세 팝업 모달 스타일 (아카이브와 동일)
  photoDetailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 99999,
    elevation: 99999,
  },
  photoDetailModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailModalContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 15,
    zIndex: 100000,
    elevation: 100000,
  },
  photoDetailCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDetailImageContainer: {
    width: '100%',
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoDetailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoDetailInfo: {
    padding: 20,
  },
  photoDetailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoDetailLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  photoDetailUser: {
    fontSize: 14,
    color: '#666',
  },
  photoDetailDate: {
    fontSize: 12,
    color: '#999',
  },
  photoDetailDescriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  photoDetailDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'BookkMyungjo-Light',
  },
  // 내 공모 모달 내부 사진 상세 팝업 스타일
  photoDetailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 15,
  },
  // 채택하기 버튼 스타일
  adoptButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  adoptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  deleteButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFEBEB',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'BookkMyungjo-Bold',
  },
});
