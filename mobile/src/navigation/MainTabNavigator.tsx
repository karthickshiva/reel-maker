import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CaptionScreen } from '../screens/create/CaptionScreen';
import { EditorScreen } from '../screens/create/EditorScreen';
import { ExportScreen } from '../screens/create/ExportScreen';
import { MediaPickerScreen } from '../screens/create/MediaPickerScreen';
import { MusicScreen } from '../screens/create/MusicScreen';
import { SubtitleScreen } from '../screens/create/SubtitleScreen';
import { TemplateApplyScreen } from '../screens/create/TemplateApplyScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { HomeProjectDetailScreen } from '../screens/home/ProjectDetailScreen';
import { TemplatePickerScreen } from '../screens/home/TemplatePickerScreen';
import { LibraryProjectDetailScreen } from '../screens/library/ProjectDetailScreen';
import { ProjectListScreen } from '../screens/library/ProjectListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import type {
  CreateTabParamList,
  HomeTabParamList,
  LibraryTabParamList,
  MainTabParamList,
  ProfileTabParamList,
} from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeTabParamList>();
const CreateStack = createNativeStackNavigator<CreateTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileTabParamList>();

function HomeTabNavigator() {
  return (
    <HomeStack.Navigator initialRouteName="Home">
      <HomeStack.Screen component={HomeScreen} name="Home" />
      <HomeStack.Screen component={TemplatePickerScreen} name="TemplatePicker" />
      <HomeStack.Screen component={HomeProjectDetailScreen} name="ProjectDetail" />
    </HomeStack.Navigator>
  );
}

function CreateTabNavigator() {
  return (
    <CreateStack.Navigator initialRouteName="MediaPicker">
      <CreateStack.Screen component={MediaPickerScreen} name="MediaPicker" />
      <CreateStack.Screen component={TemplateApplyScreen} name="TemplateApply" />
      <CreateStack.Screen component={EditorScreen} name="Editor" />
      <CreateStack.Screen component={CaptionScreen} name="Caption" />
      <CreateStack.Screen component={SubtitleScreen} name="Subtitle" />
      <CreateStack.Screen component={MusicScreen} name="Music" />
      <CreateStack.Screen component={ExportScreen} name="Export" />
    </CreateStack.Navigator>
  );
}

function LibraryTabNavigator() {
  return (
    <LibraryStack.Navigator initialRouteName="ProjectList">
      <LibraryStack.Screen component={ProjectListScreen} name="ProjectList" />
      <LibraryStack.Screen component={LibraryProjectDetailScreen} name="ProjectDetail" />
    </LibraryStack.Navigator>
  );
}

function ProfileTabNavigator() {
  return (
    <ProfileStack.Navigator initialRouteName="Profile">
      <ProfileStack.Screen component={ProfileScreen} name="Profile" />
      <ProfileStack.Screen component={SettingsScreen} name="Settings" />
    </ProfileStack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen component={HomeTabNavigator} name="HomeTab" options={{ title: 'Home' }} />
      <Tab.Screen component={CreateTabNavigator} name="CreateTab" options={{ title: 'Create' }} />
      <Tab.Screen component={LibraryTabNavigator} name="LibraryTab" options={{ title: 'Library' }} />
      <Tab.Screen component={ProfileTabNavigator} name="ProfileTab" options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
