import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { User } from '../services/api';

const Tab = createBottomTabNavigator();

interface TabNavigatorProps {
  selectedUser: User;
}

export default function TabNavigator({ selectedUser }: TabNavigatorProps) {
  const inspirationRef = useRef(null);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Inspiration') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Archive') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Commission') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'MyPhotos') {
            iconName = focused ? 'images' : 'images-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2C2C2C',
        tabBarInactiveTintColor: '#C8C8C8',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Inspiration"
        options={{ tabBarLabel: '영감' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 현재 영감 탭이 활성화된 상태에서 탭을 누르면 첫 번째 화면으로 스크롤
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            
            if (currentRoute.name === 'Inspiration' && inspirationRef.current) {
              e.preventDefault();
              inspirationRef.current.scrollToTop();
            }
          },
        })}
      >
        {() => <HomeScreen ref={inspirationRef} selectedUser={selectedUser} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Archive" 
        component={SearchScreen} 
        options={{ tabBarLabel: '아카이브' }}
      />
      <Tab.Screen 
        name="Commission" 
        component={ProfileScreen} 
        options={{ tabBarLabel: '공모' }}
      />
      <Tab.Screen 
        name="MyPhotos" 
        component={SettingsScreen} 
        options={{ tabBarLabel: '내 사진' }}
      />
    </Tab.Navigator>
  );
}
