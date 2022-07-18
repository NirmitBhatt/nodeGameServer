const { getuid } = require('process');
const Player = require('./Player');
const Position = require('./Position');

var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server, { 'pingInterval': 10000, 'pingTimeout': 25000 });

app.get('/', (req, res) =>
{
    res.sendFile(__dirname + '/index.html');
});

var players = new Map();
var sockets = new Map();
var interval = null;
var enemySpawnInterval = null;
var started = false;
var enemyPosArray = [{x:-9.24, y:7.08}, {x:8.67, y:6.72}, {x:-5.5, y:-9}, {x:13.7, y:-2}];


io.on('connection', (socket) => {

    console.log("Connection Recieved from " + socket.id);
    var player = new Player(socket.id);
    var currentPlayerID = player.id;
    players.set(currentPlayerID, player);
    sockets.set(socket.id, socket);
    console.log("Player ID for connection " + socket.id + " is " + currentPlayerID);  
    socket.emit('SpawnPlayer', {playerID: currentPlayerID, isMine: true});

    //This spawns older clients on newly joined clients.
    for (let [key, value] of players.entries()) {
      if (key !== player.id)
        {
          socket.emit('SpawnPlayer', {playerID: value.id, isMine: false});
        }
    }

    //This spawns newly joined client on older clients.
    socket.broadcast.emit('SpawnPlayer', {playerID: player.id, isMine: false})

    if(players.size > 1 && !started){
      console.log("Simulation Started");
      started = true;
      interval = setInterval(() => {
        for (let [key1, value1] of players.entries()){
          var curSocket = sockets.get(key1);
          for (let [key2, value2] of players.entries()){
              if(key1 !== key2){
                  curSocket.emit('playerPositionUpdate', value2);
                  // console.log("Player Pos Update " + value2.rotation.x + ", " + value2.rotation.y + ", " + value2.rotation.z);
              }
          }
        }
      }, 33);

      enemySpawnInterval = setInterval(() => {
        var spawnPosition = new Position();
        var randNumber = Math.floor(Math.random() * 3);
        var randPos = enemyPosArray[randNumber];
        spawnPosition.x = randPos.x;
        spawnPosition.y = randPos.y;
        io.emit('spawnEnemy', spawnPosition);
      }, 1500);
    }

    socket.on('updatePlayerPosition', (x, y, z) =>{
      if(player){
          player.position.x = x;
          player.position.y = y;
          player.position.z = z;
          // console.log("Updated Player Position of " + player.id +
          //  " to " + player.position.x + "," + player.position.y + "," + player.position.z);
      }
    });

    socket.on('updatePlayerRotation', (x, y, z) =>{
        if(player){
            player.rotation.x = x;
            player.rotation.y = y;
            player.rotation.z = z;
            // console.log("Updated Player Rotation of " + player.id +
            //  " to " + player.rotation.x + "," + player.rotation.y + "," + player.rotation.z);
        }
    });

    socket.on('playerFire', () =>{
      socket.broadcast.emit('fireBullet', player.id);
  });

    // console.log('a user connected');
    // socket.on('chat message', (msg) => {
    //   io.emit('chat message', msg);
    // });
    socket.on('disconnect', () => {
      players.delete(currentPlayerID);
      sockets.delete(socket.id);
      if(players.size <= 1){
        console.log("Simulation Ended");
        clearInterval(interval);
        clearInterval(enemySpawnInterval);
      }
    });
  });
  server.listen(3000, () => {
    console.log('Connected at 3000');
  });



// server.listen(3000);

// //global variables for the server
// var enemies = [];
// var playerSpawnPoints = [];
// var clients = [];

// app.get('/', function(req,res)
// {
//     res.send('hey you got back get "/"');
// });

// io.on('connection', function(socket)
// {

//     socket.on('disconnect', () => {
//       console.log("Player Disconnected!");
//     });
//     var currentPlayer = {};
//     currentPlayer.name='unknown';

