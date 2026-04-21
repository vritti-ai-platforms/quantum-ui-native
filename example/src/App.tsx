import '../global.css';
import React from 'react';
import { ThemeProvider } from '@vritti/quantum-ui-native/theme';
import {
  BottomNavigation,
  type RouteConfig,
} from '@vritti/quantum-ui-native/BottomNavigation';

import ComponentsScreen from './screens/ComponentsScreen';
import CardsScreen from './screens/CardsScreen';
import FormsScreen from './screens/FormsScreen';
import FeedbackScreen from './screens/FeedbackScreen';

const routes: RouteConfig[] = [
  {
    name: 'Elements',
    component: ComponentsScreen,
    icon: { sfSymbol: 'square.stack.3d.up', materialSymbol: 'layers' },
  },
  {
    name: 'Cards',
    component: CardsScreen,
    icon: { sfSymbol: 'rectangle.grid.2x2', materialSymbol: 'grid-view' },
  },
  {
    name: 'Forms',
    component: FormsScreen,
    icon: { sfSymbol: 'doc.text', materialSymbol: 'description' },
  },
  {
    name: 'Feedback',
    component: FeedbackScreen,
    icon: { sfSymbol: 'waveform.path.ecg', materialSymbol: 'monitor-heart' },
  },
];

export default function App() {
  return (
    <ThemeProvider>
      <BottomNavigation routes={routes} />
    </ThemeProvider>
  );
}
