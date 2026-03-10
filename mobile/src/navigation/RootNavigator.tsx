import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CaptionEditModal } from '../screens/modals/CaptionEditModal';
import { ExportProgressModal } from '../screens/modals/ExportProgressModal';
import { VideoPreviewModal } from '../screens/modals/VideoPreviewModal';
import { useAuthStore } from '../store/useAuthStore';
import type { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ gestureEnabled: true }}>
      {isAuthenticated ? (
        <Stack.Screen component={MainTabNavigator} name="Main" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen component={AuthNavigator} name="Auth" options={{ headerShown: false }} />
      )}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen component={VideoPreviewModal} name="VideoPreviewModal" />
        <Stack.Screen component={CaptionEditModal} name="CaptionEditModal" />
        <Stack.Screen component={ExportProgressModal} name="ExportProgressModal" />
      </Stack.Group>
    </Stack.Navigator>
  );
}
