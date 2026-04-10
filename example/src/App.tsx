import '../global.css';
import React from 'react';
import { ThemeProvider, BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native';
import { Layers, LayoutGrid, FileText, Activity } from 'lucide-react-native';

import ComponentsScreen from './screens/ComponentsScreen';
import CardsScreen from './screens/CardsScreen';
import FormsScreen from './screens/FormsScreen';
import FeedbackScreen from './screens/FeedbackScreen';

const routes: RouteConfig[] = [
  {
    name: 'Elements',
    component: ComponentsScreen,
    icon: { sfSymbol: 'square.stack.3d.up', component: Layers },
  },
  {
    name: 'Cards',
    component: CardsScreen,
    icon: { sfSymbol: 'rectangle.grid.2x2', component: LayoutGrid },
  },
  {
    name: 'Forms',
    component: FormsScreen,
    icon: { sfSymbol: 'doc.text', component: FileText },
  },
  {
    name: 'Feedback',
    component: FeedbackScreen,
    icon: { sfSymbol: 'waveform.path.ecg', component: Activity },
  },
];

export default function App() {
  return (
    <ThemeProvider defaultScheme="dark">
      <BottomNavigation routes={routes} />
    </ThemeProvider>
  );
}
