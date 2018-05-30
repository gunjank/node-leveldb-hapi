'use strict';

const Hapi = require('hapi');
const Good = require('good');
const config = require('./server/config/settings');
let db ;



let dbInstance = function (request)
{
	if(!db)
	{
		db = request.server.plugins['hapi-level'].db; // access from a request object 
	}
	return db;
			
}

const server = new Hapi.Server();
server.connection({ port: config.port });



//route - start
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('You server is running!');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});
server.route({
    method: 'POST',
    path: '/v1/cache',
    handler: function (request, reply) {
		//console.log(request.payload);
		let key = encodeURIComponent(request.payload.key);
		let value = encodeURIComponent(request.payload.value);
		console.log(key,value);
		dbInstance(request); // access from a request object 	
		db.put(key,value,function(err){
			if (err)
			{
				console.log('Ooops put failed!', err) // some kind of I/O error	
				const errStr = ''+err;			
				reply ({'error':errStr});
			}	
			else{
				reply({result:'success'});	
			}
				
		})	
    }
});
server.route({
    method: 'GET',
    path: '/v1/cache/{key}/{value}',
    handler: function (request, reply) {
		let key = encodeURIComponent(request.params.key);
		let value = encodeURIComponent(request.params.value);
		dbInstance(request); // access from a request object 	
		db.put(key,value,function(err){
			if (err)
			{
				console.log('Ooops put failed!', err) // some kind of I/O error	
				const errStr = ''+err;			
				reply ({'error':errStr});
			}	
			else{
				reply({result:'success'});	
			}
				
		})	
    }
});
server.route({
    method: 'GET',
    path: '/v1/cache/{key}',
    handler: function (request, reply) {
		
		let key = encodeURIComponent(request.params.key);	
	
		dbInstance(request); // access from a request object 		
		db.get(key, function (err, value) {
		if (err) 
		{
			
			console.log('Ooops get failed!', err) // likely the key was not found	
			const errStr = ''+err;			
			reply ({'error':errStr}).code(404);
		}
		else{
			console.log(key);
			let result = {};
			result.key = key;
			result.value = value;
			reply (result)
		}		
			
		})	
		
    }
});

server.register(require('inert'), (err) => {
    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/hello',
        handler: function (request, reply) {
            reply.file('./public/hello.html');
        }
    });
});

//route end

server.register([
	{
		register: Good,
		options: {
			reporters: [{
				reporter: require('good-console'),
				events: {
					response: '*',
					log: '*'
				}
			}]
		}
	},
	{ 
        register: require('hapi-level'),
        options: {
            path: './mydb', // ./data by default 
            config: {
                valueEncoding: 'json' // utf8 by default as with LevelUP 
            }
        } 
    }
], (err) => {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(() => {
        server.log('info', 'Server running at: ' + server.info.uri);
		
    });
});