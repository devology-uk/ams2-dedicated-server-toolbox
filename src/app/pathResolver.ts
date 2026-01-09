import { app } from 'electron';
import path from 'path';
import isDev from './isDev.js';

export function getPreloadPath() {
 return path.join(app.getAppPath(), isDev() ? '.' : '..', '/dist-app/preload.cjs');
}