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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/api';

type TabType = 'all' | 'my' | 'applied';

export default function ContestScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  
  // 공모 생성 폼 상태
  const [contestTitle, setContestTitle] = useState('');
  const [contestDescription, setContestDescription] = useState('');
  const [contestReward, setContestReward] = useState('');
  const [rewardError, setRewardError] = useState('');
  
  // 현재 보유 포인트
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [contestDeadline, setContestDeadline] = useState('');

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
    setSelectedDate(new Date());
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

  // 사용자 포인트 로딩
  useEffect(() => {
    const loadUserPoints = async () => {
      try {
        setIsLoadingPoints(true);
        // TODO: 실제 사용자 ID로 변경 필요
        const userId = 1; // 임시 사용자 ID
        const points = await apiService.getUserPoints(userId);
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
      
      // TODO: 실제 사용자 ID로 변경 필요
      const userId = 1;
      
      const contestData = {
        title: contestTitle.trim(),
        description: contestDescription.trim(),
        points: parseInt(contestReward),
        deadline: contestDeadline
      };
      
      await apiService.createContest(contestData, userId);
      
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>전체 공모 목록</Text>
          </View>
        );
      case 'my':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>내가 올린 공모</Text>
          </View>
        );
      case 'applied':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>지원한 공모</Text>
          </View>
        );
      default:
        return null;
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'BookkMyungjo-Bold',
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
});
