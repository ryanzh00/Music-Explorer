import { useEffect, useState } from 'react';
import { Container, Divider, Link } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
import SongCard from '../components/SongCard';
const config = require('../config.json');

export default function HomePage() {
  const [songOfTheDay, setSongOfTheDay] = useState({});
  const [author, setAuthor] = useState('');
  const [selectedSongId, setSelectedSongId] = useState(null);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/random`)
      .then(res => res.json())
      .then(resJson => setSongOfTheDay(resJson));

    fetch(`http://${config.server_host}:${config.server_port}/author/name`)
      .then(res => res.json())
      .then(resJson => setAuthor(resJson.data));
  }, []);

  const songColumns = [
    {
      field: 'title',
      headerName: 'Song Title',
      renderCell: (row) => <Link onClick={() => setSelectedSongId(row.song_id)}>{row.title}</Link> // A Link component is used just for formatting purposes
    },
    {
      field: 'album',
      headerName: 'Album Title',
      renderCell: (row) => <NavLink to={`/albums/${row.album_id}`}>{row.album}</NavLink> // A NavLink component is used to create a link to the album page
    },
    {
      field: 'plays',
      headerName: 'Plays'
    },
  ];

  const albumColumns = [
    {
      field: 'title',
      headerName: 'Album Title',
      renderCell: (row) => <NavLink to={`/albums/${row.album_id}`}>{row.title}</NavLink>
    },
    {
      field: 'plays',
      headerName: 'Plays',
    }
  ];

  return (
    <Container>
      {selectedSongId && <SongCard songId={selectedSongId} handleClose={() => setSelectedSongId(null)} />}
      <h2>Check out your song of the day:&nbsp;
        <Link onClick={() => setSelectedSongId(songOfTheDay.song_id)}>{songOfTheDay.title}</Link>
      </h2>
      <Divider />
      <h2>Top Songs</h2>
      <LazyTable route={`http://${config.server_host}:${config.server_port}/top_songs`} columns={songColumns} />
      <Divider />
      <Divider />
      <h2>Top Albums</h2>
      <LazyTable route={`http://${config.server_host}:${config.server_port}/top_albums`}
        columns={albumColumns}
        defaultPageSize={5}
        rowsPerPageOptions={[5, 10]}
      />
      <Divider />
      <p>
        Created by {author}
      </p>
    </Container>
  );
};