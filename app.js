const express = require("express");
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "moviesData.db");

const convertDBDataToResponseFormat = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3002, () => {
      console.log("Server running at http:localhost:3002");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initialiseDBAndServer();

app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `SELECT * FROM movie;`;
  const movieNames = await db.all(getMovieNamesQuery);
  response.send(
    movieNames.map((dbObject) => {
      return { movieName: dbObject.movie_name };
    })
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
  INSERT INTO movie(director_id,movie_name,lead_actor) 
  VALUES("${directorId}","${movieName}","${leadActor}")`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`;
  const movieDetails = await db.get(getMovieQuery);
  response.send(convertDBDataToResponseFormat(movieDetails));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `UPDATE movie SET director_id=${directorId},movie_name="${movieName}",lead_actor="${leadActor}" WHERE movie_id=${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie WHERE movie_id=${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT director_id AS directorId,director_name AS    directorName FROM director`;
  const allDirectors = await db.all(getDirectorsQuery);
  response.send(allDirectors);
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesOfDirectorQuery = `
    SELECT 
    movie_name AS movieName
    FROM movie INNER JOIN director ON movie.director_id = director.director_id
    WHERE movie.director_id = ${directorId}
    `;
  const selectedMovies = await db.all(getMoviesOfDirectorQuery);
  response.send(selectedMovies);
});

module.exports = app;
