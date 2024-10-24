const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10));

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

/******************
 * WARM UP ROUTES *
 ******************/

// Route 1: GET /author/:type
const author = async function(req, res) {
  const name = 'Ryan Zhou';
  const pennkey = 'ryanzh';

  if (req.params.type === 'name') {
    res.json({ data: name });
  } else if (req.params.type === 'pennkey') {
    res.json({ data: pennkey });
  } else {
    res.status(400).json({});
  }
}

// Route 2: GET /random
const random = async function(req, res) {
  const explicit = req.query.explicit === 'true' ? 1 : 0;

  connection.query(`
    SELECT *
    FROM Songs
    WHERE explicit <= ${explicit}
    ORDER BY RANDOM()
    LIMIT 1
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json({
        song_id: data.rows[0].song_id, title: data.rows[0].title
      });
    }
  });
}

/********************************
 * BASIC SONG/ALBUM INFO ROUTES *
 ********************************/

// Route 3: GET /song/:song_id
const song = async function(req, res) {
  const songId = req.params.song_id;
  connection.query(`
    SELECT *
    FROM Songs
    WHERE song_id = '${songId}'
    `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
}

// Route 4: GET /album/:album_id
const album = async function(req, res) {
  const albumId = req.params.album_id;
  connection.query(`
    SELECT *
    FROM Albums
    WHERE album_id = '${albumId}'
    `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
}

// Route 5: GET /albums
const albums = async function(req, res) {
  connection.query(`
    SELECT *
    FROM Albums
    ORDER BY release_date DESC
    `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 6: GET /album_songs/:album_id
const album_songs = async function(req, res) {
  const albumId = req.params.album_id;
  connection.query(`
    SELECT song_id, title, number, duration, plays
    FROM Songs
    WHERE album_id = '${albumId}'
    ORDER BY number ASC
    `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

/************************
 * ADVANCED INFO ROUTES *
 ************************/

// Route 7: GET /top_songs
const top_songs = async function(req, res) {
  const page = req.query.page;
  const pageSize = req.query.page_size ?? 10;

  if (!page) {
    connection.query(`
      SELECT s.song_id, s.title, s.album_id, a.title AS album, s.plays
      FROM Songs s
      JOIN Albums a ON s.album_id = a.album_id
      ORDER BY plays DESC
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
  } else {
    const offset = (page - 1) * pageSize;
    connection.query(`
      SELECT s.song_id, s.title, s.album_id, a.title AS album, s.plays
      FROM Songs s
      JOIN Albums a ON s.album_id = a.album_id
      ORDER BY s.plays DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
  }
}

// Route 8: GET /top_albums
const top_albums = async function(req, res) {
  const page = req.query.page;
  const pageSize = req.query.page_size ?? 10;
  if (!page) {
    connection.query(`
      SELECT a.album_id, a.title, SUM(s.plays) as plays
      FROM Albums a
      JOIN Songs s ON a.album_id = s.album_id
      GROUP BY a.album_id, a.title
      ORDER BY plays DESC
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
  } else {
    const offset = (page - 1) * pageSize;
    connection.query(`
      SELECT a.album_id, a.title, SUM(s.plays) as plays
      FROM Albums a
      JOIN Songs s ON a.album_id = s.album_id
      GROUP BY a.album_id, a.title
      ORDER BY plays DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
  }
}

// Route 9: GET /search_albums
const search_songs = async function(req, res) {
  const title = req.query.title ?? '';
  const durationLow = req.query.duration_low ?? 60;
  const durationHigh = req.query.duration_high ?? 660;
  const playsLow = req.query.plays_low ?? 0;
  const playsHigh = req.query.plays_high ?? 1100000000;
  const danceabilityLow = req.query.danceability_low ?? 0;
  const danceabilityHigh = req.query.danceability_high ?? 1;
  const energyLow = req.query.energy_low ?? 0;
  const energyHigh = req.query.energy_high ?? 1;
  const valenceLow = req.query.valence_low ?? 0;
  const valenceHigh = req.query.valence_high ?? 1;
  const explicit = req.query.explicit === 'true' ? 1 : 0;;

  let query = `
  SELECT song_id, album_id, title, number, duration, plays, danceability, energy, valence, tempo, key_mode, explicit
  FROM Songs
  WHERE duration BETWEEN ${durationLow} AND ${durationHigh}
  AND plays BETWEEN ${playsLow} AND ${playsHigh}
  AND danceability BETWEEN ${danceabilityLow} AND ${danceabilityHigh}
  AND energy BETWEEN ${energyLow} AND ${energyHigh}
  AND valence BETWEEN ${valenceLow} AND ${valenceHigh}
  `;

  if (title) {
    query += ` AND title LIKE '%${title}%'`;
  }
  if (explicit === 0) {
    query += ` AND explicit = 0`;
  }
  query += ` ORDER BY title ASC`;

  connection.query(query, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

module.exports = {
  author,
  random,
  song,
  album,
  albums,
  album_songs,
  top_songs,
  top_albums,
  search_songs,
}