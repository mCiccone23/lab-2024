/* 
 * 01UDFOV Applicazioni Web I / 01TXYOV Web Applications I
 * Lab 1 - Exercise 2 - 2024
 */

import dayjs from "dayjs";
import sqlite from 'sqlite3'

const db = new sqlite.Database('./films.db', (err) => {if(err) throw err})

function Film(id, title, isFavorite = false, watchDate = null, rating = 0, userId = 1) {
  this.id = id;
  this.title = title;
  this.favorite = isFavorite;
  this.rating = rating;
  // saved as dayjs object only if watchDate is truthy
  this.watchDate = watchDate && dayjs(watchDate);
  this.userId = userId

  this.toString = () => {
    return `Id: ${this.id}, ` +
    `Title: ${this.title}, Favorite: ${this.favorite}, ` +
    `Watch date: ${this.watchDate}, Score: ${this.rating}, ` +
    `User: ${this.userId}` ;
  }
}


function FilmLibrary() {
  this.list = [];

  this.addNewFilm = (film) => {
    if(!this.list.some(f => f.id == film.id))
      this.list.push(film);
    else
      throw new Error('Duplicate id');
  };

  this.deleteFilm = (id) => {
    const newList = this.list.filter(function(film, index, arr) {
      return film.id !== id;
    })
    this.list = newList;
  }

  this.resetWatchedFilms = () => {
    this.list.forEach((film) => delete film.watchDate);
  }

  this.getRated = () => {
    const newList = this.list.filter(function(film, index, arr) {
      return film.rating > 0;
    })
    return newList;
  }

  this.sortByDate = () => {
    const newArray = [...this.list];
    newArray.sort((d1, d2) => {
      if(!(d1.watchDate)) return  1;   // null/empty watchDate is the lower value
      if(!(d2.watchDate)) return -1;
      return d1.watchDate.diff(d2.watchDate, 'day')
    });
    return newArray;
  }

  this.getAllFilms = () => {
    return new Promise((resolve, reject) => {
      let arg = [];
      const sql = "SELECT * FROM films"
      db.all(sql, (err, row) => {
          if (err) reject(err)
          else {
            row.forEach((f) => {arg.push(f)})
            resolve(arg)
        }
      }) 
    })
    
  }

  this.getAllPreferiteFilms = () => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM films WHERE isFavorite = 1";
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };


  this.getAllTodayWatched = () => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM films WHERE watchDate = ?";
      db.all(sql, [dayjs().format('YYYY-MM-DD')], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };


  this.getAllBeforeDate = (date) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM films WHERE watchDate < ?";
      db.all(sql, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };

  this.getAllGreaterReating = (n) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM films WHERE rating > ?";
      db.all(sql, [n], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };

  this.getAllContainsString = (stringa) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM films WHERE title LIKE '%'||?||'%'";
      db.all(sql, [stringa], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };


  this.insertNewFilm = (id, title, isFavorite, rating, watchDate, userId) => {
    return new Promise((resolve, reject) =>  {
      const sql = "INSERT INTO films(id, title, isFavorite, rating, watchDate, userId) values(?,?,?,?,?,?)"
      db.run(sql, [id, title, isFavorite, rating, watchDate, userId], (err) => {
        if(err){
          reject(err);
        } else {
          resolve();
        }
      })
    })
  }
  this.deleteFilmById = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM films WHERE id = ?";
      db.run(sql, [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  };

  this.resetWatchDate = () => {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE films SET watchDate = NULL";
      db.run(sql, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes); 
        }
      });
    });
  };
}


function main() {
  // Creating some film entries
  const pulpFiction = new Film(1, "Pulp Fiction", true, "2024-03-10", 5);
  const grams21 = new Film(2, "21 Grams", true, "2024-03-17", 4);
  const starWars = new Film(3, "Star Wars", false);
  const matrix = new Film(4, "Matrix", false);
  const shrek = new Film(5, "Shrek", false, "2024-03-21", 3);

  // Adding the films to the FilmLibrary
  const library = new FilmLibrary();
  library.addNewFilm(pulpFiction);
  library.addNewFilm(grams21);
  library.addNewFilm(starWars);
  library.addNewFilm(matrix);
  library.addNewFilm(shrek);

  // Print Sorted films
  console.log("***** List of films (sorted) *****");
  const sortedFilms = library.sortByDate();
  sortedFilms.forEach((film) => console.log(film.toString()));

  // Deleting film #3
  library.deleteFilm(3);

  // Reset dates
  library.resetWatchedFilms();

  // Printing modified Library
  console.log("***** List of films *****");
  library.list.forEach((item) => console.log(item.toString()));

  // Retrieve and print films with an assigned rating
  console.log("***** Films filtered, only the rated ones *****");
  const ratedFilms = library.getRated();
  ratedFilms.forEach((film) => console.log(film.toString()));


  //test primo punto
  
  const arg = library.getAllFilms();
  console.log("***** Stampa di tutti i film *****");
  arg
  .then(films => {
    films.forEach(film => {
      const filmObj = new Film(film.id, film.title, film.isFavorite, film.watchDate, film.rating, film.userId);
      console.log(filmObj.toString());
    });
  })
/*
  //test secondo punto
  let argfavorite = library.getAllPreferiteFilms();
  argfavorite.then(() => {console.log(argfavorite)});

  //terzo punto
  let argToday = library.getAllTodayWatched();
  argToday.then(() => {console.log(argToday)});

  //quarto punto
  const argBefore = library.getAllBeforeDate(dayjs('2024-03-27').format('YYYY-MM-DD'));
  argBefore.then(() => {console.log(argBefore)});

  //quinto punto
  const argRating = library.getAllGreaterReating(2)
  console.log("greater rating")
  argRating.then(() => {console.log(argRating)});

  //sesto punto
  const argContains = library.getAllContainsString("re");
  argContains.then(() => {console.log(argContains)});
*/
  //library.insertNewFilm(7, "Paura di volare", 1, 3, '2024-03-21', 3).then(() => console.log("film inserito correttamente"));
  //library.deleteFilmById(5).then( (changes) => console.log("numero righe eliminate: ", changes));
   // library.resetWatchDate().then((changes) => console.log("ok: ", changes));



  // Additional instruction to enable debug 
  debugger;
}

main();