//     socket.on('player connect', function()
//     {
//         console.log(currentPlayer.name+' recv: player connect');
//         for(var i=0; i<clients.length; i++)
//         {
//             var playerConnected = {
//                 name:clients[i].name,
//                 position:clients[i].position,
//                 rotation:clients[i].rotation,
//                 health:clients[i].health
//             };
//             //inform you about other players in the game
//             socket.emit('other player connected', playerConnected);
//             console.log(currentPlayer.name+' emit: other player connected: '+JSON.stringify(playerConnected));
//         }
//     });

//     socket.on('play', function(data)
//     {
//         console.log(currentPlayer.name+' recv: play: '+JSON.stringify(data));
//         //
//         if(clients.length === 0)
//         {
//             numberOfEnemies = data.enemySpawnPoints.length;
//             enemies = [];
//             data.enemySpawnPoints.forEach(function(enemySpawnPoint)
//             {
//                 var enemy = {
//                     name: guid(),
//                     position:enemySpawnPoint.position,
//                     rotation:enemySpawnPoint.rotation,
//                     health: 100
//                 };
//                 enemies.push(enemy);
//             });
//             playerSpawnPoints = [];
//             data.playerSpawnPoints.forEach(function(_playerSpawnPoint)
//             {
//                 var playerSpawnPoint = {
//                     position: _playerSpawnPoint.position,
//                     rotation: _playerSpawnPoint.rotation
//                 };
//                 playerSpawnPoints.push(playerSpawnPoint);
//             });
//         }

//         var enemiesResponse = {
//             enemies: enemies
//         };
//         //
//         console.log(currentPlayer.name+' emit: enemies: '+JSON.stringify(enemiesResponse));
//         socket.emit('enemies', enemiesResponse);
//         var randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)];
//         currentPlayer = {
//             name: data.name,
//             position: randomSpawnPoint.position,
//             rotation: randomSpawnPoint.rotation,
//             health: 100
//         };
//         clients.push(currentPlayer);
//         //
//         console.log(currentPlayer.name+' emit: play: '+JSON.stringify(currentPlayer));
//         //
//         socket.broadcast.emit('other player connected', currentPlayer);
//     });

//     socket.on('player move', function(data)
//     {
//         console.log('recv: move: '+JSON.stringify(data));
//         currentPlayer.position = data.position;
//         socket.broadcast.emit('player move', currentPlayer);
//     });

//     socket.on('player turn', function(data)
//     {
//         console.log('recv: turn: '+JSON.stringify(data));
//         currentPlayer.rotation  = data.rotation;
//         socket.broadcast.emit('player turn', currentPlayer);
//     });

//     socket.on('player shoot', function()
//     {
//         console.log(currentPlayer.name+' recv: shoot');
//         var data = {
//             name: currentPlayer.name
//         };
//         console.log(currentPlayer.name+' bcst: shoot: '+JSON.stringify(data));
//         socket.emit('player shoot', data);
//         socket.broadcast.emit('player shoot', data);
//     });

//     socket.on('health', function(data)
//     {
//         console.log(currentPlayer.name+' recv: health: '+JSON.stringify(data));

//         if(data.from === currentPlayer.name)
//         {
//             var indexDamaged = 0;
//             if(!data.isEnemy)
//             {
//                 clients = clients.map(function(client, index)
//                 {
//                     if(client.name === data.name)
//                     {
//                         indexDamaged = index;
//                         client.health -= data.healthChange;
//                     }
//                     return client;
//                 });
//             }
//             else
//             {
//                 enemies =enemies.map(function(enemy, index)
//                 {
//                     if(enemy.name === data.name)
//                     {
//                         indexDamaged = index;
//                         enemy.health -= data.healthChange;
//                     }
//                     return enemy;
//                 });
//             }

//             var response = {
//                 name: (!data.isEnemy) ? clients[indexDamaged].name : enemies[indexDamaged].name,
//                 health: (!data.isEnemy) ? clients[indexDamaged].health : enemies[indexDamaged].health
//             };
//             console.log(currentPlayer.name+' bcst: health: '+JSON.stringify(response));
//             socket.emit('health', response);
//             socket.broadcast.emit('health', response);
//         }
//     });

// });

console.log('----- server is running', guid());
function guid()
{
    function s4()
    {
        return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() +s4();
}