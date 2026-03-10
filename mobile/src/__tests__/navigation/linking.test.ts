import { linking } from '../../navigation/linking';

describe('linking', () => {
  it('maps shared reel URL to Home project detail route pattern', () => {
    const screens = linking.config?.screens;

    if (!screens || typeof screens === 'string') {
      throw new Error('Linking screens config is missing.');
    }

    const main = screens.Main;
    if (typeof main === 'string' || !main?.screens) {
      throw new Error('Main screens config is missing.');
    }

    const homeTab = main.screens.HomeTab;
    if (typeof homeTab === 'string' || !homeTab?.screens) {
      throw new Error('HomeTab screens config is missing.');
    }

    expect(homeTab.screens.ProjectDetail).toBe('reel/:projectId');
  });
});
