const { nanoid } = require('nanoid');
const Position = require('./Position');

module.exports = class Player{
    constructor(playerID) {
        //this.id = nanoid();
        this.id = playerID;
        this.userName = 'Game Player';
        this.position = new Position();
        this.rotation = new Position();
    }
}