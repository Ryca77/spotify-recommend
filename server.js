var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();
app.use(express.static('public'));

//initial api request
var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('http://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
        if (response.ok) {
            emitter.emit('end', response.body);
        }
        else {
            emitter.emit('error', response.code);
        }
    });
    return emitter;
};

//api request for related artists
var getRelatedArtists = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('http://api.spotify.com/v1/artists/' + id + '/related-artists')
           .end(function(response) {
        if (response.ok) {
            emitter.emit('end', response.body);
        }
        else {
            emitter.emit('error', response.code);
        }
    });
    return emitter;
};

app.get('/search/:name', function(req, res) {
    
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });
    
    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var id = item.artists.items[0].id;
        console.log(id);
        
        var related = getRelatedArtists(id);
        
        related.on('end', function(items) {
            artist.related = items.artists;
            
            res.json(artist);
            
            /*for(var i = 0; i <=20; i++) {
                var names = items.artists[i].name;
                console.log(names);
                
            }*/
        });
    });
    
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
});

app.listen(process.env.PORT || 8080);