import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type HomeTabParamList = {
  Home: undefined;
  TemplatePicker: undefined;
  ProjectDetail: { projectId: string };
};

export type CreateTabParamList = {
  MediaPicker: undefined;
  TemplateApply: undefined;
  Editor: { projectId: string };
  Caption: { projectId: string };
  Subtitle: { projectId: string };
  Music: { projectId: string };
  Export: { projectId: string };
};

export type LibraryTabParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
};

export type ProfileTabParamList = {
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeTabParamList>;
  CreateTab: NavigatorScreenParams<CreateTabParamList>;
  LibraryTab: NavigatorScreenParams<LibraryTabParamList>;
  ProfileTab: NavigatorScreenParams<ProfileTabParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  VideoPreviewModal: { projectId: string };
  CaptionEditModal: { projectId: string; captionId: string };
  ExportProgressModal: { exportJobId: string };
};
