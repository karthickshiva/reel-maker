import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from '../types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['reelmaker://', 'https://reelmaker.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          SignUp: 'signup',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              TemplatePicker: 'templates',
              ProjectDetail: 'reel/:projectId',
            },
          },
          CreateTab: {
            screens: {
              MediaPicker: 'create/media',
              TemplateApply: 'create/template',
              Editor: 'create/:projectId/editor',
              Caption: 'create/:projectId/caption',
              Subtitle: 'create/:projectId/subtitle',
              Music: 'create/:projectId/music',
              Export: 'create/:projectId/export',
            },
          },
          LibraryTab: {
            screens: {
              ProjectList: 'library',
              ProjectDetail: 'library/:projectId',
            },
          },
          ProfileTab: {
            screens: {
              Profile: 'profile',
              Settings: 'profile/settings',
            },
          },
        },
      },
      VideoPreviewModal: 'preview/:projectId',
      CaptionEditModal: 'caption/:projectId/:captionId',
      ExportProgressModal: 'export/progress/:exportJobId',
    },
  },
};
