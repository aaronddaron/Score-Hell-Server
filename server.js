//From https://www.waldo.com/blog/getting-started-with-websockets-in-ios
const express = require('express');
const { type } = require('os');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var users = new Map();
var bids = [];
var scores = [];
var streaks = [];
var winners = [];
var players = [];
var themes = [];
var numPlayers = 0;
var round = 0;
var ohell = 7;
var cards = [7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7];
var numCards = cards[0]

io.disconnectSockets();
console.log(users);

io.on('connection', (socket) => {
  let username = socket.handshake.auth.username;
  let theme = socket.handshake.auth.theme;
  let tempNames = socket.handshake.auth.names;
  let tempThemes = socket.handshake.auth.themes;

  if (round == 0 && username && !users.get(username)) {
    console.log( username + ' connected');

    socket.join(username);
  
    if (numPlayers > 0) {
        io.in(username).emit('players', players, themes, false);
    }

    numPlayers++;
    //bids.push(0);
    console.log( numPlayers + ' players');
    users.set(username, numPlayers);
    players.push(username);
    themes.push(theme);

    if(tempNames){
      for(let i = 0; i < tempNames.length; i++){
        players.push(tempNames[i]);
        themes.push(tempThemes[i]);
        numPlayers++;
      }
    }

    console.log(users);
    console.log(players);
    console.log(themes);

    socket.broadcast.emit('newPlayer', username, theme);
    
    
  } else if(users.get(username)) {
    console.log(username + ' reconnected');
    
    socket.join(username);

    io.in(username).emit('players', players, themes, true);

    if(round > 0){
      io.in(username).emit('scores', scores, streaks);
      io.in(username).emit('winners', winners);
      io.in(username).emit('game', bids, round, ohell);

    }
  } else {
    socket.in(username).disconnectSockets();
  }

  socket.on('nextRound', () => {
    numCards = cards[round];
    ohell = numCards;
    round++;

    for(let i = 0; i < numPlayers; i++){
      bids[i] = 0;
    }

    leader = 1;
    console.log("Round: " + round + ", Cards: " + numCards + " with " + players[leader] + " leading");
    var tempPlayers = [];
    var tempThemes = [];
    for(let i = 0; i < numPlayers; i++)
    {
        tempThemes[i] = themes[leader];
        tempPlayers[i] = players[leader];
        leader = (leader + 1) % numPlayers;
    }
    themes = tempThemes;
    players = tempPlayers;
    console.log(players);
    console.log(themes);
    socket.broadcast.emit('nextRound');
    socket.broadcast.emit('players', players, themes, true);
   
  });

  socket.on('newPlayer', (name, theme) => {
    console.log("adding " + name);
    numPlayers++;
    bids.push(0);
    players.push(name);
    themes.push(theme);
    socket.broadcast.emit('newPlayer', name, theme);
  });

  socket.on('scores', (tempScores, tempStreaks) => {
    scores = tempScores;
    streaks = tempStreaks;

    console.log("scores: ")
    console.log(scores);
    console.log("streaks: ")
    console.log(streaks);

    socket.broadcast.emit('scores', scores, streaks);
  });
  
  socket.on('bid', (name, bid, num) => {
    ohell = num;
    console.log(name + " bid "  + bid);
    console.log("new ohell num "+ ohell);
    
    for(let i = 0; i < numPlayers; i++){
      if(name == players[i])
      {
        bids[i] = bid;
      }
    }
    console.log("bids: ");
    console.log(bids);
    socket.broadcast.emit('bid', name, bid, ohell);
  });

  socket.on("winners", (tempWinners) => {
    winners = tempWinners;
    console.log(winners);
    socket.broadcast.emit("winners", winners);
  })

  socket.on('start', (leader) => {
    console.log("Starting with " + players[leader] + " leading")
    round++;

    for(let i = 0; i < numPlayers; i++){
      bids[i] = 0;
      scores[i] = 0;
      winners[i] = false;
      streaks[i] = 0;
    }
    

    var tempPlayers = [];
    var tempThemes = [];
    for(let i = 0; i < numPlayers; i++)
    {
        tempThemes[i] = themes[leader];
        tempPlayers[i] = players[leader];
        leader = (leader + 1) % numPlayers
    }
    themes = tempThemes;
    players = tempPlayers;
    console.log(players);
    console.log(themes);

    socket.broadcast.emit("start");
    socket.broadcast.emit('players', players, themes, true);
    
  });

  socket.on('disconnect', () => {
    console.log(username + ' disconnected');
  });
});

server.listen(3030, () => {
  console.log('listening on *:3030');
});