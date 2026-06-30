/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HostScreen from './components/HostScreen';
import RemoteScreen from './components/RemoteScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host" element={<HostScreen />} />
        <Route path="/remote/:roomId?" element={<RemoteScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
