import 'styled-components';
import { Theme } from './renderer/theme';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
} 