import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { indigo, amber } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import AlbumsPage from './pages/AlbumsPage';
import SongsPage from './pages/SongsPage';
import AlbumInfoPage from './pages/AlbumInfoPage'

export const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: amber,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:album_id" element={<AlbumInfoPage />} />
          <Route path="/songs" element={<SongsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}